import { PLAN_IDS, FEATURE_KEYS } from "./index.js";

// Each plan exposes BOTH prices. The merchant picks the cadence on the
// Plans page; the chosen interval gets stored on `subscription.interval`.
// No discount applied right now (dev stage) — yearly is just monthly × 12.
export const plansData = [
  {
    _id: PLAN_IDS.FREE,
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect for testing the AI flow.",
    features: ["10 scans / month", "Basic Skin & Hair Analysis", "Standard Widget UI"],
    featureKeys: [FEATURE_KEYS.SKIN_ANALYSIS, FEATURE_KEYS.HAIR_ANALYSIS],
    usageLimit: 10,
    trialDays: 0,
  },
  {
    _id: PLAN_IDS.SKIN_CARE,
    name: "Skin Care",
    monthlyPrice: 19,
    yearlyPrice: 228,
    description: "Dedicated skin diagnostic tools.",
    features: ["1000 Skin Scans / month", "Custom UI Colors", "Advanced Skin Metrics"],
    featureKeys: [FEATURE_KEYS.SKIN_ANALYSIS],
    usageLimit: 1000,
    trialDays: 0,
  },
  {
    _id: PLAN_IDS.HAIR_CARE,
    name: "Hair Care",
    monthlyPrice: 19,
    yearlyPrice: 228,
    description: "Dedicated hair diagnostic tools.",
    features: ["1000 Hair Scans / month", "Scalp Analysis", "Product Recommendations"],
    featureKeys: [FEATURE_KEYS.HAIR_ANALYSIS],
    usageLimit: 1000,
    trialDays: 0,
  },
  {
    _id: PLAN_IDS.COMBO,
    name: "Combo",
    monthlyPrice: 29,
    yearlyPrice: 348,
    description: "The complete Dermatics experience.",
    features: ["1500 Skin & Hair Scans / month", "Priority AI Processing", "Custom Branding"],
    featureKeys: [FEATURE_KEYS.SKIN_ANALYSIS, FEATURE_KEYS.HAIR_ANALYSIS],
    usageLimit: 1500,
    trialDays: 0,
  }
];
