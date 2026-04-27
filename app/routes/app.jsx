import { useEffect } from "react";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import { getShopPayload } from "../lib/shop.server";
import { getAppEmbedStatus } from "../lib/appEmbed.server";
import { I18nProvider } from "../providers/I18nProvider";
import { ShopProvider } from "../providers/ShopProvider";
import appStyles from "../styles/app.css?url";
import widgetPreviewStyles from "../styles/widget-preview.css?url";

export const links = () => [
  { rel: "stylesheet", href: appStyles },
  { rel: "stylesheet", href: widgetPreviewStyles },
];

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shopRecord = await loadShopRecord(session);
  const shopPayload = getShopPayload(shopRecord);
  const embedResult = await getAppEmbedStatus({ admin, shopRecord });

  const shopResponse = await admin.graphql(`
    #graphql
    query getShopInfo {
      shop {
        email
        name
      }
    }
  `);
  const { data } = await shopResponse.json();

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shopData: shopPayload.data,
    embedStatus: { isEnabled: !!embedResult?.isEnabled },
    shopInfo: data.shop,
    crispId: process.env.CRISP_ID
  };
};


function AppShell() {
  const { t } = useTranslation();
  const { shopInfo, crispId } = useLoaderData();
  useEffect(() => {
    // 1. Create a global Crisp object
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = crispId;

    window.CRISP_RUNTIME_CONFIG = {
      lock_maximized: false,
      lock_full_view: false
    };

    // 2. Load the script
    (function () {
      const d = document;
      const s = d.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = 1;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();

    // 3. Optional: Pass Shopify-specific data to Crisp
    // This lets you see the store name/plan in your Crisp inbox
    window.$crisp.push(["set", "user:nickname", [shopInfo.name]]);
    window.$crisp.push(["set", "user:email", [shopInfo.email]]);

    // Syntax: $crisp.push(["set", "session:data", [[ [key, value], [key, value] ]]])

    // window.$crisp.push(["set", "session:data", [[
    //   ["plan_name", "SkinCare"],
    //   ["total_scans", 145],
    //   ["is_trial", false],
    //   ["last_analysis", "2026-04-20"],
    //   ["shopify_domain", "mystore.myshopify.com"]
    // ]]]);

  }, []);
  return (
    <ShopProvider>
      <NavMenu>
        <Link to="/app" rel="home">
          {t("NavigationMenu.setupGuide")}
        </Link>
        <Link to="/app/customization">{t("NavigationMenu.customization.title")}</Link>
        <Link to="/app/analytics">{t("NavigationMenu.analytics")}</Link>
        <Link to="/app/customers">{t("NavigationMenu.customers")}</Link>
        <Link to="/app/plans">{t("NavigationMenu.plans")}</Link>
      </NavMenu>
      <Outlet />
    </ShopProvider>
  );
}

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <I18nProvider>
        <AppShell />
      </I18nProvider>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
