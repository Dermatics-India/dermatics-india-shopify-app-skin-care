import express from "express";
import { getAppEmbedStatus } from "../controllers/appEmbedController.js";
import { getProductCount, createProducts } from "../controllers/productController.js";

const router = express.Router();

/**
 * App Embed Status
 */
router.get("/app-embed-status", getAppEmbedStatus);

/**
 * Product Management
 */
router.get("/products/count", getProductCount);
router.post("/products", createProducts);

export default router;
