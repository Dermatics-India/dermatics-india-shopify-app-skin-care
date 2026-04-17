import { BrowserRouter } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NavMenu } from "@shopify/app-bridge-react";
import Routes from "./Routes";

import { QueryProvider, PolarisProvider, ShopProvider } from "./components";

export default function App() {
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  const pages = import.meta.glob("./pages/**/!(*.test.[jt]sx)*.([jt]sx)", {
    eager: true,
  });
  const { t } = useTranslation();

  return (
    <PolarisProvider>
      <BrowserRouter>
        <QueryProvider>
          <ShopProvider>
            <NavMenu>
              <a href="/" rel="home">
                {t("NavigationMenu.setupGuide")}
              </a>
              <a href="/customization">{t("NavigationMenu.customization.title")}</a>
              <a href="/analytics">{t("NavigationMenu.analytics")}</a>
              <a href="/plans">{t("NavigationMenu.plans")}</a>
            </NavMenu>
            <Routes pages={pages} />
          </ShopProvider>
        </QueryProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
