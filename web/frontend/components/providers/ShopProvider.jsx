import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useApi } from "../../hooks/useApi";
import { ENDPOINTS } from "../../utils/endpoints";

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const api = useApi();
  const [shopData, setShopData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [embedStatus, setEmbedStatus] = useState({ isEnabled: false, isLoading: true });

  const fetchShopData = useCallback(async() => {
    return api.get(ENDPOINTS.GET_SHOP)
      .then((res) => {
        setShopData(res?.data);
        return res?.data;
      })
      .catch((err) => {
        console.error("Failed to fetch shop data:", err);
        setError(err);
      });
  }, []);

  const checkEmbedStatus = useCallback(async() => {
    setEmbedStatus((prev) => ({ ...prev, isLoading: true }));
    return api.get(ENDPOINTS.APP_EMBED_STATUS)
      .then((res) => {
        setEmbedStatus({ isEnabled: !!res?.isEnabled, isLoading: false });
        return !!res?.isEnabled;
      })
      .catch(() => {
        setEmbedStatus({ isEnabled: false, isLoading: false });
        return false;
      });
  }, []);

  useEffect(() => {
    Promise.all([fetchShopData(), checkEmbedStatus()])
    .finally(() => setIsLoading(false));
  }, []);

  const permissions = shopData?.permissions || { skinEnabled: true, hairEnabled: true };

  return (
    <ShopContext.Provider value={{
      shopData,
      permissions,
      isLoading,
      error,
      embedStatus,
      checkEmbedStatus,
      refreshShop: fetchShopData,
    }}>
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
