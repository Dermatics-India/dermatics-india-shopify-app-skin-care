import { DeliveryMethod } from "@shopify/shopify-api";

// Controllers 
import { onAppInstall, onAppUninstall } from "./controllers/authController.js";

/**
 * @type {{[key: string]: import("@shopify/shopify-api").WebhookHandler}}
 */
export default {

  APP_UNINSTALLED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: onAppUninstall
  },

};
