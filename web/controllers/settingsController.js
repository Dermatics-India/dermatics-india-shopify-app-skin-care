import multer from "multer";

import Settings from "../models/Settings.js";
import Shop from "../models/Shop.js";
import { uploadToShopify } from "../utils/shopifyFiles.js";

const allowedModuleTypes = new Set(["skinCare", "hairCare"]);
export const customizationImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// --- GET: Fetch settings for a specific shop ---
export const getSettings = async (req, res) => {
  try {
    const { shopRecord } = res.locals;

    // 2. Find settings linked to that shop's ID
    const settings = await Settings.findOne({ shopId: shopRecord._id });

    if (!settings) {
      return res.status(404).json({ success: false, message: "No settings found for this shop" });
    }

    const data = settings.toObject();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- POST: Create or Update settings ---
export const updateSettings = async (req, res) => {
  try {
    const { shopRecord } = res.locals;
    const { widget, drawer, modules } = req.body;

    const updatePayload = {};
    if (widget) updatePayload.widget = widget;
    if (drawer) updatePayload.drawer = drawer;

    if (modules) {
      if (modules.skinCare) updatePayload["modules.skinCare"] = modules.skinCare;
      if (modules.hairCare) updatePayload["modules.hairCare"] = modules.hairCare;
    }

    const updatedSettings = await Settings.findOneAndUpdate(
      { shopId: shopRecord._id },
      updatePayload,
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true
      }
    );

    // Mark shop as customized on first save
    if (!shopRecord.settings?.isCustomized) {
      await Shop.findByIdAndUpdate(shopRecord._id, {
        "settings.isCustomized": true,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Settings saved successfully",
      data: updatedSettings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Upload on shopify
export const uploadCustomizationImage = async (req, res) => {
  try {
    // const { shopRecord } = res.locals;
    const session = res.locals.shopify.session;
    const moduleType = req.body?.moduleType;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file" });
    }
    if (!allowedModuleTypes.has(moduleType)) {
      return res.status(400).json({ success: false, message: "Invalid moduleType" });
    }

    const cdnUrl = await uploadToShopify(
      session,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );

    // const updatedSettings = await Settings.findOneAndUpdate(
    //   { shopId: shopRecord._id },
    //   { [`modules.${moduleType}.image.url`]: cdnUrl },
    //   { upsert: true, new: true, setDefaultsOnInsert: true },
    // );

    return res.status(200).json({
      success: true,
      data: { url: cdnUrl, moduleType },
      // url: cdnUrl,
      // settings: updatedSettings,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};