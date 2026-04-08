import express from "express";
import shopify from "../shopify.js";
// import publicRoutes from "./public.js";
import proxyRoutes from "./proxy.js";

// controllers 
import { getAppEmbedStatus } from "../controllers/appEmbedController.js";
import { getSettings, updateSettings } from '../controllers/settingsController.js'

const router = express.Router();

/**
 * Admin API Routes
 * These require a valid Shopify session (embedded app)
 * Path: /api/admin/*
 */
router.get("/app-embed-status", shopify.validateAuthenticatedSession(), getAppEmbedStatus);

// GET API 
router.get("/settings", shopify.validateAuthenticatedSession(), getSettings);

// POST /api/settings
router.post("/settings", shopify.validateAuthenticatedSession(), updateSettings);

/**
 * Public/User API Routes
 * These are unauthenticated (used by storefront widget/app proxy)
 * Path: /api/*
 */
// router.use("/", publicRoutes);
router.use("/proxy", proxyRoutes);

export default router;
