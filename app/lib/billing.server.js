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
          trialUsed: shopRecord.subscription?.trialUsed || false,
        },
        usage: { count: 0, periodStart: new Date() },
      },
    });

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
        test: isDev,
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
      },
    });

    // Fresh quota window starts when the new plan activates.
    await resetUsageWindow(shopRecord.id);
  } else {
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
