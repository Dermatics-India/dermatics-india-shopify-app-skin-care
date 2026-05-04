import prisma from "../db.server";
import { sessionStorage } from "../shopify.server";
import { PLAN_IDS } from "../constant/index.js";
import { APP_STORE_URL } from "../constant/app.js";
import { sendTemplateMail, buildMergeInfo } from "./mailer.server";

// Called from the afterAuth hook (see shopify.server.js). Three scenarios:
//   1. brand-new shop        → create with clean free-plan defaults
//   2. reinstall (was uninstalled) → reset subscription/permissions/usage to
//      free-plan defaults. Shopify auto-cancels the merchant's paid sub on
//      uninstall, so our DB must follow. trialUsed is preserved so a merchant
//      can't farm unlimited trials by reinstalling.
//   3. reauth / scope change (still installed) → refresh token only. NEVER
//      touch subscription/permissions here — an ACTIVE paying merchant who
//      accepts a scope upgrade would otherwise get their paid sub wiped.
async function fetchShopOwner(shop, accessToken) {
  try {
    const res = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { "X-Shopify-Access-Token": accessToken },
    });
    const data = await res.json();
    return {
      ownerEmail: data?.shop?.email || null,
      ownerName: data?.shop?.shop_owner || data?.shop?.name || null,
    };
  } catch {
    return { ownerEmail: null, ownerName: null };
  }
}

export const onAppInstall = async ({ session }) => {
  try {
    const shop = session.shop;
    const accessToken = session.accessToken;

    const existing = await prisma.shop.findUnique({ where: { shop } });
    const { ownerEmail, ownerName } = await fetchShopOwner(shop, accessToken);

    let shopRecord;
    let isNewInstall = false;
    if (!existing) {
      isNewInstall = true;
      shopRecord = await prisma.shop.create({
        data: {
          shop,
          accessToken,
          ownerEmail,
          ownerName,
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
      });
    } else if (!existing.isInstalled) {
      isNewInstall = true;
      shopRecord = await prisma.shop.update({
        where: { id: existing.id },
        data: {
          accessToken,
          ownerEmail: ownerEmail || existing.ownerEmail,
          ownerName: ownerName || existing.ownerName,
          isInstalled: true,
          installedAt: new Date(),
          uninstalledAt: null,
          permissions: { skinEnabled: true, hairEnabled: true },
          settings: { appEmbedEnabled: false, isCustomized: false },
          subscription: {
            id: null,
            planId: PLAN_IDS.FREE,
            interval: null,
            status: null,
            activatedAt: null,
            cancelledAt: null,
            trialEndsAt: null,
            trialUsed: existing.subscription?.trialUsed || false,
          },
          usage: { count: 0, periodStart: new Date() },
        },
      });
    } else {
      // Reauth / scope change — row is already the merchant's real state.
      shopRecord = await prisma.shop.update({
        where: { id: existing.id },
        data: {
          accessToken,
          installedAt: new Date(),
        },
      });
    }

    if (!shopRecord) {
      throw new Error("Failed to create or retrieve shopRecord");
    }

    const existingSettings = await prisma.settings.findUnique({
      where: { shopId: shopRecord.id },
    });

    if (!existingSettings) {
      const emptyBubbleText = { fontSize: 14, fontWeight: "normal", color: "#333333", marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0 };
      const emptyBubble = { heading: emptyBubbleText, text: emptyBubbleText };
      await prisma.settings.create({
        data: {
          shopId: shopRecord.id,
          widget: {},
          drawer: {
            header: {},
            bubble: {
              boat: emptyBubble,
              user: emptyBubble,
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

    if (isNewInstall) {
      sendTemplateMail({
        to: shopRecord.ownerEmail,
        toName: shopRecord.ownerName,
        templateKey: process.env.ZEPTOMAIL_TEMPLATE_ON_INSTALL,
        mergeInfo: buildMergeInfo({ shop, planName: "Free" }),
      });
    }
  } catch (err) {
    console.error("❌ [INSTALL_ERROR]:", err.message);
  }
};

// Called from the app/uninstalled webhook. Tears down shop-specific data
// while preserving history that matters (e.g. trialUsed).
export const onAppUninstall = async ({ shop }) => {
  try {
    const shopRecord = await prisma.shop.findUnique({ where: { shop } });
    console.log("onAppUnInstall:::", shopRecord)
    if (shopRecord) {
      await prisma.settings.delete({ where: { shopId: shopRecord.id } }).catch((e) => {
        if (e?.code !== "P2025") throw e; // P2025 = record not found — already gone, fine
      });
      console.log(`🗑️ [DATABASE] Settings deleted for: ${shop}`);

      await prisma.shop.update({
        where: { id: shopRecord.id },
        data: {
          isInstalled: false,
          accessToken: null,
          uninstalledAt: new Date(),
          permissions: { skinEnabled: true, hairEnabled: true },
          settings: { appEmbedEnabled: false, isCustomized: false },
          subscription: {
            id: null,
            planId: PLAN_IDS.FREE,
            // null = no paid subscription (same convention as fresh install
            // and endSubscriptionToFree). `status` is strictly about the
            // paid lifecycle; FREE shops have no status.
            status: null,
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

      sendTemplateMail({
        to: shopRecord.ownerEmail,
        toName: shopRecord.ownerName,
        templateKey: process.env.ZEPTOMAIL_TEMPLATE_ON_UNINSTALL,
        mergeInfo: buildMergeInfo({
          shop,
          link: APP_STORE_URL,
        }),
      });
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
