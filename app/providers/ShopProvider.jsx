import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useFetcher, useRevalidator, useRouteLoaderData } from "@remix-run/react";

import { ENDPOINTS } from "../utils/endpoints";

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const routeData = useRouteLoaderData("routes/app");
  const revalidator = useRevalidator();
  const embedFetcher = useFetcher();
  const pendingEmbedResolverRef = useRef(null);

  const shopData = routeData?.shopData || null;

  // Prefer the latest fetcher result once the user has manually refreshed; otherwise
  // fall back to the value that came in via the parent route loader.
  const initialEmbedEnabled = !!routeData?.embedStatus?.isEnabled;
  const currentEmbedEnabled = embedFetcher.data
    ? !!embedFetcher.data.isEnabled
    : initialEmbedEnabled;

  const embedStatus = {
    isEnabled: currentEmbedEnabled,
    isLoading: embedFetcher.state !== "idle",
  };

  const isLoading = revalidator.state !== "idle";
  const permissions = shopData?.permissions || { skinEnabled: true, hairEnabled: true };

  const checkEmbedStatus = useCallback(
    () =>
      new Promise((resolve) => {
        pendingEmbedResolverRef.current = resolve;
        embedFetcher.load(ENDPOINTS.APP_EMBED_STATUS);
      }),
    [embedFetcher],
  );

  useEffect(() => {
    if (
      embedFetcher.state === "idle" &&
      embedFetcher.data &&
      pendingEmbedResolverRef.current
    ) {
      pendingEmbedResolverRef.current(!!embedFetcher.data.isEnabled);
      pendingEmbedResolverRef.current = null;
    }
  }, [embedFetcher.state, embedFetcher.data]);

  const refreshShop = useCallback(() => {
    revalidator.revalidate();
    return Promise.resolve(shopData);
  }, [revalidator, shopData]);

  return (
    <ShopContext.Provider
      value={{
        shopData,
        permissions,
        isLoading,
        error: null,
        embedStatus,
        checkEmbedStatus,
        refreshShop,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
