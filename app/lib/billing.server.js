import prisma from "../db.server";
import shopify, { unauthenticated } from "../shopify.server";
import {
  PLAN_IDS,
  PLAN_INTERVALS,
  SUBSCRIPTION_STATUS,
} from "../constant/index.js";
import {
  getCurrentPlanId,
  isInTrial,
  trialDaysRemaining,
  getUsageStatus,
  rolloverUsageIfExpired,
  resetUsageWindow,
  permissionsForPlan,
  getFreePlanPermissions,
} from "./planHelper.server.js";

const isDev = process.env.NODE_ENV !== "production";

const getAppHost = () => {
  const raw = process.env.SHOPIFY_APP_URL || "";
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
};

export const getEmbeddedAppUrl = (shop) => {
  const apiKey = process.env.SHOPIFY_API_KEY || shopify?.api?.config?.apiKey;
  const host = Buffer.from(`${shop}/admin`).toString("base64").replace(/=+$/, "");
  return `https://${shop}/admin/apps/${apiKey}?host=${host}`;
};

// GET /api/plans — catalogue + current plan/trial/usage state, all in one call.
export const getPlans = async ({ shopRecord }) => {
  let workingShop = shopRecord;

  if (rolloverUsageIfExpired(workingShop)) {
    workingShop = await prisma.shop.update({
      where: { id: workingShop.id },
      data: {
        usage: {
          count: workingShop.usage.count,
          periodStart: workingShop.usage.periodStart,
        },
      },
    });
  }

  const availablePlans = await prisma.plan.findMany({ orderBy: { id: "asc" } });
  const currentPlanId = getCurrentPlanId(workingShop);
  const currentPlan = availablePlans.find((p) => p.id === currentPlanId);

  const plansWithStatus = availablePlans.map(({ id, ...rest }) => ({
    ...rest,
    id,
    current: id === currentPlanId,
  }));

  const usage = getUsageStatus(workingShop, currentPlan);
  const trial = {
    inTrial: isInTrial(workingShop),
    daysRemaining: trialDaysRemaining(workingShop),
    endsAt: workingShop?.subscription?.trialEndsAt || null,
    used: Boolean(workingShop?.subscription?.trialUsed),
  };

  return {
    success: true,
    plans: plansWithStatus,
    currentPlan: currentPlan
      ? {
          id: currentPlan.id,
          name: currentPlan.name,
          isUnlimited: currentPlan.isUnlimited,
          featureKeys: currentPlan.featureKeys || [],
        }
      : null,
    subscription: {
      status: workingShop?.subscription?.status || null,
      activatedAt: workingShop?.subscription?.activatedAt || null,
    },
    trial,
    usage,
  };
};

// Centralized "drop to FREE" — used by every code path that ends a paid sub:
// in-app downgrade, declined/cancelled charge in confirmBilling, and the
// app_subscriptions/update webhook for terminal states (CANCELLED, EXPIRED,
// DECLINED). One place to keep the post-cancel shape consistent.
const endSubscriptionToFree = async (shopRecord) => {
  const freePermissions = await getFreePlanPermissions();
  await prisma.shop.update({
    where: { id: shopRecord.id },
    data: {
      subscription: {
        id: null,
        planId: PLAN_IDS.FREE,
        status: SUBSCRIPTION_STATUS.CANCELLED,
        activatedAt: shopRecord.subscription?.activatedAt || null,
        cancelledAt: new Date(),
        trialEndsAt: null,
        // Preserve trialUsed so a re-upgrade doesn't grant a second trial.
        trialUsed: shopRecord.subscription?.trialUsed || false,
      },
      usage: { count: 0, periodStart: new Date() },
      permissions: freePermissions,
    },
  });
};

const cancelActiveSubscription = async (admin, subscriptionId) => {
  if (!subscriptionId) return null;
  const resp = await admin.graphql(
    `#graphql
    mutation AppSubscriptionCancel($id: ID!) {
      appSubscriptionCancel(id: $id) {
        appSubscription { id status }
        userErrors { field message }
      }
    }`,
    { variables: { id: subscriptionId } },
  );
  const json = await resp.json();
  return json?.data?.appSubscriptionCancel;
};

// Shopify's Billing API rejects real charges for apps that aren't publicly
// distributed. Dev stores must use `test: true`; for production stores we
// fall back to `isDev` so local runs against production-type stores still
// exercise the code without real charges.
const isPartnerDevStore = async (admin) => {
  try {
    const resp = await admin.graphql(
      `#graphql
      query ShopPlan {
        shop { plan { partnerDevelopment shopifyPlus } }
      }`,
    );
    const json = await resp.json();
    return Boolean(json?.data?.shop?.plan?.partnerDevelopment);
  } catch (err) {
    console.error("isPartnerDevStore lookup failed:", err?.message || err);
    return false;
  }
};

// POST /api/billing/subscription
// Free → cancel any active sub, downgrade in DB, reset usage.
// Paid → create AppSubscription with trialDays (only if trial unused);
//        caller redirects to the returned confirmationUrl.
export const createPlanSubscription = async ({ admin, shopRecord, planId }) => {
  const numericPlanId = Number(planId);

  if (!numericPlanId || Number.isNaN(numericPlanId)) {
    return { status: 400, body: { success: false, message: "planId is required" } };
  }

  if (numericPlanId === getCurrentPlanId(shopRecord)) {
    return { status: 400, body: { success: false, message: "Already on this plan" } };
  }

  const plan = await prisma.plan.findUnique({ where: { id: numericPlanId } });
  if (!plan) {
    return { status: 404, body: { success: false, message: "Plan not found" } };
  }

  if (plan.id === PLAN_IDS.FREE) {
    try {
      if (shopRecord.subscription?.id) {
        await cancelActiveSubscription(admin, shopRecord.subscription.id);
      }
    } catch (err) {
      console.error("Cancel subscription error:", err.message);
    }

    await endSubscriptionToFree(shopRecord);

    return {
      status: 200,
      body: {
        success: true,
        downgraded: true,
        url: null,
        message: "Downgraded to Free plan",
      },
    };
  }

  // Grant a trial only if the shop hasn't already consumed one.
  const trialDays =
    !shopRecord.subscription?.trialUsed && plan.trialDays > 0 ? plan.trialDays : 0;

  const appHost = getAppHost();
  const returnUrl = `https://${appHost}/api/billing/confirm?shop=${encodeURIComponent(
    shopRecord.shop,
  )}&planId=${plan.id}`;

  // Partner dev stores *must* use test mode; otherwise Shopify rejects the
  // mutation with "Apps without a public distribution cannot use the Billing API".
  const isDevStore = await isPartnerDevStore(admin);
  const testMode = isDevStore || isDev;
  // const testMode = false;

  const resp = await admin.graphql(
    `#graphql
    mutation AppSubscriptionCreate(
      $name: String!,
      $lineItems: [AppSubscriptionLineItemInput!]!,
      $returnUrl: URL!,
      $test: Boolean,
      $trialDays: Int
    ) {
      appSubscriptionCreate(
        name: $name,
        lineItems: $lineItems,
        returnUrl: $returnUrl,
        test: $test,
        trialDays: $trialDays
      ) {
        appSubscription { id trialDays }
        confirmationUrl
        userErrors { field message }
      }
    }`,
    {
      variables: {
        name: plan.name,
        returnUrl,
        test: testMode,
        trialDays,
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                price: {
                  amount: parseFloat(plan.price).toFixed(2),
                  currencyCode: plan.currency || "USD",
                },
                interval: PLAN_INTERVALS.EVERY_30_DAYS,
              },
            },
          },
        ],
      },
    },
  );

  const json = await resp.json();
  const result = json?.data?.appSubscriptionCreate;
  const { confirmationUrl, userErrors, appSubscription } = result || {};

  if (userErrors && userErrors.length > 0) {
    console.error("Shopify billing userErrors:", userErrors);
    const distributionBlocked = userErrors.some((e) =>
      /public distribution/i.test(e?.message || ""),
    );
    if (distributionBlocked) {
      return {
        status: 400,
        body: {
          success: false,
          message:
            "Shopify rejected the charge because this app isn't publicly distributed yet. Install the app on a Shopify development (partner) store to test billing, or set the app's distribution to Public in the Partner Dashboard.",
          errors: userErrors,
        },
      };
    }
    return { status: 400, body: { success: false, errors: userErrors } };
  }

  if (!confirmationUrl) {
    return {
      status: 500,
      body: { success: false, message: "No confirmation URL returned" },
    };
  }

  await prisma.shop.update({
    where: { id: shopRecord.id },
    data: {
      subscription: {
        id: appSubscription?.id || null,
        planId: shopRecord.subscription?.planId || PLAN_IDS.FREE,
        status: SUBSCRIPTION_STATUS.PENDING,
        activatedAt: shopRecord.subscription?.activatedAt || null,
        cancelledAt: shopRecord.subscription?.cancelledAt || null,
        trialEndsAt: shopRecord.subscription?.trialEndsAt || null,
        trialUsed: shopRecord.subscription?.trialUsed || false,
      },
    },
  });

  return {
    status: 200,
    body: { success: true, url: confirmationUrl, trialDays },
  };
};

// Webhook: app_subscriptions/update.
// Fires whenever a subscription transitions state — including events the
// in-app flow never sees: trial expiry without payment method (FROZEN /
// EXPIRED), failed renewal (FROZEN), merchant-initiated cancel from the
// Shopify admin (CANCELLED), or admin-side reactivation (ACTIVE).
// Without this, the DB silently drifts out of sync with Shopify and
// merchants keep paid features after their subscription ends.
export const onAppSubscriptionUpdate = async ({ shop, payload }) => {
  console.log("shop::::", shop)
  console.log("payload::::", payload)
  const sub = payload?.app_subscription;
  console.log("sub::::", sub)
  if (!sub) {
    console.warn("[billing webhook] missing app_subscription payload", { shop });
    return;
  }

  const incomingSubId = sub.admin_graphql_api_id || null;
  const incomingStatus = sub.status;

  const shopRecord = await prisma.shop.findUnique({ where: { shop } });
  if (!shopRecord) {
    console.warn("[billing webhook] no shop record", { shop });
    return;
  }

  const storedSubId = shopRecord.subscription?.id || null;

  // If the webhook references a subscription we don't track, ignore it —
  // it's likely a stale charge from a previous install or a parallel test.
  if (storedSubId && incomingSubId && storedSubId !== incomingSubId) {
    console.log("[billing webhook] subscription id mismatch, ignoring", {
      shop,
      storedSubId,
      incomingSubId,
    });
    return;
  }

  const baseSub = {
    id: storedSubId,
    planId: shopRecord.subscription?.planId || PLAN_IDS.FREE,
    status: incomingStatus,
    activatedAt: shopRecord.subscription?.activatedAt || null,
    cancelledAt: shopRecord.subscription?.cancelledAt || null,
    trialEndsAt: shopRecord.subscription?.trialEndsAt || null,
    trialUsed: shopRecord.subscription?.trialUsed || false,
  };

  if (incomingStatus === SUBSCRIPTION_STATUS.ACTIVE) {
    // Activation can arrive via webhook before the merchant lands back on
    // the confirm route (or instead of it, if they close the tab early).
    // Re-derive permissions from the plan in case this is the activation
    // event itself (state was PENDING locally, now ACTIVE).
    const activePlan = await prisma.plan.findUnique({
      where: { id: baseSub.planId },
    });
    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: {
        subscription: {
          ...baseSub,
          activatedAt: shopRecord.subscription?.activatedAt || new Date(),
        },
        permissions: permissionsForPlan(activePlan),
      },
    });
    return;
  }

  if (
    incomingStatus === SUBSCRIPTION_STATUS.CANCELLED ||
    incomingStatus === SUBSCRIPTION_STATUS.EXPIRED ||
    incomingStatus === SUBSCRIPTION_STATUS.DECLINED
  ) {
    // Covers: merchant cancel from Shopify admin, trial expiry without a
    // valid payment method (EXPIRED), and merchant declining the charge
    // page (DECLINED). Drop to Free, reset usage, and revoke paid module
    // permissions so the storefront widget locks immediately.
    await endSubscriptionToFree(shopRecord);
    return;
  }

  // FROZEN — Shopify holds the subscription (failed renewal, dispute) but
  // it can be reactivated within a grace window. Revoke paid features now
  // so the merchant doesn't keep using them on an unpaid sub; if it goes
  // ACTIVE again the next webhook restores them.
  if (incomingStatus === SUBSCRIPTION_STATUS.FROZEN) {
    const freePermissions = await getFreePlanPermissions();
    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: {
        subscription: baseSub,
        permissions: freePermissions,
      },
    });
    return;
  }

  // PENDING / anything else — record status only, leave entitlements alone.
  await prisma.shop.update({
    where: { id: shopRecord.id },
    data: { subscription: baseSub },
  });
};

// GET /api/billing/confirm — top-frame redirect after merchant approves charge.
// Loads the offline session via unauthenticated.admin, queries the subscription,
// updates our DB, resets usage window, and redirects back into the embedded app.
export const confirmBilling = async ({ shop, chargeId, planId }) => {
  if (!shop || !planId || Number.isNaN(Number(planId))) {
    return { status: 400, redirect: null, message: "Missing shop or planId" };
  }

  const shopRecord = await prisma.shop.findUnique({ where: { shop } });
  if (!shopRecord) {
    return { status: 404, redirect: null, message: "Shop not found" };
  }

  const subscriptionId =
    shopRecord.subscription?.id ||
    (chargeId ? `gid://shopify/AppSubscription/${chargeId}` : null);

  if (!subscriptionId) {
    return { status: 400, redirect: null, message: "No subscription to confirm" };
  }

  const { admin } = await unauthenticated.admin(shop);

  const resp = await admin.graphql(
    `#graphql
    query AppSubscription($id: ID!) {
      node(id: $id) {
        ... on AppSubscription {
          id name status createdAt trialDays currentPeriodEnd
        }
      }
    }`,
    { variables: { id: subscriptionId } },
  );
  const json = await resp.json();
  const sub = json?.data?.node;
  if (!sub) {
    return { status: 404, redirect: null, message: "Subscription not found" };
  }

  if (sub.status === SUBSCRIPTION_STATUS.ACTIVE) {
    const now = new Date();
    const trialEndsAt =
      sub.trialDays > 0
        ? new Date(now.getTime() + sub.trialDays * 24 * 60 * 60 * 1000)
        : null;

    // Look up the plan now so we can grant the right entitlements atomically
    // with the subscription flip — otherwise the merchant lands back in the
    // app with an ACTIVE paid sub but the old (free) module permissions.
    const newPlan = await prisma.plan.findUnique({ where: { id: Number(planId) } });

    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: {
        subscription: {
          id: sub.id,
          planId: Number(planId),
          status: sub.status,
          activatedAt: now,
          cancelledAt: null,
          trialEndsAt,
          trialUsed: trialEndsAt ? true : shopRecord.subscription?.trialUsed || false,
        },
        permissions: permissionsForPlan(newPlan),
      },
    });

    // Fresh quota window starts when the new plan activates.
    await resetUsageWindow(shopRecord.id);
  } else if (
    sub.status === SUBSCRIPTION_STATUS.DECLINED ||
    sub.status === SUBSCRIPTION_STATUS.CANCELLED ||
    sub.status === SUBSCRIPTION_STATUS.EXPIRED
  ) {
    // Merchant declined the charge page or the new sub never became active.
    // Drop the dangling sub.id and revert to FREE so we don't leave a
    // half-created paid subscription on the record.
    await endSubscriptionToFree(shopRecord);
  } else {
    // PENDING / FROZEN — keep prior plan info, just record the new status.
    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: {
        subscription: {
          id: shopRecord.subscription?.id || null,
          planId: shopRecord.subscription?.planId || PLAN_IDS.FREE,
          status: sub.status,
          activatedAt: shopRecord.subscription?.activatedAt || null,
          cancelledAt: shopRecord.subscription?.cancelledAt || null,
          trialEndsAt: shopRecord.subscription?.trialEndsAt || null,
          trialUsed: shopRecord.subscription?.trialUsed || false,
        },
      },
    });
  }

  return { status: 200, redirect: getEmbeddedAppUrl(shop) };
};
