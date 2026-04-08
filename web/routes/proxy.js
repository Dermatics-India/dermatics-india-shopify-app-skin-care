import express from "express";

// Controllers 
import { getWidgetSettings } from "../controllers/proxyController.js";

// Middleware 
import { verifyAppProxySignature } from "../middleware/verifyAppProxySignature.js";

const router = express.Router();

// App proxy requests are storefront requests (no embedded admin session)
router.get(
  "/widget-settings",
  verifyAppProxySignature,
  getWidgetSettings
);

export default router;