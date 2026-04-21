import prisma from "../db.server";
import {
  PLAN_IDS,
  SUBSCRIPTION_STATUS,
  USAGE_PERIOD_DAYS,
  FEATURE_KEYS,
} from "../constant/index.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PERIOD_MS = USAGE_PERIOD_DAYS * MS_PER_DAY;

const getStoredPlanId = (shopRecord) =>
  shopRecord?.subscription?.planId || PLAN_IDS.FREE;

// A paid plan only "counts" while its Shopify subscription is ACTIVE.
// If status drifts (missed webhook, expired sub still in DB, etc.) callers
// see FREE — entitlements, usage limits, and UI stay consistent without
// requiring the row to be rewritten first.
export const getCurrentPlanId = (shopRecord) => {
  const planId = getStoredPlanId(shopRecord);
  if (planId === PLAN_IDS.FREE) return PLAN_IDS.FREE;
  const status = shopRecord?.subscription?.status;
  return status === SUBSCRIPTION_STATUS.ACTIVE ? planId : PLAN_IDS.FREE;
};

export const isFreePlan = (shopRecord) =>
  getCurrentPlanId(shopRecord) === PLAN_IDS.FREE;

export const isInTrial = (shopRecord) => {
  const end = shopRecord?.subscription?.trialEndsAt;
  return Boolean(end && new Date(end).getTime() > Date.now());
};

export const trialDaysRemaining = (shopRecord) => {
  const end = shopRecord?.subscription?.trialEndsAt;
  if (!end) return 0;
  const ms = new Date(end).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / MS_PER_DAY) : 0;
};

// Free plan is always "active". Paid plans must be ACTIVE in our DB
// (Shopify webhook / confirm endpoint keeps this in sync).
export const isSubscriptionActive = (shopRecord) => {
  if (isFreePlan(shopRecord)) return true;
  return shopRecord?.subscription?.status === SUBSCRIPTION_STATUS.ACTIVE;
};

const isUsagePeriodExpired = (shopRecord) => {
  const start = shopRecord?.usage?.periodStart;
  if (!start) return true;
  return Date.now() - new Date(start).getTime() >= PERIOD_MS;
};

export const periodEndsAt = (shopRecord) => {
  const start = shopRecord?.usage?.periodStart || new Date();
  return new Date(new Date(start).getTime() + PERIOD_MS);
};

// Resets the rolling usage window in-place when expired. Caller persists.
export const rolloverUsageIfExpired = (shopRecord) => {
  if (!isUsagePeriodExpired(shopRecord)) return false;
  shopRecord.usage = { count: 0, periodStart: new Date() };
  return true;
};

// Forced reset — called when plan changes so quota starts fresh.
export const resetUsageWindow = async (shopId) => {
  await prisma.shop.update({
    where: { id: shopId },
    data: {
      usage: { count: 0, periodStart: new Date() },
    },
  });
};

export const getPlanForShop = async (shopRecord) => {
  const planId = getCurrentPlanId(shopRecord);
  return prisma.plan.findUnique({ where: { id: planId } });
};

export const getUsageStatus = (shopRecord, plan) => {
  const count = shopRecord?.usage?.count || 0;
  const limit = plan?.isUnlimited ? null : plan?.usageLimit || 0;
  const remaining = plan?.isUnlimited
    ? null
    : Math.max(0, limit - count);
  return {
    count,
    limit,
    remaining,
    unlimited: Boolean(plan?.isUnlimited),
    periodEndsAt: periodEndsAt(shopRecord),
  };
};

export const planUnlocksFeature = (plan, featureKey) =>
  Array.isArray(plan?.featureKeys) && plan.featureKeys.includes(featureKey);

// Maps a Plan's featureKeys → the Shop.permissions shape stored in Mongo.
// Single source of truth for entitlements: paid → upgrade unlocks, trial end /
// cancel / downgrade collapses to whatever the FREE plan declares.
export const permissionsForPlan = (plan) => ({
  skinEnabled: planUnlocksFeature(plan, FEATURE_KEYS.SKIN_ANALYSIS),
  hairEnabled: planUnlocksFeature(plan, FEATURE_KEYS.HAIR_ANALYSIS),
});

// Loads the FREE plan record so we can derive the post-cancel permission set
// without hardcoding it. Falls back to all-disabled if the FREE plan is missing.
export const getFreePlanPermissions = async () => {
  const freePlan = await prisma.plan.findUnique({ where: { id: PLAN_IDS.FREE } });
  return permissionsForPlan(freePlan);
};

// Atomic-ish increment guarded by quota. Returns { allowed, status, reason }.
// We rollover the period inline first, then use a conditional updateMany
// (count < usageLimit) so concurrent calls cannot push the counter past the cap.
export const consumeUsage = async (shopRecord, plan) => {
  if (!plan) return { allowed: false, reason: "Plan not found" };

  if (rolloverUsageIfExpired(shopRecord)) {
    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: {
        usage: {
          count: shopRecord.usage.count,
          periodStart: shopRecord.usage.periodStart,
        },
      },
    });
  }

  if (plan.isUnlimited) {
    const nextCount = (shopRecord.usage?.count || 0) + 1;
    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: {
        usage: {
          count: nextCount,
          periodStart: shopRecord.usage?.periodStart || new Date(),
        },
      },
    });
    shopRecord.usage.count = nextCount;
    return { allowed: true, status: getUsageStatus(shopRecord, plan) };
  }

  // Guard against overshoot under concurrency: updateMany with a count filter.
  const currentCount = shopRecord.usage?.count || 0;
  const result = await prisma.shop.updateMany({
    where: {
      id: shopRecord.id,
      usage: { is: { count: { lt: plan.usageLimit } } },
    },
    data: {
      usage: {
        count: currentCount + 1,
        periodStart: shopRecord.usage?.periodStart || new Date(),
      },
    },
  });

  if (result.count === 0) {
    return {
      allowed: false,
      reason: "Usage limit reached for this billing period",
      status: getUsageStatus(shopRecord, plan),
    };
  }

  shopRecord.usage.count = currentCount + 1;
  return { allowed: true, status: getUsageStatus(shopRecord, plan) };
};
