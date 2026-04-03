import express from "express";
import shopify from "../shopify.js";
import adminRoutes from "./admin.js";
import publicRoutes from "./public.js";

const router = express.Router();

/**
 * Admin API Routes
 * These require a valid Shopify session (embedded app)
 * Path: /api/admin/*
 */
router.use("/admin", shopify.validateAuthenticatedSession(), adminRoutes);

/**
 * Public/User API Routes
 * These are unauthenticated (used by storefront widget/app proxy)
 * Path: /api/*
 */
router.use("/", publicRoutes);

export default router;
