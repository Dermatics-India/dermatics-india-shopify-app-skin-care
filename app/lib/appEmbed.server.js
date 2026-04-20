import prisma from "../db.server";

// Queries the shop's main (published) theme for settings_data.json and
// returns whether the `ai-dermatics` app-embed block is enabled. Persists
// the result to Shop.settings.appEmbedEnabled so the UI stays in sync.
export const getAppEmbedStatus = async ({ admin, shopRecord }) => {
  // REST admin client still ships with @shopify/shopify-app-remix.
  const themesResp = await admin.rest.get({ path: "themes" });
  const themes = themesResp?.body?.themes || [];
  const mainTheme = themes.find((theme) => theme.role === "main");

  if (!mainTheme) {
    return { success: false, isEnabled: false, message: "Main theme not found" };
  }

  const assetResp = await admin.rest.get({
    path: `themes/${mainTheme.id}/assets`,
    query: { "asset[key]": "config/settings_data.json" },
  });
  const assetValue = assetResp?.body?.asset?.value;

  if (!assetValue) {
    return { success: false, isEnabled: false, message: "Settings file not found" };
  }

  const settingsData = JSON.parse(assetValue);
  const blocks = settingsData?.current?.blocks || {};

  const appEmbedEnabled = Object.values(blocks).some((block) => {
    const type = block.type || "";
    const isTargetApp = type.includes("ai-dermatics");
    const isAppEmbed = type.includes("app-embed");
    return isTargetApp && isAppEmbed && !block.disabled;
  });

  if (shopRecord) {
    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: {
        settings: {
          appEmbedEnabled,
          isCustomized: shopRecord.settings?.isCustomized || false,
        },
      },
    });
  }

  return { success: true, isEnabled: appEmbedEnabled };
};
