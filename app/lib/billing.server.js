import prisma from "../db.server";
import shopify, { unauthenticated } from "../shopify.server";
import { sendTemplateMail, buildMergeInfo } from "./mailer.server";
import {
  PLAN_IDS,
  PLAN_INTERVALS,
  BILLING_INTERVALS,
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

// ---------------------------------------------------------------------------
// SMALL HELPERS
// ---------------------------------------------------------------------------

// getAppHost
// → reads SHOPIFY_APP_URL from env and strips the protocol/trailing slash.
//   Used to build the absolute returnUrl that Shopify sends the merchant
//   back to after they approve/decline the charge.
const getAppHost = () => {
  const raw = process.env.SHOPIFY_APP_URL || "";
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
};

// getEmbeddedAppUrl
// → builds the deep link back into the merchant's embedded app inside
//   Shopify admin. Used at the end of confirmBilling to bring the
//   merchant back into our UI after the charge page.
//   • shop  → "my-shop.myshopify.com"
//   • host  → base64 of "<shop>/admin", required by App Bridge
export const getEmbeddedAppUrl = (shop) => {
  const apiKey = process.env.SHOPIFY_API_KEY || shopify?.api?.config?.apiKey;
  const host = Buffer.from(`${shop}/admin`).toString("base64").replace(/=+$/, "");
  return `https://${shop}/admin/apps/${apiKey}?host=${host}`;
};

// normalizeInterval
// → callers (UI, webhook payload, query string) may send strings in
//   different shapes or omit the value entirely. We always store the
//   short code "month"/"year" and only convert to Shopify's enum at the
//   GraphQL boundary. Default = month.
//   • input  → "month" | "year" | undefined
//   • output → BILLING_INTERVALS.MONTH | BILLING_INTERVALS.YEAR
const normalizeInterval = (interval) =>
  interval === BILLING_INTERVALS.YEAR ? BILLING_INTERVALS.YEAR : BILLING_INTERVALS.MONTH;

// toShopifyInterval
// → converts our short code to the Shopify GraphQL enum required by the
//   appSubscriptionCreate mutation.
//   • "month" → "EVERY_30_DAYS"
//   • "year"  → "ANNUAL"
const toShopifyInterval = (interval) =>
  normalizeInterval(interval) === BILLING_INTERVALS.YEAR
    ? PLAN_INTERVALS.ANNUAL
    : PLAN_INTERVALS.EVERY_30_DAYS;

// pickPriceForInterval
// → returns the right price field on a Plan record for the chosen cadence.
//   Plans hold BOTH monthlyPrice and yearlyPrice; this picks one.
const pickPriceForInterval = (plan, interval) =>
  normalizeInterval(interval) === BILLING_INTERVALS.YEAR
    ? plan.yearlyPrice
    : plan.monthlyPrice;

// ---------------------------------------------------------------------------
// READ — getPlans
// ---------------------------------------------------------------------------

// getPlans
// → loader for /app/plans. Returns the full plan catalogue plus the
//   merchant's current state (plan, interval, trial, usage).
//   Variables:
//   • shopRecord       → the Shop document loaded by the route
//   • workingShop      → same record, possibly with refreshed usage window
//   • availablePlans   → all Plan rows from Mongo
//   • currentPlanId    → planId the merchant is *effectively* on (FREE if
//                        their paid sub isn't ACTIVE — see planHelper)
//   • currentInterval  → "month" or "year" from subscription.interval
//   • plansWithStatus  → catalogue with `current` flag added per plan
//   • usage / trial    → computed snapshots for UI
export const getPlans = async ({ shopRecord }) => {
  let workingShop = shopRecord;

  // console.log("workingShop:::")
  // console.dir(workingShop, { depth: true })

  // If the rolling 30-day usage window is over, reset it before reading
  // so the UI doesn't show stale "scans used" numbers.
  if (rolloverUsageIfExpired(workingShop)) {
    workingShop = await prisma.shop.update({
      where: { id: workingShop.id },
      data: {
        usage: {
          count: workingShop.usage.count,
          periodStart: workingShop.usage.periodStart, // After expired set current date
        },
      },
    });
  }

  const availablePlans = await prisma.plan.findMany({ orderBy: { id: "asc" } });
  const currentPlanId = getCurrentPlanId(workingShop);
  const currentInterval = normalizeInterval(workingShop?.subscription?.interval);
  const currentPlan = availablePlans.find((p) => p.id === currentPlanId);

  // Tag each plan with `current = true` only by planId. The UI further
  // checks the selected interval to decide if it's an exact match or a
  // "switch cadence" CTA.
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
      interval: currentInterval, // UI uses this to preselect the toggle
    },
    trial,
    usage,
  };
};

// ---------------------------------------------------------------------------
// WRITE HELPERS — shared by every "subscription ended" path
// ---------------------------------------------------------------------------

// endSubscriptionToFree
// → centralized "drop merchant back to FREE" routine. Used by:
//     1. in-app downgrade        (createPlanSubscription, FREE branch)
//     2. declined/cancelled charge (confirmBilling)
//     3. terminal webhook events  (CANCELLED / EXPIRED / DECLINED)
//   Variables:
//   • shopRecord      → caller-loaded Shop document
//   • freePermissions → entitlements derived from the FREE plan row
//   Side effects on the Shop document:
//   • subscription.id            → null (no Shopify charge anymore)
//   • subscription.planId        → FREE
//   • subscription.interval      → null (no cadence on free)
//   • subscription.status        → null (convention: status is strictly
//                                    about a paid subscription lifecycle;
//                                    FREE shops have no status)
//   • subscription.cancelledAt   → now (history: when the paid sub ended)
//   • usage                       → reset to 0 with new periodStart
//   • permissions                 → free-plan permissions
//   `trialUsed` is preserved so re-upgrading doesn't grant a 2nd trial.
const endSubscriptionToFree = async (shopRecord) => {
  const freePermissions = await getFreePlanPermissions();
  await prisma.shop.update({
    where: { id: shopRecord.id },
    data: {
      subscription: {
        id: null,
        planId: PLAN_IDS.FREE,
        interval: null,
        status: null,
        activatedAt: shopRecord.subscription?.activatedAt || null,
        cancelledAt: new Date(),
        trialEndsAt: null,
        trialUsed: shopRecord.subscription?.trialUsed || false,
      },
      usage: { count: 0, periodStart: new Date() },
      permissions: freePermissions,
    },
  });
};

// cancelActiveSubscription
// → calls Shopify's appSubscriptionCancel mutation for the given sub id.
//   Used when downgrading to FREE in-app. Errors are logged by caller —
//   we don't throw because the merchant still expects a successful UX.
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

// isPartnerDevStore
// → asks Shopify whether this shop is a partner/dev store. Real charges
//   are rejected on dev stores unless `test: true` is passed to the
//   Billing API, so we use this to flip testMode automatically.
//   Returns true if dev store, false otherwise (and false on errors).
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

// ---------------------------------------------------------------------------
// ACTION — createPlanSubscription
// ---------------------------------------------------------------------------

// createPlanSubscription
// → handles the Plans page form submit. Two modes:
//     FREE  → cancel any existing paid sub, mark Shop as free.
//     PAID  → call Shopify appSubscriptionCreate, return confirmationUrl
//             that the client must top-frame redirect to.
//   Inputs:
//   • admin       → authenticated Shopify GraphQL client
//   • shopRecord  → loaded Shop document
//   • planId      → numeric plan id from form
//   • interval    → "month" | "year" (cadence the merchant picked)
//   Local variables of note:
//   • numericPlanId  → planId coerced to number
//   • normalized     → safe "month"/"year" — never undefined
//   • plan           → Plan row from Mongo
//   • price          → picked monthlyPrice or yearlyPrice based on interval
//   • shopifyInterval→ Shopify enum ("EVERY_30_DAYS" or "ANNUAL")
//   • trialDays      → 0 if trial already used, else plan.trialDays
//   • returnUrl      → where Shopify sends the merchant after the charge
//                      page; includes shop+planId+interval so confirmBilling
//                      can reconstruct what was bought
//   • testMode       → true on dev stores or local dev (real money skipped)
//   • appSubscription→ Shopify's response (id + trialDays); we store the id
//   • confirmationUrl→ URL the merchant must land on to approve the charge
export const createPlanSubscription = async ({ admin, shopRecord, planId, interval }) => {
  const numericPlanId = Number(planId);

  if (!numericPlanId || Number.isNaN(numericPlanId)) {
    return { status: 400, body: { success: false, message: "planId is required" } };
  }

  const normalized = normalizeInterval(interval);

  // Same plan AND same interval = nothing to change. Switching cadence on
  // the same plan IS allowed (treated as a fresh subscribe — Shopify will
  // replace the existing sub when the new one becomes ACTIVE).
  const currentPlanId = getCurrentPlanId(shopRecord);
  const currentInterval = normalizeInterval(shopRecord?.subscription?.interval);
  if (numericPlanId === currentPlanId && normalized === currentInterval) {
    return { status: 400, body: { success: false, message: "Already on this plan" } };
  }

  const plan = await prisma.plan.findUnique({ where: { id: numericPlanId } });
  if (!plan) {
    return { status: 404, body: { success: false, message: "Plan not found" } };
  }

  // ----- FREE branch: cancel paid sub (if any) and reset Shop to FREE -----
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

  // ----- PAID branch: create AppSubscription on Shopify ------------------

  // Trial only granted on first paid subscription (trialUsed flag).
  const trialDays =
    !shopRecord.subscription?.trialUsed && plan.trialDays > 0 ? plan.trialDays : 0;

  // Pick price + Shopify enum based on the cadence the merchant selected.
  const price = pickPriceForInterval(plan, normalized);
  const shopifyInterval = toShopifyInterval(normalized);

  const appHost = getAppHost();
  // Forward interval back through returnUrl so confirmBilling knows
  // which cadence to persist (Shopify's response doesn't echo it).
  const returnUrl = `https://${appHost}/api/billing/confirm?shop=${encodeURIComponent(
    shopRecord.shop,
  )}&planId=${plan.id}&interval=${normalized}`;

  const isDevStore = await isPartnerDevStore(admin);
  const testMode = isDevStore || isDev;

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
        // Plan name shown on Shopify's charge page — include cadence so
        // the merchant clearly sees what they're approving.
        name: `${plan.name} (${normalized === BILLING_INTERVALS.YEAR ? "Yearly" : "Monthly"})`,
        returnUrl,
        test: testMode,
        trialDays,
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                price: {
                  amount: parseFloat(price).toFixed(2),
                  currencyCode: plan.currency || "USD",
                },
                interval: shopifyInterval,
              },
            },
          },
        ],
      },
    },
  );

  const json = await resp.json();
  const result = json?.data?.appSubscriptionCreate;
  const { confirmationUrl, userErrors } = result || {};

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

  // NOTE: we intentionally do NOT write anything to the DB here.
  //
  // Earlier this code marked subscription.status = PENDING and stored the new
  // sub id. That caused two bugs:
  //   1. A merchant already on an ACTIVE paid plan who clicked upgrade but
  //      never approved would get flipped to status=PENDING, making
  //      isSubscriptionActive() report false even though Shopify still had
  //      them on an ACTIVE paid sub.
  //   2. Storing the not-yet-approved sub id clobbered the reference to the
  //      currently-active sub, which confused confirmBilling.
  //
  // State should only change when Shopify actually tells us something
  // happened: confirmBilling (merchant approved + returned) or the
  // app_subscriptions/update webhook. Until then, the merchant's DB row
  // reflects their real, entitled plan.

  return {
    status: 200,
    body: { success: true, url: confirmationUrl, trialDays },
  };
};

// ---------------------------------------------------------------------------
// WEBHOOK — onAppSubscriptionUpdate
// ---------------------------------------------------------------------------

// onAppSubscriptionUpdate
// → handler for Shopify's app_subscriptions/update webhook. Catches state
//   changes the in-app flow can't see: trial expiry, failed renewal,
//   merchant-initiated cancel from Shopify admin, admin reactivation.
//   Without this, the DB drifts out of sync with Shopify and merchants
//   keep paid features after their charge ends.
//   Inputs:
//   • shop     → "my-shop.myshopify.com"
//   • payload  → raw webhook JSON; the sub lives at payload.app_subscription
//   Local variables:
//   • sub             → payload.app_subscription
//   • incomingSubId   → Shopify GID of the sub the event refers to
//   • incomingStatus  → new status from Shopify
//   • shopRecord      → our DB document for this shop
//   • storedSubId     → the sub we currently track
//   • baseSub         → preserved-fields object reused by every branch
//   Branches:
//   • ACTIVE     → (re)grant entitlements + set activatedAt if missing
//   • CANCELLED  → endSubscriptionToFree (revoke + reset usage)
//   • EXPIRED    → same
//   • DECLINED   → same
//   • FROZEN     → keep sub row, downgrade permissions to FREE
//   • PENDING/?  → record status only, leave entitlements alone
export const onAppSubscriptionUpdate = async ({ shop, payload }) => {
  const sub = payload?.app_subscription;
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

  // If this event references a sub we don't track (stale/reinstall), skip.
  if (storedSubId && incomingSubId && storedSubId !== incomingSubId) {
    console.log("[billing webhook] subscription id mismatch, ignoring", {
      shop,
      storedSubId,
      incomingSubId,
    });
    return;
  }

  // Object reused as a base for every status branch — keeps fields the
  // webhook doesn't carry (planId, interval, trial info) untouched.
  const baseSub = {
    id: storedSubId,
    planId: shopRecord.subscription?.planId || PLAN_IDS.FREE,
    interval: shopRecord.subscription?.interval || null,
    status: incomingStatus,
    activatedAt: shopRecord.subscription?.activatedAt || null,
    cancelledAt: shopRecord.subscription?.cancelledAt || null,
    trialEndsAt: shopRecord.subscription?.trialEndsAt || null,
    trialUsed: shopRecord.subscription?.trialUsed || false,
  };

  if (incomingStatus === SUBSCRIPTION_STATUS.ACTIVE) {
    // Activation can arrive via webhook before /confirm runs. Re-derive
    // permissions from the stored plan AND — critically — set the trial
    // clock here too. Without this, a merchant whose webhook fires first
    // (e.g. closed the tab right after approving) would end up on a paid
    // plan with trialEndsAt=null → no trial countdown in our UI even
    // though Shopify is actually giving them one.
    //
    // Idempotency: if trialEndsAt already exists (set by /confirm running
    // first), preserve it. Otherwise compute from sub.trial_days in this
    // webhook payload. This way whichever path fires first "wins" and the
    // second one is a no-op on the trial clock.
    const activePlan = await prisma.plan.findUnique({
      where: { id: baseSub.planId },
    });

    const now = new Date();
    const trialDays = Number(sub.trial_days) || 0;
    const trialEndsAt =
      shopRecord.subscription?.trialEndsAt ||
      (trialDays > 0
        ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
        : null);

    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: {
        subscription: {
          ...baseSub,
          activatedAt: shopRecord.subscription?.activatedAt || now,
          trialEndsAt,
          trialUsed: trialEndsAt ? true : baseSub.trialUsed,
        },
        permissions: permissionsForPlan(activePlan),
      },
    });

    if (activePlan && activePlan.id !== PLAN_IDS.FREE) {
      sendTemplateMail({
        to: shopRecord.ownerEmail,
        toName: shopRecord.ownerName,
        templateKey: process.env.ZEPTOMAIL_TEMPLATE_PLAN_UPGRADE,
        mergeInfo: buildMergeInfo({
          shop,
          planName: activePlan.name,
          trialEndsAt: trialEndsAt || null,
        }),
      });
    }
    return;
  }

  if (
    incomingStatus === SUBSCRIPTION_STATUS.CANCELLED ||
    incomingStatus === SUBSCRIPTION_STATUS.EXPIRED ||
    incomingStatus === SUBSCRIPTION_STATUS.DECLINED
  ) {
    const expiredPlan = shopRecord.subscription?.planId
      ? await prisma.plan.findUnique({ where: { id: shopRecord.subscription.planId } })
      : null;
    await endSubscriptionToFree(shopRecord);
    sendTemplateMail({
      to: shopRecord.ownerEmail,
      toName: shopRecord.ownerName,
      templateKey: process.env.ZEPTOMAIL_TEMPLATE_PLAN_EXPIRED,
      mergeInfo: buildMergeInfo({ shop, planName: expiredPlan?.name || "your plan" }),
    });
    return;
  }

  if (incomingStatus === SUBSCRIPTION_STATUS.FROZEN) {
    const frozenPlan = shopRecord.subscription?.planId
      ? await prisma.plan.findUnique({ where: { id: shopRecord.subscription.planId } })
      : null;
    const freePermissions = await getFreePlanPermissions();
    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: { subscription: baseSub, permissions: freePermissions },
    });
    sendTemplateMail({
      to: shopRecord.ownerEmail,
      toName: shopRecord.ownerName,
      templateKey: process.env.ZEPTOMAIL_TEMPLATE_PLAN_EXPIRED,
      mergeInfo: buildMergeInfo({ shop, planName: frozenPlan?.name || "your plan" }),
    });
    return;
  }

  // PENDING / anything else — record status only, no permission change.
  await prisma.shop.update({
    where: { id: shopRecord.id },
    data: { subscription: baseSub },
  });
};

// ---------------------------------------------------------------------------
// CONFIRM — confirmBilling (top-frame redirect after merchant approval)
// ---------------------------------------------------------------------------

// confirmBilling
// → invoked by /api/billing/confirm. Runs on the top frame (no embedded
//   session), so we use unauthenticated.admin() to load the offline
//   session ourselves.
//   Inputs from query string:
//   • shop      → which shop to confirm
//   • chargeId  → Shopify's charge_id query param (numeric); used as
//                 fallback when we don't have subscription.id stored
//   • planId    → which plan was bought (from our returnUrl)
//   • interval  → which cadence was bought ("month" | "year")
//   Local variables:
//   • normalized     → safe "month"/"year"
//   • shopRecord     → Shop document
//   • subscriptionId → either our stored id or built from chargeId
//   • sub            → AppSubscription queried from Shopify
//   • now            → activation timestamp
//   • trialEndsAt    → now + trialDays (null when no trial)
//   • newPlan        → looked up to compute permissions atomically
// Branches mirror the webhook handler so both paths converge on the
// same post-state regardless of which fired first.
export const confirmBilling = async ({ shop, chargeId, planId, interval }) => {
  if (!shop || !planId || Number.isNaN(Number(planId))) {
    return { status: 400, redirect: null, message: "Missing shop or planId" };
  }

  const normalized = normalizeInterval(interval);

  const shopRecord = await prisma.shop.findUnique({ where: { shop } });
  if (!shopRecord) {
    return { status: 404, redirect: null, message: "Shop not found" };
  }

  // chargeId comes from Shopify's returnUrl and always points at the sub the
  // merchant just approved, so it MUST win over any stored subscription.id
  // (which could still be an older ACTIVE sub on the row). Fall back to the
  // stored id only when Shopify didn't echo charge_id for some reason.
  const subscriptionId = chargeId
    ? `gid://shopify/AppSubscription/${chargeId}`
    : shopRecord.subscription?.id || null;

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

    // Idempotent trial clock: if the webhook already stored a trialEndsAt
    // (it fired first), keep it exactly — don't drift by re-computing from
    // a slightly later `now`. Only compute fresh if trialEndsAt is null.
    const trialEndsAt =
      shopRecord.subscription?.trialEndsAt ||
      (sub.trialDays > 0
        ? new Date(now.getTime() + sub.trialDays * 24 * 60 * 60 * 1000)
        : null);

    // Look up the new plan to derive entitlements in the same write — the
    // merchant must not land back with ACTIVE status but old permissions.
    const newPlan = await prisma.plan.findUnique({ where: { id: Number(planId) } });

    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: {
        subscription: {
          id: sub.id,
          planId: Number(planId),
          interval: normalized,
          status: sub.status,
          // activatedAt is also idempotent — preserve the earliest timestamp.
          activatedAt: shopRecord.subscription?.activatedAt || now,
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
    // Merchant declined / sub never activated — drop the dangling sub.id.
    await endSubscriptionToFree(shopRecord);
  } else {
    // PENDING / FROZEN — record status only, keep prior plan info.
    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: {
        subscription: {
          id: shopRecord.subscription?.id || null,
          planId: shopRecord.subscription?.planId || PLAN_IDS.FREE,
          interval: shopRecord.subscription?.interval || null,
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
