// ── App-level constants ───────────────────────────────────────────────────────
// Single source of truth for brand identity and public URLs.
// Import from here instead of hard-coding in individual files.

export const APP_NAME = "Dermatics AI";
export const BRAND_COLOR = "#0084ff";

export const APP_URL = process.env.SHOPIFY_APP_URL || "https://dermatics.in";
export const APP_STORE_URL = "https://apps.shopify.com/dermatics-ai";
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@amerce.ai";
