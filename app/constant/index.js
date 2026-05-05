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

export const MS_PER_DAY = 24 * 60 * 60 * 1000; // Milliseconds of the Day 

export const PERIOD_MS = USAGE_PERIOD_DAYS * MS_PER_DAY;
export const DAILY_SCAN_LIMIT = 2;
export const USAGE_PER_SCAN = 0.5;
export const SCAN_WINDOW_MS = 24 * 60 * 60 * 1000; // 24-hour rolling window

export const EVENT_TYPES = {
  SESSION_START: "session_start",
  IMAGE_UPLOAD: "image_upload",
  PRODUCT_RECOMMENDATION: "product_recommendation",
  ANALYSIS_COMPLETE: "analysis_complete",
  DOCTOR_REPORT_DOWNLOAD: "doctor_report_download",
  AI_CHAT_START: "ai_chat_start",
};
