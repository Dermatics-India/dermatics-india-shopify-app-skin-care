import prisma from "../db.server";
import { uploadToShopify } from "./shopifyFiles.server.js";

export const allowedModuleTypes = new Set(["skinCare", "hairCare"]);

// --- GET: Fetch settings for a specific shop ---
export const getSettings = async ({ shopRecord }) => {
  const settings = await prisma.settings.findUnique({
    where: { shopId: shopRecord.id },
  });

  if (!settings) {
    return {
      status: 404,
      body: { success: false, message: "No settings found for this shop" },
    };
  }
  // console.dir(settings, { depth: null, colors: true });

  return { status: 200, body: { success: true, data: settings } };
};

// --- POST: Create or Update settings ---
// Mirrors the old `findOneAndUpdate({ upsert: true })` Mongoose behaviour.
export const updateSettings = async ({ shopRecord, payload }) => {
  const { widget, drawer, modules } = payload || {};

  const data = {};
  if (widget) data.widget = widget;
  if (drawer) data.drawer = drawer;
  if (modules) {
    data.modules = {
      ...(modules.skinCare ? { skinCare: modules.skinCare } : {}),
      ...(modules.hairCare ? { hairCare: modules.hairCare } : {}),
    };
  }

  const updatedSettings = await prisma.settings.upsert({
    where: { shopId: shopRecord.id },
    create: {
      shopId: shopRecord.id,
      widget: widget || {},
      drawer: drawer || {
        header: {},
        bubble: { boat: {}, user: {} },
      },
      modules: modules || {
        skinCare: { text: {}, image: {} },
        hairCare: { text: {}, image: {} },
      },
    },
    update: data,
  });

  // Mark shop as customized on first save.
  if (!shopRecord.settings?.isCustomized) {
    await prisma.shop.update({
      where: { id: shopRecord.id },
      data: {
        settings: {
          appEmbedEnabled: shopRecord.settings?.appEmbedEnabled || false,
          isCustomized: true,
        },
      },
    });
  }

  return {
    status: 200,
    body: {
      success: true,
      message: "Settings saved successfully",
      data: updatedSettings,
    },
  };
};

// --- POST: Upload an image asset to the shop's Shopify Files CDN. ---
export const uploadCustomizationImage = async ({ admin, file, moduleType }) => {
  if (!file) {
    return { status: 400, body: { success: false, message: "No file" } };
  }
  if (!allowedModuleTypes.has(moduleType)) {
    return { status: 400, body: { success: false, message: "Invalid moduleType" } };
  }

  const cdnUrl = await uploadToShopify(
    admin,
    file.buffer,
    file.originalname,
    file.mimetype,
  );

  return {
    status: 200,
    body: { success: true, data: { url: cdnUrl, moduleType } },
  };
};
