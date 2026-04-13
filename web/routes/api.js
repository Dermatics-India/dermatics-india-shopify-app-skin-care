import express from "express";
import shopify from "../shopify.js";
// import publicRoutes from "./public.js";
import proxyRoutes from "./proxy.js";

// controllers 
import { getAppEmbedStatus } from "../controllers/appEmbedController.js";
import {
  getSettings,
  updateSettings,
  uploadCustomizationImage,
  customizationImageUpload,
} from "../controllers/settingsController.js";

import { checkShop } from "../middleware/shopAuth.js";

const router = express.Router();

/**
 * Admin API Routes
 * These require a valid Shopify session (embedded app)
 * Path: /api/admin/*
 */
router.get("/app-embed-status", shopify.validateAuthenticatedSession(), checkShop, getAppEmbedStatus);

// GET API 
router.get("/settings", shopify.validateAuthenticatedSession(), checkShop, getSettings);

// POST /api/settings
router.post("/settings", shopify.validateAuthenticatedSession(), checkShop, updateSettings);
router.post(
  "/customization/upload",
  shopify.validateAuthenticatedSession(),
  checkShop,
  customizationImageUpload.single("image"),
  uploadCustomizationImage,
);

/**
 * Public/User API Routes
 * These are unauthenticated (used by storefront widget/app proxy)
 * Path: /api/*
 */
// router.use("/", publicRoutes);
router.use("/proxy", proxyRoutes);

export default router;
