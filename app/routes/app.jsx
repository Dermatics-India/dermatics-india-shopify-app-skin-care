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

export const links = () => [{ rel: "stylesheet", href: appStyles }];

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shopRecord = await loadShopRecord(session);
  const shopPayload = getShopPayload(shopRecord);
  const embedResult = await getAppEmbedStatus({ admin, shopRecord });
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shopData: shopPayload.data,
    embedStatus: { isEnabled: !!embedResult?.isEnabled },
  };
};

function AppShell() {
  const { t } = useTranslation();
  return (
    <ShopProvider>
      <NavMenu>
        <Link to="/app" rel="home">
          {t("NavigationMenu.setupGuide")}
        </Link>
        <Link to="/app/customization">{t("NavigationMenu.customization.title")}</Link>
        <Link to="/app/analytics">{t("NavigationMenu.analytics")}</Link>
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
