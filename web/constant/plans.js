import { PLAN_NAMES, PLAN_INTERVALS } from "./index.js";

export const plansData = [
  {
    planId: PLAN_NAMES.FREE,
    name: "Free",
    price: 0,
    description: "Perfect for testing the AI flow.",
    features: ["100 scans / month", "Basic Skin Analysis", "Standard Widget UI"],
    isUnlimited: false,
    usageLimit: 10
  },
  {
    planId: PLAN_NAMES.SKIN_CARE,
    name: "Skin Care",
    price: 19,
    description: "Dedicated skin diagnostic tools.",
    features: ["Unlimited Skin Scans", "Custom UI Colors", "Advanced Skin Metrics"],
    isUnlimited: false,
    usageLimit: 100
  },
  {
    planId: PLAN_NAMES.HAIR_CARE, 
    name: "Hair Care",
    price: 19,
    description: "Dedicated hair diagnostic tools.",
    features: ["Unlimited Hair Scans", "Scalp Analysis", "Product Recommendations"],
    isUnlimited: false,
    usageLimit: 100
  },
  {
    planId: PLAN_NAMES.COMBO, 
    name: "Combo",
    price: 29,
    description: "The complete Dermatics experience.",
    features: ["Everything in Skin & Hair", "Priority AI Processing", "Custom Branding"],
    isUnlimited: false,
    usageLimit: 200
  }
];