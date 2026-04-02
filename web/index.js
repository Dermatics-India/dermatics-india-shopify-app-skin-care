// // @ts-nocheck
// import { join } from "path";
// import express from "express";
// import serveStatic from "serve-static";
// import shopify from "./shopify.js";
// import productCreator from "./product-creator.js";
// import PrivacyWebhookHandlers from "./privacy.js";

// const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);

// const STATIC_PATH =
//   process.env.NODE_ENV === "production"
//     ? `${process.cwd()}/web/frontend/dist`
//     : `${process.cwd()}/web/frontend`;

// const app = express();

// // Serve proxy assets
// app.use(
//   "/proxy-assets",
//   express.static(join(process.cwd(), "proxy-assets"))
// );


// /* ============================================================
//    SHOPIFY OAUTH & WEBHOOKS
// ============================================================ */

// app.get(shopify.config.auth.path, shopify.auth.begin());
// app.get(
//   shopify.config.auth.callbackPath,
//   shopify.auth.callback(),
//   shopify.redirectToShopifyOrAppRoot()
// );

// app.post(
//   shopify.config.webhooks.path,
//   shopify.processWebhooks({
//     webhookHandlers: PrivacyWebhookHandlers,
//   })
// );

// /* ============================================================
//    API (AUTHENTICATED)
// ============================================================ */

// app.use("/api/*", shopify.validateAuthenticatedSession());
// app.use(express.json());

// app.get("/api/products/count", async (_req, res) => {
//   const client = new shopify.api.clients.Graphql({
//     session: res.locals.shopify.session,
//   });

//   const countData = await client.request(`
//     query {
//       productsCount {
//         count
//       }
//     }
//   `);

//   res.status(200).send({ count: countData.data.productsCount.count });
// });

// /* ============================================================
//    CSP + FRONTEND
// ============================================================ */

// app.use(shopify.cspHeaders());
// app.use(serveStatic(STATIC_PATH, { index: false }));

// /* ============================================================
//    EMBEDDED APP ROUTES (ADMIN ONLY)
// ============================================================ */

// app.get("/apps/new-derma/*", shopify.ensureInstalledOnShop(), (_req, res) => {
//   res.sendFile(join(STATIC_PATH, "index.html"));
// });

// /* ============================================================
//    FINAL FALLBACK (ADMIN ONLY)
// ============================================================ */

// app.get("/*", shopify.ensureInstalledOnShop(), (_req, res) => {
//   res.sendFile(join(STATIC_PATH, "index.html"));
// });

// app.listen(PORT, () => {
//   console.log("🚀 Backend running on port", PORT);
// });


// @ts-nocheck
// import { join } from "path";
// import express from "express";
// import serveStatic from "serve-static";
// import shopify from "./shopify.js";
// import PrivacyWebhookHandlers from "./privacy.js";

// const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);
// const STATIC_PATH = process.env.NODE_ENV === "production"
//     ? `${process.cwd()}/web/frontend/dist`
//     : `${process.cwd()}/web/frontend`;

// const app = express();

// // 1. Serve your JS/CSS assets for the storefront flow
// app.get("/api/proxy", (req, res) => {
//   res.setHeader("Content-Type", "application/liquid");
//   res.send(`
//     <div id="derma-full-page-container" style="min-height: 80vh; padding: 20px;">
//         <div id="derma-ai-screen"></div>
//     </div>

//     <script src="/proxy-assets/derma-ai.js"></script>
//     <script>
//       window.addEventListener('load', () => {
//          // Auto-start the session for the full page
//          if (typeof startSession === 'function') startSession();
//       });
//     </script>
//   `);
// });

// /* ============================================================
//    SHOPIFY CORE (Auth & Webhooks)
// ============================================================ */
// app.get(shopify.config.auth.path, shopify.auth.begin());
// app.get(
//   shopify.config.auth.callbackPath,
//   shopify.auth.callback(),
//   shopify.redirectToShopifyOrAppRoot()
// );
// app.post(
//   shopify.config.webhooks.path,
//   shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
// );

// // Authenticated API routes for the Admin Dashboard
// app.use("/api/*", shopify.validateAuthenticatedSession());
// app.use(express.json());

// /* ============================================================
//    FRONTEND & CSP
// ============================================================ */
// app.use(shopify.cspHeaders());
// app.use(serveStatic(STATIC_PATH, { index: false }));

// app.get("/*", shopify.ensureInstalledOnShop(), (_req, res) => {
//   res.sendFile(join(STATIC_PATH, "index.html"));
// });

// app.listen(PORT);


// @ts-nocheck
// import { join } from "path";
// import express from "express";
// import serveStatic from "serve-static";
// import shopify from "./shopify.js";
// import PrivacyWebhookHandlers from "./privacy.js";

// import connectDB from './db.js';

// // Connect to the database
// connectDB();

// const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);
// const STATIC_PATH = process.env.NODE_ENV === "production"
//     ? `${process.cwd()}/web/frontend/dist`
//     : `${process.cwd()}/web/frontend`;

// const app = express();

// // Auth and Webhooks
// app.get(shopify.config.auth.path, shopify.auth.begin());
// app.get(
//   shopify.config.auth.callbackPath,
//   shopify.auth.callback(),
//   shopify.redirectToShopifyOrAppRoot()
// );
// app.post(
//   shopify.config.webhooks.path,
//   shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
// );

// // Authenticated Routes
// app.use("/api/*", shopify.validateAuthenticatedSession());
// app.use(express.json());

// app.get("/api/billing/upgrade", async (req, res) => {
//   const planId = req.query.plan;
//   const session = res.locals.shopify.session;

//   if (!planId) {
//     return res.status(400).send({ error: "No plan specified" });
//   }

//   try {
//     // Map the incoming query to the keys defined in shopify.js
//     const shopifyPlanName = planId.toLowerCase().includes("growth") ? "Growth" : "Starter";

//     console.log(`🚀 Requesting billing for: ${shopifyPlanName}`);

//     const confirmationUrl = await shopify.api.billing.request({
//       session,
//       plan: shopifyPlanName,
//       isTest: true, // Set to false when you go live
//       returnUrl: `https://${session.shop}/admin/apps/${process.env.SHOPIFY_API_KEY}/pricing`,
//     });

//     res.status(200).send({ confirmationUrl });
//   } catch (e) {
//     console.error(`❌ Billing Error: ${e.message}`);
//     res.status(500).send({ error: e.message });
//   }
// });

// // Proxy and Static Assets
// app.use("/proxy-assets", express.static(join(process.cwd(), "proxy-assets")));
// app.use(shopify.cspHeaders());
// app.use(serveStatic(STATIC_PATH, { index: false }));

// app.get("/*", shopify.ensureInstalledOnShop(), (_req, res) => {
//   res.sendFile(join(STATIC_PATH, "index.html"));
// });

// app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
// });


// @ts-nocheck
import { join } from "path";
import express from "express";
import serveStatic from "serve-static";
import shopify from "./shopify.js";
import PrivacyWebhookHandlers from "./privacy.js";
import connectDB from './db.js';
import fs from "fs";
import flowRoutes from "./routes/flowRoutes.js";

connectDB();

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT || "3000", 10);
const STATIC_PATH = process.env.NODE_ENV === "production"
  ? `${process.cwd()}/web/frontend/dist`
  : `${process.cwd()}/web/frontend`;

const app = express();

// Ensure 'uploads' directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(express.json());

/* ============================================================
    PUBLIC API ROUTES
============================================================ */
app.use("/api", flowRoutes);

/* ============================================================
    SHOPIFY AUTH & STRATEGY (The rest of your template)
============================================================ */

app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(fs.readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);