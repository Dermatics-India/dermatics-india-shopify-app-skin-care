import { BillingInterval } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Explicitly load .env from the web folder to avoid root conflicts
dotenv.config({ path: join(__dirname, ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set — Shopify session storage will fail!");
}

// The keys "Starter" and "Growth" MUST match the strings used in index.js
const billingConfig = {
  "Starter": {
    amount: 15.0,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
  "Growth": {
    amount: 35.0,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
};

const shopify = shopifyApp({
  api: {
    apiVersion: "2024-10",
    restResources,
    billing: billingConfig, 
    // Enabled flags to ensure compatibility with 2025-07 requirements
    // future: {
    //   lineItemBilling: true,
    //   customerAddressDefaultFix: true,
    //   unstable_managedPricingSupport: true,
    // },
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage: new MongoDBSessionStorage(MONGODB_URI, "dermatics_app"),
});

export default shopify;