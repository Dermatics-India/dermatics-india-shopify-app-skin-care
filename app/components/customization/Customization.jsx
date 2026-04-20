import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { produce } from "immer";

import { useApi } from "../../hooks/useApi";
import { useCustomizeData } from "../../hooks/useCustomizeData";
import { useShop } from "../../providers/ShopProvider";

import { WidgetPreview } from "./WidgetPreview";
import { WidgetSettings } from "./settings/WidgetSettings";
import { DrawerSettings } from "./settings/DrawerSettings";
import { ModuleSettings } from "./settings/ModuleSettings";
import { LoadingOverlay, WidgetPageLoader } from "../common";

import { defaultSettings } from "../../data/customization";
import { ENDPOINTS } from "../../utils/endpoints";

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        borderBottom: active ? "2px solid var(--p-color-text, #111)" : "2px solid transparent",
        padding: "12px 16px",
        fontWeight: active ? 600 : 500,
        color: active ? "var(--p-color-text, #111)" : "var(--p-color-text-subdued, #6d7175)",
        cursor: "pointer",
        flex: 1,
      }}
    >
      {children}
    </button>
  );
}

export function Customization({ type }) {
  const shopify = useAppBridge();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const api = useApi();
  const { permissions } = useShop();
  const settingsSaveBarId = "settings-save-bar";

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { tabs } = useCustomizeData();
  const isCustomizePage = type === "customize";
  const currentModuleKey = type;
  const fallbackSettings = isCustomizePage
    ? { widget: defaultSettings.widget, drawer: defaultSettings.drawer }
    : {
        widget: defaultSettings.widget,
        drawer: defaultSettings.drawer,
        modules: defaultSettings.modules,
      };

  const [selectedTab, setSelectedTab] = useState(0);
  const [settings, setSettings] = useState(fallbackSettings);
  const [prevSettings, setPrevSettings] = useState(fallbackSettings);
  const [isPageLoading, setPageLoading] = useState(true);
  const [isSavebarLoading, setSavebarLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(prevSettings);

  useEffect(() => {
    if (isPageLoading) return;
    let hasAccess = false;
    if (currentModuleKey === "customize") hasAccess = true;
    if (currentModuleKey === "skinCare") hasAccess = permissions?.skinEnabled;
    if (currentModuleKey === "hairCare") hasAccess = permissions?.hairEnabled;

    if (!hasAccess) {
      shopify.toast.show("Upgrade your plan for use", { isError: true });
      navigate("/app/customization");
    }
  }, [permissions, isPageLoading, currentModuleKey]);

  const getSettingsData = () => {
    setPageLoading(true);
    api
      .get(ENDPOINTS.GET_SETTINGS)
      .then((res) => {
        const settingsObj = {
          widget: res?.data?.widget || fallbackSettings?.widget,
          drawer: res?.data?.drawer || fallbackSettings?.drawer,
          modules: res?.data?.modules || fallbackSettings?.modules,
        };
        setSettings(settingsObj);
        setPrevSettings(settingsObj);
      })
      .catch((error) => {
        shopify.toast.show(error.message, { isError: true });
      })
      .finally(() => setPageLoading(false));
  };

  const updateSettings = () => {
    setSavebarLoading(true);
    const payload = {
      widget: settings.widget,
      drawer: settings.drawer,
      modules: settings.modules,
    };
    api
      .post(ENDPOINTS.UPDATE_SETTINGS, payload)
      .then((res) => {
        const data = res?.data;
        const syncSettings = {
          widget: data?.widget,
          drawer: data?.drawer,
          modules: data?.modules,
        };
        setSettings(syncSettings);
        setPrevSettings(syncSettings);
        shopify.toast.show(res?.message);
      })
      .catch((error) => {
        shopify.toast.show(error.message, { isError: true });
      })
      .finally(() => setSavebarLoading(false));
  };

  useEffect(() => {
    getSettingsData();
  }, [type]);

  useEffect(() => {
    if (isDirty) {
      shopify.saveBar.show(settingsSaveBarId);
    } else {
      shopify.saveBar.hide(settingsSaveBarId);
    }
  }, [isDirty, shopify]);

  const handleWidgetChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      widget: { ...prev.widget, [field]: value },
    }));
  };

  const handleDrawerChange = (path, value) => {
    setSettings(
      produce((draft) => {
        let current = draft.drawer;
        for (let i = 0; i < path.length - 1; i++) current = current[path[i]];
        current[path[path.length - 1]] = value;
      }),
    );
  };

  const handleModuleChange = (path, value) => {
    setSettings(
      produce((draft) => {
        const moduleDraft = draft.modules[currentModuleKey];
        let current = moduleDraft;
        for (let i = 0; i < path.length - 1; i++) current = current[path[i]];
        current[path[path.length - 1]] = value;
      }),
    );
  };

  const handleModuleImageUpload = async (file) => {
    if (!file || !currentModuleKey) return;
    setIsImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("moduleType", currentModuleKey);

      const res = await api.postFormData(ENDPOINTS.UPLOAD_CUSTOMIZATION_IMAGE, formData);
      const uploadedUrl = res?.data?.url;
      if (!uploadedUrl) throw new Error("Image upload failed");
      handleModuleChange(["image", "url"], uploadedUrl);
      shopify.toast.show("Image uploaded");
    } catch (error) {
      shopify.toast.show(error.message || "Failed to upload image", { isError: true });
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleDiscard = () => {
    shopify.saveBar.hide(settingsSaveBarId);
    setSettings(prevSettings);
  };

  const handleSave = () => updateSettings();

  const handleTabChange = useCallback((i) => setSelectedTab(i), []);

  if (isPageLoading) return <WidgetPageLoader />;

  const title =
    type === "customize"
      ? t("Customization.settings.titleWidget")
      : type === "skinCare"
        ? t("Customization.settings.titleSkin")
        : t("Customization.settings.titleHair");

  return (
    <s-page
      heading={title} 
    >
      <s-link slot="breadcrumb-actions" href="/app/customization">{ t("Customization.settings.back") }</s-link>

      <LoadingOverlay active={isSavebarLoading}>
        <s-grid gridTemplateColumns="1fr 2fr" gap="base">
          <s-section padding="none">
            {isCustomizePage && (
              <>
                <div style={{ display: "flex" }}>
                  {tabs.map((tab, i) => (
                    <TabButton
                      key={tab.id}
                      active={selectedTab === i}
                      onClick={() => handleTabChange(i)}
                    >
                      {tab.content}
                    </TabButton>
                  ))}
                </div>
                <s-divider />
              </>
            )}
            <div
              style={{
                height: "calc(100vh - 250px)",
                minHeight: "600px",
                overflowY: "auto",
              }}
            >
              {isCustomizePage && selectedTab === 0 && (
                <WidgetSettings data={settings} onChange={handleWidgetChange} />
              )}
              {isCustomizePage && selectedTab === 1 && (
                <DrawerSettings data={settings} onChange={handleDrawerChange} />
              )}
              {!isCustomizePage && (
                <ModuleSettings
                  data={settings.modules[type]}
                  onChange={handleModuleChange}
                  onImageUpload={handleModuleImageUpload}
                  isImageUploading={isImageUploading}
                />
              )}
            </div>
          </s-section>

          <s-section padding="none">
            <div
              style={{
                background: "var(--p-color-bg-surface-secondary, #f6f6f7)",
                padding: "16px",
                minHeight: "650px",
                borderRadius: "8px",
                border: "1px solid var(--p-color-border, #e1e3e5)",
              }}
            >
              <div
                style={{
                  background: "var(--p-color-bg-surface, #ffffff)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  border: "1px solid var(--p-color-border, #e1e3e5)",
                }}
              >
                <WidgetPreview
                  type={type}
                  data={settings}
                  permissions={permissions}
                  isDrawerOpen={isDrawerOpen}
                  setIsDrawerOpen={setIsDrawerOpen}
                />
              </div>
            </div>
          </s-section>
        </s-grid>
      </LoadingOverlay>

      <SaveBar id={settingsSaveBarId}>
        <button
          variant="primary"
          onClick={handleSave}
          loading={isSavebarLoading ? "true" : undefined}
          disabled={isSavebarLoading}
        >
          {t("cmn.save")}
        </button>
        <button onClick={handleDiscard} disabled={isSavebarLoading}>
          {t("cmn.discard")}
        </button>
      </SaveBar>
    </s-page>
  );
}
