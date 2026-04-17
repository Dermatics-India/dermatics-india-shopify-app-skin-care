import Plans from "../models/Plans.js";
import Shop from "../models/Shop.js";
import {
  PLAN_IDS,
  SUBSCRIPTION_STATUS,
  USAGE_PERIOD_DAYS,
} from "../constant/index.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PERIOD_MS = USAGE_PERIOD_DAYS * MS_PER_DAY;

export const getCurrentPlanId = (shopRecord) =>
  shopRecord?.subscription?.planId || PLAN_IDS.FREE;

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
  await Shop.updateOne(
    { _id: shopId },
    { "usage.count": 0, "usage.periodStart": new Date() },
  );
};

export const getPlanForShop = async (shopRecord) => {
  const planId = getCurrentPlanId(shopRecord);
  return Plans.findById(planId).lean();
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

// Atomic increment guarded by quota. Returns { allowed, status, reason }.
// We rollover the period inline first, then use $inc with a usageLimit guard
// so concurrent calls cannot push the counter past the cap.
export const consumeUsage = async (shopRecord, plan) => {
  if (!plan) return { allowed: false, reason: "Plan not found" };

  if (rolloverUsageIfExpired(shopRecord)) {
    await Shop.updateOne(
      { _id: shopRecord._id },
      {
        "usage.count": shopRecord.usage.count,
        "usage.periodStart": shopRecord.usage.periodStart,
      },
    );
  }

  if (plan.isUnlimited) {
    await Shop.updateOne({ _id: shopRecord._id }, { $inc: { "usage.count": 1 } });
    shopRecord.usage.count = (shopRecord.usage.count || 0) + 1;
    return { allowed: true, status: getUsageStatus(shopRecord, plan) };
  }

  const result = await Shop.updateOne(
    {
      _id: shopRecord._id,
      "usage.count": { $lt: plan.usageLimit },
    },
    { $inc: { "usage.count": 1 } },
  );

  if (result.modifiedCount === 0) {
    return {
      allowed: false,
      reason: "Usage limit reached for this billing period",
      status: getUsageStatus(shopRecord, plan),
    };
  }

  shopRecord.usage.count = (shopRecord.usage.count || 0) + 1;
  return { allowed: true, status: getUsageStatus(shopRecord, plan) };
};
