import { PLAN_NAMES, PLAN_INTERVALS } from "./index.js";

export const PLAN_DETAILS = {
  [PLAN_NAMES.FREE]: {
    amount: 0,
    currencyCode: "USD",
    interval: PLAN_INTERVALS.EVERY_30_DAYS,
    features: ["100 scans/mo", "Basic Analysis"],
  },
  [PLAN_NAMES.SKIN_CARE]: {
    amount: 19.0,
    currencyCode: "USD",
    interval: PLAN_INTERVALS.EVERY_30_DAYS,
    features: ["Unlimited Skin Scans", "Email Reports"],
  },
  [PLAN_NAMES.HAIR_CARE]: {
    amount: 19.0,
    currencyCode: "USD",
    interval: PLAN_INTERVALS.EVERY_30_DAYS,
    features: ["Unlimited Hair Scans", "Scalp Analysis"],
  },
  [PLAN_NAMES.COMBO]: {
    amount: 29.0,
    currencyCode: "USD",
    interval: PLAN_INTERVALS.EVERY_30_DAYS,
    features: ["Full AI Access", "Skin + Hair", "Priority Support"],
  },
};

export const AVAILABLE_PLANS = [
  { 
    id: PLAN_NAMES.FREE, 
    price: "0", 
    currency: "USD", 
    desc: "Perfect for testing the AI flow.", 
    features: ["100 scans / month", "Basic Skin Analysis", "Standard Widget UI"] 
  },
  { 
    id: PLAN_NAMES.SKIN_CARE, 
    price: "19", 
    currency: "USD", 
    desc: "Dedicated skin diagnostic tools.", 
    features: ["Unlimited Skin Scans", "Custom UI Colors", "Advanced Skin Metrics"] 
  },
  { 
    id: PLAN_NAMES.HAIR_CARE, 
    price: "19", 
    currency: "USD", 
    desc: "Dedicated hair diagnostic tools.", 
    features: ["Unlimited Hair Scans", "Scalp Analysis", "Product Recommendations"] 
  },
  { 
    id: PLAN_NAMES.COMBO, 
    price: "29", 
    currency: "USD", 
    desc: "The complete Dermatics experience.", 
    features: ["Everything in Skin & Hair", "Priority AI Processing", "Custom Branding"]
  }
];