export const PLAN_IDS = {
  FREE: 1,
  SKIN_CARE: 2,
  HAIR_CARE: 3,
  COMBO: 4,
};

// Shopify's enum names sent to appSubscriptionCreate.
export const PLAN_INTERVALS = {
  EVERY_30_DAYS: "EVERY_30_DAYS",
  ANNUAL: "ANNUAL",
};

// Our internal short codes — what we store in `subscription.interval`
// and what the Plans UI passes back to the action.
export const BILLING_INTERVALS = {
  MONTH: "month",
  YEAR: "year",
};

// Mirrors Shopify's AppSubscriptionStatus enum values we care about.
export const SUBSCRIPTION_STATUS = {
  PENDING: "PENDING", 
  ACTIVE: "ACTIVE",         // The merchant has approved the app subscription
  CANCELLED: "CANCELLED",   // The app subscription has been cancelled.
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
