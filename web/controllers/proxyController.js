import Settings from "../models/Settings.js";
import Shop from "../models/Shop.js";

export const getWidgetSettings = async (req, res) => {
  try {
    const shopDomain =
      req.query.shop ||
      req.headers["x-shopify-shop-domain"] ||
      res.locals?.shopify?.session?.shop;

    if (!shopDomain) {
      return res
        .status(400)
        .json({ success: false, message: "Shop domain is required" });
    }

    const normalizedShop = String(shopDomain).toLowerCase().trim();

    // 1. Find the shop record first
    const shopRecord = await Shop.findOne({ shop: normalizedShop });
    if (!shopRecord) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    // 2. Find settings linked to that shop's ID
    const settings = await Settings.findOne({ shopId: shopRecord._id });
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "No settings found for this shop",
      });
    }

    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};