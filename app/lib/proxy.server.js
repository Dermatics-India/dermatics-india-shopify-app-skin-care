import prisma from "../db.server";

// Returns the public widget settings payload for the storefront.
// Exposes only the fields the widget needs + shop-level permissions.
export const getWidgetSettings = async ({ shopDomain }) => {
  if (!shopDomain) {
    return {
      status: 400,
      body: { success: false, message: "Shop domain is required" },
    };
  }

  const normalizedShop = String(shopDomain).toLowerCase().trim();

  const shopRecord = await prisma.shop.findUnique({
    where: { shop: normalizedShop },
  });
  if (!shopRecord) {
    return {
      status: 404,
      body: { success: false, message: "Shop not found" },
    };
  }

  const settings = await prisma.settings.findUnique({
    where: { shopId: shopRecord.id },
  });
  if (!settings) {
    return {
      status: 404,
      body: { success: false, message: "No settings found for this shop" },
    };
  }

  const data = { ...settings };
  const permissions = shopRecord?.permissions || {};
  data.permissions = {
    skinEnabled: permissions.skinEnabled ?? true,
    hairEnabled: permissions.hairEnabled ?? true,
  };

  return { status: 200, body: { success: true, data } };
};
