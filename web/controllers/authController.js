
// Models 
import Shop from "../models/Shop.js";
import Settings from "../models/Settings.js";
import shopify from "../shopify.js";

export const onAppInstall = async ({ session, admin }) => {
    try {
        const shop = session.shop;
        const accessToken = session.accessToken;
        console.log("onAppInstall:::shop", shop)

        // init Shop 
        const shopRecord = await Shop.findOneAndUpdate(
            { shop },
            {
                shop,
                accessToken,
                isInstalled: true,
                installedAt: new Date()
            },
            { upsert: true, new: true }
        );

        await Settings.findOneAndUpdate(
            { shopId: shopRecord._id },
            {
                shopId: shopRecord._id,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`🚀 [DATABASE] New installation stored for: ${shop}`);
    } catch (err) {
        console.error("❌ [INSTALL_ERROR]:", err.message);
    }
}

export const onAppUninstall = async (topic, shop, body, webhookId) => {
    try {
        console.log("onAppUninstall:::shop", shop)
        console.log("onAppUninstall:::body", body)
        // 1. Mark the shop as uninstalled in our custom Shop model

        const shopRecord = await Shop.findOne({ shop });
        console.log("shop records found::", shopRecord)

        if (shopRecord) {
            await Settings.deleteOne({ shopId: shopRecord._id });
            console.log(`🗑️ [DATABASE] Settings deleted for: ${shop}`);

            shopRecord.isInstalled = false;
            shopRecord.accessToken = null;
            shopRecord.uninstalledAt = new Date();
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