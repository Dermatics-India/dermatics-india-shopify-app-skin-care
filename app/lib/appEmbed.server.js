import prisma from "../db.server";

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

  // settings_data.json sometimes starts with a /* ... */ header comment, so
  // jump to the first `{` before parsing.
  const jsonStart = content.indexOf("{");
  let settingsData;
  try {
    settingsData = JSON.parse(jsonStart >= 0 ? content.slice(jsonStart) : content);
  } catch (err) {
    return { success: false, isEnabled: false, message: "Failed to parse settings_data.json" };
  }

  // `current` can be an object (live settings) or a string pointing into `presets`.
  const current =
    typeof settingsData?.current === "string"
      ? settingsData?.presets?.[settingsData.current]
      : settingsData?.current;

  const blocks = current?.blocks || {};

  // App embed block type format:
  //   shopify://apps/{app-client-id}/blocks/{block-handle}/{extension-uuid}
  // Match on the block handle (file name) and, when available, the extension UUID.
  const blockHandle = process.env.SHOPIFY_THEME_EXTENSION_HANDLE || "app-embed";

  const appEmbedEnabled = Object.values(blocks).some((block) => {
    if (!block || block.disabled) return false;
    const type = block.type || "";
    const isOurBlock = type.includes(`/blocks/${blockHandle}/`);
    return isOurBlock;
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
