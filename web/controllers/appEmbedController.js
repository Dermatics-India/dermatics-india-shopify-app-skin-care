import shopify from "../shopify.js";
import Shop from "../models/Shop.js";

/**
 * Checks if the app embed widget is enabled in the current theme
 * and syncs the result back to the Shop model.
 */
export const getAppEmbedStatus = async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const { shopRecord } = res.locals;

    const client = new shopify.api.clients.Rest({ session });

    // 1. Get all themes and find the published (main) theme
    const { body: themesBody } = await client.get({ path: "themes" });
    const themes = themesBody?.themes || [];
    const mainTheme = themes.find((theme) => theme.role === "main");

    if (!mainTheme) {
      return res.status(404).json({ success: false, isEnabled: false, message: "Main theme not found" });
    }

    // 2. Fetch the 'config/settings_data.json' asset
    const { body: assetBody } = await client.get({
      path: `themes/${mainTheme.id}/assets`,
      query: { "asset[key]": "config/settings_data.json" },
    });

    const assetValue = assetBody?.asset?.value;

    if (!assetValue) {
      return res.status(404).json({ success: false, isEnabled: false, message: "Settings file not found" });
    }

    const settingsData = JSON.parse(assetValue);
    const blocks = settingsData?.current?.blocks || {};

    // 3. Search for the 'ai-dermatics' app-embed block
    const appEmbedEnabled = Object.values(blocks).some((block) => {
      const type = block.type || "";
      const isTargetApp = type.includes("ai-dermatics");
      const isAppEmbed = type.includes("app-embed");
      return isTargetApp && isAppEmbed && !block.disabled;
    });

    // 4. Sync embed status to Shop model
    if (shopRecord) {
      await Shop.findByIdAndUpdate(shopRecord._id, {
        "settings.appEmbedEnabled": appEmbedEnabled,
      });
    }

    res.status(200).json({
      success: true,
      isEnabled: appEmbedEnabled,
    });
  } catch (error) {
    console.error("Error checking app embed status:", error.message);
    res.status(500).json({ success: false, isEnabled: false, error: error.message });
  }
};
