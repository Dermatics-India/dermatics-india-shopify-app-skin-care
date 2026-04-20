import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  DeliveryMethod,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { onAppInstall } from "./lib/auth.server";

// MongoDB's _id is immutable — strip `id` from upsert update payload.
class MongoPrismaSessionStorage extends PrismaSessionStorage {
  async storeSession(session) {
    await this.ensureReady();
    const data = this.sessionToRow(session);
    const { id: _omit, ...updateData } = data;
    await this.getSessionTable().upsert({
      where: { id: session.id },
      update: updateData,
      create: data,
    });
    return true;
  }
}

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January26,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new MongoPrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/app/uninstalled",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      try {
        if (session && !session.isOnline) {
          console.log("🚀 [AFTER_AUTH] Triggering installation logic for:", session.shop);
          await onAppInstall({ session });
          console.log("✅ [AFTER_AUTH] Installation logic completed for:", session.shop);
        }
      } catch (error) {
        console.error("❌ [AFTER_AUTH] Error:", error.message);
      }
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January26;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
