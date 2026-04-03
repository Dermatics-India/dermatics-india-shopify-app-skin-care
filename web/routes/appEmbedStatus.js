import shopify from "../shopify.js";

/**
 * Checks if the app embed widget is enabled in the current theme.
 * Works by fetching the main theme's 'config/settings_data.json' and searching for the block.
 */
export default async function getAppEmbedStatus(req, res) {
  try {
    const session = res.locals.shopify.session;

    // 1. Get all themes and find the 'main' (published) theme
    const themes = await shopify.api.rest.Theme.all({
      session: session,
    });
    const mainTheme = themes.find((theme) => theme.role === "main");

    if (!mainTheme) {
      return res.status(404).send({ isEnabled: false, error: "Main theme not found" });
    }

    // 2. Fetch the 'config/settings_data.json' asset
    const assets = await shopify.api.rest.Asset.all({
      session: session,
      theme_id: mainTheme.id,
      asset: { key: "config/settings_data.json" },
    });

    if (!assets || assets.length === 0) {
      return res.status(404).send({ isEnabled: false, error: "Settings file not found" });
    }

    const settingsData = JSON.parse(assets[0].value);
    const blocks = settingsData?.current?.blocks || {};

    const shopifyBlocks = Object.values(blocks)
      .map((b) => b.type)
      .filter((type) => type?.includes("shopify://apps"));

    // 3. Search for the app-embed block
    // We search for both the extension name and the folder name to be safe
    const appEmbedEnabled = Object.values(blocks).some((block) => {
      const type = block.type || "";
      const isTargetApp = type.includes("ai-dermatics") || type.includes("ai-dermatics-disabled");
      const isAppEmbed = type.includes("app-embed");
      return isTargetApp && isAppEmbed && !block.disabled;
    });

    res.status(200).send({ 
      isEnabled: appEmbedEnabled,
      diagnostics: {
        totalBlocks: Object.keys(blocks).length,
        shopifyBlocks: shopifyBlocks
      }
    });
  } catch (error) {
    console.error("❌ Error checking app embed status:", error.message);
    res.status(500).send({ isEnabled: false, error: error.message });
  }
}
