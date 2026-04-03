import express from "express";
import multer from "multer";
import { startSession, submitFlow, uploadImage } from "../controllers/flowController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * Flow Session
 */
router.post("/session/start", startSession);

/**
 * Flow Logic
 */
router.post("/flow/submit", submitFlow);
router.post("/flow/upload-image", upload.single("image"), uploadImage);

export default router;
