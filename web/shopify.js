import { BillingInterval } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";
import { PLAN_NAMES } from "./constant/index.js";

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Explicitly load .env from the web folder to avoid root conflicts
dotenv.config({ path: join(__dirname, ".env") });

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_NAME = process.env.DATABASE_NAME;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set — Shopify session storage will fail!");
}

// The keys "Starter" and "Growth" MUST match the strings used in index.js
const billingConfig = {
  [PLAN_NAMES.FREE]: {
    amount: 0.0,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
  [PLAN_NAMES.SKIN_CARE]: {
    amount: 15.0,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
  [PLAN_NAMES.HAIR_CARE]: {
    amount: 15.0,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
  [PLAN_NAMES.COMBO]: {
    amount: 25.0,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
};

const shopify = shopifyApp({
  api: {
    apiVersion: "2024-10",
    restResources,
    future: {
      customerAddressDefaultFix: true,
      lineItemBilling: true,
      unstable_managedPricingSupport: true,
    },
    billing: billingConfig, 
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage: new MongoDBSessionStorage(new URL(DATABASE_URL.trim()), DATABASE_NAME),
});

export default shopify;