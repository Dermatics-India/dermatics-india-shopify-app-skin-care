import prisma from "../db.server";
import { sessionStorage } from "../shopify.server";
import { PLAN_IDS, SUBSCRIPTION_STATUS } from "../constant/index.js";

// Called from the afterAuth hook (see shopify.server.js) to upsert the
// merchant's Shop + default Settings on a fresh OAuth install.
export const onAppInstall = async ({ session }) => {
  try {
    const shop = session.shop;
    const accessToken = session.accessToken;

    const shopRecord = await prisma.shop.upsert({
      where: { shop },
      create: {
        shop,
        accessToken,
        isInstalled: true,
        installedAt: new Date(),
        permissions: { skinEnabled: true, hairEnabled: true },
        settings: { appEmbedEnabled: false, isCustomized: false },
        subscription: {
          planId: PLAN_IDS.FREE,
          status: null,
          trialUsed: false,
        },
        usage: { count: 0, periodStart: new Date() },
      },
      update: {
        accessToken,
        isInstalled: true,
        installedAt: new Date(),
      },
    });

    if (!shopRecord) {
      throw new Error("Failed to create or retrieve shopRecord");
    }

    const existingSettings = await prisma.settings.findUnique({
      where: { shopId: shopRecord.id },
    });

    if (!existingSettings) {
      await prisma.settings.create({
        data: {
          shopId: shopRecord.id,
          widget: {},
          drawer: {
            header: {},
            bubble: {
              boat: {},
              user: {},
            },
          },
          modules: {
            skinCare: { text: {}, image: {} },
            hairCare: { text: {}, image: {} },
          },
        },
      });
    }

    console.log(`🚀 [DATABASE] New installation stored for: ${shop}`);
  } catch (err) {
    console.error("❌ [INSTALL_ERROR]:", err.message);
  }
};

// Called from the app/uninstalled webhook. Tears down shop-specific data
// while preserving history that matters (e.g. trialUsed).
export const onAppUninstall = async ({ shop }) => {
  try {
    const shopRecord = await prisma.shop.findUnique({ where: { shop } });

    if (shopRecord) {
      await prisma.settings.deleteMany({ where: { shopId: shopRecord.id } });
      console.log(`🗑️ [DATABASE] Settings deleted for: ${shop}`);

      await prisma.shop.update({
        where: { id: shopRecord.id },
        data: {
          isInstalled: false,
          accessToken: null,
          uninstalledAt: new Date(),
          subscription: {
            id: null,
            planId: PLAN_IDS.FREE,
            status: SUBSCRIPTION_STATUS.CANCELLED,
            activatedAt: shopRecord.subscription?.activatedAt || null,
            cancelledAt: new Date(),
            trialEndsAt: null,
            // Preserve trialUsed — reinstall should NOT grant another trial.
            trialUsed: shopRecord.subscription?.trialUsed || false,
          },
          usage: { count: 0, periodStart: new Date() },
        },
      });
      console.log(`🗑️ [DATABASE] Shop record updated: ${shop}`);
    }

    // Clear any lingering Shopify sessions held in our session storage.
    const sessions = await sessionStorage.findSessionsByShop(shop);
    if (sessions?.length) {
      await sessionStorage.deleteSessions(sessions.map((s) => s.id));
    }
    console.log(`✅ [SESSION] All sessions cleared for: ${shop}`);
  } catch (err) {
    console.error("❌ [UNINSTALL_ERROR]:", err.message);
  }
};
