import prisma from "../db.server";

// Queries the shop's main (published) theme for settings_data.json via the
// Admin GraphQL API and returns whether the `ai-dermatics` app-embed block
// is enabled. Persists the result to Shop.settings.appEmbedEnabled so the
// UI stays in sync.
export const getAppEmbedStatus = async ({ admin, shopRecord }) => {
  const response = await admin.graphql(
    `#graphql
    query MainThemeSettings {
      themes(first: 1, roles: [MAIN]) {
        nodes {
          id
          files(filenames: ["config/settings_data.json"]) {
            nodes {
              body {
                ... on OnlineStoreThemeFileBodyText {
                  content
                }
              }
            }
          }
        }
      }
    }`,
  );

  const { data } = await response.json();
  const mainTheme = data?.themes?.nodes?.[0];

  if (!mainTheme) {
    return { success: false, isEnabled: false, message: "Main theme not found" };
  }

  const content = mainTheme.files?.nodes?.[0]?.body?.content;
  if (!content) {
    return { success: false, isEnabled: false, message: "Settings file not found" };
  }

  // Shopify's settings_data.json starts with a /* ... */ header comment.
  const jsonStart = content.indexOf("{");
  const settingsData = JSON.parse(jsonStart >= 0 ? content.slice(jsonStart) : content);
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
