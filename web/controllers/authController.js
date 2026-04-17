
// Models
import Shop from "../models/Shop.js";
import Settings from "../models/Settings.js";
import shopify from "../shopify.js";
import { PLAN_IDS, SUBSCRIPTION_STATUS } from "../constant/index.js";

export const onAppInstall = async ({ session, admin }) => {
    try {
        const shop = session.shop;
        const accessToken = session.accessToken;

        // init Shop 
        const shopRecord = await Shop.findOneAndUpdate(
            { shop },
            {
                shop,
                accessToken,
                isInstalled: true,
                installedAt: new Date()
            },
            { upsert: true, returnDocument: 'after', }
        );

        if (!shopRecord) {
            throw new Error("Failed to create or retrieve shopRecord");
        }

        await Settings.findOneAndUpdate(
            { shopId: shopRecord._id },
            {
                shopId: shopRecord._id,
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );

        console.log(`🚀 [DATABASE] New installation stored for: ${shop}`);
    } catch (err) {
        console.error("❌ [INSTALL_ERROR]:", err.message);
    }
}

export const onAppUninstall = async (topic, shop, body, webhookId) => {
    try {
        const shopRecord = await Shop.findOne({ shop });

        if (shopRecord) {
            await Settings.deleteOne({ shopId: shopRecord._id });
            console.log(`🗑️ [DATABASE] Settings deleted for: ${shop}`);

            shopRecord.isInstalled = false;
            shopRecord.accessToken = null;
            shopRecord.uninstalledAt = new Date();
            // Shopify auto-cancels AppSubscriptions on uninstall — reset our DB to match.
            shopRecord.subscription = {
                id: null,
                planId: PLAN_IDS.FREE,
                status: SUBSCRIPTION_STATUS.CANCELLED,
                activatedAt: shopRecord.subscription?.activatedAt || null,
                cancelledAt: new Date(),
                trialEndsAt: null,
                // Preserve trialUsed — re-installing should NOT grant another trial.
                trialUsed: shopRecord.subscription?.trialUsed || false,
            };
            shopRecord.usage = { count: 0, periodStart: new Date() };
            await shopRecord.save();
        }
        console.log(`🗑️ [DATABASE] Shop record updated: ${shop}`);

        // 2. Clear all sessions for this shop from Shopify's session storage (MongoDB)
        // This affects the "shopify_sessions" table
        await shopify.config.sessionStorage.deleteSessions([shop]);
        console.log(`✅ [SESSION] All sessions cleared for: ${shop}`);

    } catch (err) {
        console.error("❌ [UNINSTALL_ERROR]:", err.message);
    }
}