import Settings from "../models/Settings.js";
import Shop from "../models/Shop.js";

// --- GET: Fetch settings for a specific shop ---
export const getSettings = async (req, res) => {
  try {
    const shopDomain = res.locals.shopify.session.shop;
    
    console.log("shopDomain:::", shopDomain)


    if (!shopDomain) {
      return res.status(400).json({ success: false, message: "Shop domain is required" });
    }

    // 1. Find the shop record first
    const shopRecord = await Shop.findOne({ shop: shopDomain });
    if (!shopRecord) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    // 2. Find settings linked to that shop's ID
    const settings = await Settings.findOne({ shopId: shopRecord._id });

    if (!settings) {
      return res.status(404).json({ success: false, message: "No settings found for this shop" });
    }

    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- POST: Create or Update settings ---
export const updateSettings = async (req, res) => {
  try {
    const shopDomain = res.locals.shopify.session.shop;
    const { widget, drawer } = req.body;

    if (!shopDomain) {
      return res.status(400).json({ success: false, message: "Shop domain is required" });
    }

    // 1. Find the shop record to get the internal _id
    const shopRecord = await Shop.findOne({ shop: shopDomain });
    if (!shopRecord) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    // 2. Upsert (Update or Insert) the settings
    const updatedSettings = await Settings.findOneAndUpdate(
      { shopId: shopRecord._id },
      { widget, drawer },
      { 
        upsert: true, 
        new: true, 
        setDefaultsOnInsert: true 
      }
    );

    return res.status(200).json({
      success: true,
      message: "Settings saved successfully",
      data: updatedSettings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};