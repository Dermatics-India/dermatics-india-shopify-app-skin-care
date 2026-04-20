export const PLAN_IDS = {
  FREE: 1,
  SKIN_CARE: 2,
  HAIR_CARE: 3,
  COMBO: 4,
};

export const PLAN_INTERVALS = {
  EVERY_30_DAYS: "EVERY_30_DAYS",
  ANNUAL: "ANNUAL",
};

// Mirrors Shopify's AppSubscriptionStatus enum values we care about.
export const SUBSCRIPTION_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  DECLINED: "DECLINED",
  FROZEN: "FROZEN",
};

// Symbolic feature keys — paid plans declare which they unlock via Plans.featureKeys.
export const FEATURE_KEYS = {
  SKIN_ANALYSIS: "skin_analysis",
  HAIR_ANALYSIS: "hair_analysis",
};

// Usage window — every shop's quota resets on this rolling period.
export const USAGE_PERIOD_DAYS = 30;

// Default trial length for paid plans (each plan can override via Plans.trialDays).
export const DEFAULT_TRIAL_DAYS = 7;
