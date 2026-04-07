// @ts-nocheck
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Explicitly load .env from the web folder to avoid root conflicts
dotenv.config({ path: join(__dirname, ".env") });
// Fallback check if already in web folder
if (!process.env.SHOPIFY_API_KEY) {
  dotenv.config();
}

import express from "express";
import serveStatic from "serve-static";
import shopify from "./shopify.js";
import PrivacyWebhookHandlers from "./privacy.js";
import { connectDB } from './server.js'
import Shop from "./models/Shop.js";
import fs from "fs";

// Routes 
import apiRoutes from "./routes/api.js";

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);
const STATIC_PATH = process.env.NODE_ENV === "production"
  ? join(__dirname, "frontend", "dist")
  : join(__dirname, "frontend");

const app = express();

// Ensure 'uploads' directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Connect to DB
await connectDB();

/* ============================================================
    SHOPIFY AUTH & WEBHOOKS (must be FIRST)
============================================================ */

// Webhooks need raw body — register BEFORE express.json()
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// OAuth begin
app.get(shopify.config.auth.path, shopify.auth.begin());

// OAuth callback — after auth, save/update shop in MongoDB
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  async (req, res, next) => {
    try {
      const session = res.locals.shopify?.session;

      if (session) {
        await Shop.findOneAndUpdate(
          { shop: session.shop },
          {
            shop: session.shop,
            accessToken: session.accessToken,
            isInstalled: true,
            installedAt: new Date(),
            uninstalledAt: null,
          },
          { upsert: true, new: true }
        );
        console.log(`✅ Shop saved/updated: ${session.shop}`);
      }
    } catch (err) {
      console.error("❌ Error saving shop to DB:", err.message);
    }
    next();
  },
  shopify.redirectToShopifyOrAppRoot()
);

// JSON parsing for all remaining routes
app.use(express.json());

/* ============================================================
    AUTHENTICATED API ROUTES (Shopify Admin)
============================================================ */
app.use("/api", apiRoutes);



/* ============================================================
    FRONTEND (CSP + static files + catch-all)
============================================================ */
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (req, res, _next) => {
  try {
    const session = res.locals.shopify?.session;

    if (session) {
      console.log(`📡 [SESSION] Already have a valid session for: ${session.shop}. (Auth callback will be skipped)`);
      const updatedShop = await Shop.findOneAndUpdate(
        { shop: session.shop },
        {
          shop: session.shop,
          accessToken: session.accessToken,
          isInstalled: true,
          installedAt: new Date(),
          uninstalledAt: null,
        },
        { upsert: true, new: true }
      );
      if (updatedShop) {
        console.log(`✅ Database Sync Success: ${session.shop}`);
      } else {
        console.warn(`⚠️ Sync handled but no document returned for: ${session.shop}`);
      }
    } else {
      console.warn("⚠️ No Shopify session found in res.locals.shopify. Session might not be initialized yet.");
    }
  } catch (err) {
    console.error("❌ Database Sync Error:", err.message);
  }

  const htmlFile = join(STATIC_PATH, "index.html");
  let html = fs.readFileSync(htmlFile, "utf8");

  if (process.env.NODE_ENV !== "production") {
    html = html
      .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
      .replace("%VITE_API_URL%", process.env.SHOPIFY_APP_URL || "");
  }

  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(html);
});

app.listen(PORT, () => {
  console.log(`🚀 Shopify Backend running on port ${PORT}`);
});