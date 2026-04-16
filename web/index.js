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
import webhookHandlers from "./webhook.js";
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
    SHOPIFY AUTH & CALLBACK
============================================================ */

app.get(shopify.config.auth.path, shopify.auth.begin());

// Keep this clean! afterAuth in shopify.js will handle the DB now.
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);



// -----------------------------------------------
//                   WEBHOOKS 
// -----------------------------------------------
// Webhooks need raw body — register BEFORE express.json()
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: webhookHandlers })
);

// app.post("/api/webhooks", async (req, res) => {
//   try {
//     // This will:
//     //  - verify the webhook signature
//     //  - parse headers/body
//     //  - call the matching callback from privacy.js (onAppUninstall for APP_UNINSTALLED)
//     const { topic, shop } = await authenticate.webhook(req);

//     console.log("Webhook received:", topic, "from shop:", shop);

//     res.status(200).send();
//   } catch (error) {
//     console.error("Error handling /api/webhooks:", error);
//     // You can still respond 200 to avoid retries, depending on your strategy.
//     res.status(200).send();
//   }
// });

// JSON parsing for all remaining routes
app.use(express.json());

/* ============================================================
    AUTHENTICATED API ROUTES (Shopify Admin)
============================================================ */
app.use("/api", apiRoutes);
// app.use("/uploads", express.static(join(__dirname, "public", "uploads")));


/* ============================================================
    FRONTEND (CSP + static files + catch-all)
============================================================ */
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));
app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  // This middleware now only handles the redirect/auth check.
  // The DB sync happened in afterAuth already!
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

// app.use("/*", shopify.ensureInstalledOnShop(), async (req, res, _next) => {
//   try {
//     let session = res.locals.shopify?.session;
//     console.log("insuer install:::")

//     if (!session) {
//       const sessionId = await shopify.api.session.getCurrentId({
//         isOnline: false,
//         rawRequest: req,
//         rawResponse: res,
//       });

//       if (sessionId) {
//         session = await shopify.config.sessionStorage.loadSession(sessionId);
//       }
//     }

//     // console.log("session:::", session)

//     if (session && session.shop) {
//       console.log(`📡 [SESSION] Already have a valid session for: ${session.shop}. (Auth callback will be skipped)`);
//       const updatedShop = await Shop.findOneAndUpdate(
//         { shop: session.shop },
//         {
//           shop: session.shop,
//           accessToken: session.accessToken,
//           isInstalled: true,
//           installedAt: new Date(),
//           uninstalledAt: null,
//         },
//         { upsert: true, new: true }
//       );
//       if (updatedShop) {
//         console.log(`✅ Database Sync Success: ${session.shop}`);
//       } else {
//         console.warn(`⚠️ Sync handled but no document returned for: ${session.shop}`);
//       }
//     } else {
//       console.warn("⚠️ No Shopify session found in res.locals.shopify. Session might not be initialized yet.");
//     }
//   } catch (err) {
//     console.error("❌ Database Sync Error:", err.message);
//   }

//   const htmlFile = join(STATIC_PATH, "index.html");
//   let html = fs.readFileSync(htmlFile, "utf8");

//   if (process.env.NODE_ENV !== "production") {
//     html = html
//       .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
//       .replace("%VITE_API_URL%", process.env.SHOPIFY_APP_URL || "");
//   }

//   return res
//     .status(200)
//     .set("Content-Type", "text/html")
//     .send(html);
// });

app.listen(PORT, () => {
  console.log(`🚀 Shopify Backend running on port ${PORT}`);
});