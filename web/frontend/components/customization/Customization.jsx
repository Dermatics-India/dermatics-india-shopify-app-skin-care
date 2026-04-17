import React, { useState, useEffect, useCallback } from "react";
import { Page, Layout, Card, Box, Tabs, Divider, Scrollable } from "@shopify/polaris";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { produce } from "immer";
import { useNavigate } from "react-router-dom";

// hooks
import { useCustomizeData } from "../../hooks/useCustomizeData";
import { useApi } from "../../hooks/useApi";
import { useShop } from "../providers/ShopProvider";

// components 
import { WidgetPreview } from "./WidgetPreview";
import { WidgetSettings } from "./settings/WidgetSettings";
import { DrawerSettings } from "./settings/DrawerSettings";
import { ModuleSettings } from "./settings/ModuleSettings";
import { WidgetPageLoader, LoadingOverlay } from "../common";

// data 
import { defaultSettings } from "../../data/customization";

// ENDPOINTS
import { ENDPOINTS } from "../../utils/endpoints";


export function Customization({ type }) {
  const shopify = useAppBridge();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const api = useApi();
  const { permissions } = useShop();
  const settingsSaveBarId = 'settings-save-bar';
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { tabs } = useCustomizeData()
  const isCustomizePage = type === "customize";
  const currentModuleKey = type;
  const fallbackSettings = isCustomizePage
    ? { widget: defaultSettings.widget, drawer: defaultSettings.drawer }
    : {
        widget: defaultSettings.widget,
        drawer: defaultSettings.drawer,
        modules: defaultSettings.modules,
      };
  // Initial State matching the requested schema
  const [selectedTab, setSelectedTab] = useState(0);
  const [settings, setSettings] = useState(fallbackSettings)
  const [prevSettings, setPrevSettings] = useState(fallbackSettings)
  const [isPageLoading, setPageLoading] = useState(true); 
  const [isSavebarLoading, setSavebarLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(prevSettings);

  useEffect(() => {
    if (isPageLoading) return;
    let hasAccess = false;
    if (currentModuleKey === 'customize') hasAccess = true;
    if (currentModuleKey === 'skinCare') hasAccess = permissions?.skinEnabled;
    if (currentModuleKey === 'hairCare') hasAccess = permissions?.hairEnabled;

    if (!hasAccess) {
      shopify.toast.show("Upgrade your plan for use", { isError: true });
      navigate('/customization');
    }
  }, [permissions, isPageLoading, currentModuleKey]);

  const getSettingsData = () => {
    setPageLoading(true)
    api.get(ENDPOINTS.GET_SETTINGS, { type })
      .then(res => {
        const settingsObj = {
          widget: res?.data?.widget || fallbackSettings?.widget,
          drawer: res?.data?.drawer || fallbackSettings?.drawer,
          modules: res?.data?.modules || fallbackSettings?.modules,
        };
        setSettings(settingsObj)
        setPrevSettings(settingsObj)
      })
      .catch((error) => {
        console.log("error:::", error)  
        shopify.toast.show(error.message, { isError: true })
      })
      .finally(() => setPageLoading(false))
  }

  const updateSettings = () => {
    setSavebarLoading(true)

    const payload = {
        widget: settings.widget,
        drawer: settings.drawer,
        modules: settings.modules,
      };

    api.post(ENDPOINTS.UPDATE_SETTINGS, payload)
      .then(res => {
        const data = res?.data;
        const syncSettings = {
          widget: data?.widget,
          drawer: data?.drawer,
          modules: data?.modules,
        };
        setSettings(syncSettings)
        setPrevSettings(syncSettings)
        shopify.toast.show(res?.message)
      })
      .catch((error) => {
        console.log("error:::", error)  
        shopify.toast.show(error.message, { isError: true })
      })
      .finally(() => setSavebarLoading(false))
  }
  
  useEffect(() => {
    getSettingsData()
  }, [type])

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
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
      })
    );
  };

  const handleSave = () => {
    updateSettings(settings)
  };

  const handleModuleChange = (path, value) => {
    setSettings(
      produce((draft) => {
        const moduleDraft = draft.modules[currentModuleKey];
        let current = moduleDraft;
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
      })
    );
  };

  const handleModuleImageUpload = async (file) => {
    if (!file || !currentModuleKey) return;
    setIsImageUploading(true);
    // console.log("file:::", file)
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("moduleType", currentModuleKey);
      // console.log("---steps-1")

      const res = await api.postFormData(ENDPOINTS.UPLOAD_CUSTOMIZATION_IMAGE, formData);
      // console.log("---steps-2")
      const uploadedUrl = res?.data?.url;
      if (!uploadedUrl) {
        throw new Error("Image upload failed");
      }
      // console.log("---steps-3")
      handleModuleChange(["image", "url"], uploadedUrl);
      shopify.toast.show("Image uploaded");
    } catch (error) {
      // console.log("handleModuleImageUpload::error")
      shopify.toast.show(error.message || "Failed to upload image", { isError: true });
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleDiscard = () => {
    shopify.saveBar.hide()
    setSettings(prevSettings)
  }

  const handleTabChange = useCallback(
    (selectedTabIndex) => setSelectedTab(selectedTabIndex),
  []);

  if (isPageLoading) {
    return (
      <WidgetPageLoader />
    )
  }

  return (
    <Page
      title={
        type === "customize"
          ? t("Customization.settings.titleWidget")
          : type === "skinCare"
          ? t("Customization.settings.titleSkin")
          : t("Customization.settings.titleHair")
      }
    // primaryAction={{ content: t("Customization.settings.save"), onAction: handleSave }}
    // fullWidth
    backAction={{ content: t("Customization.settings.back"), onAction: () => navigate("/customization")  }}
    >
      <LoadingOverlay active={isSavebarLoading}>
      <Layout>
        {/* Settings Sidebar */}
        <Layout.Section variant="oneThird">
          <Card padding="0">
            <Box paddingInlineStart="100" paddingInlineEnd="100">
              {isCustomizePage ? (
                <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} fitted />
              ) : null}
            </Box>
            {isCustomizePage ? <Divider borderColor="border" /> : null}
            <Scrollable 
              style={{ 
                height: 'calc(100vh - 250px)', 
                minHeight: '600px' 
              }} 
              shadow
            >
            <Box padding="">
              {isCustomizePage && selectedTab === 0 &&
                <WidgetSettings
                  data={settings}
                  onChange={handleWidgetChange}
                />
              }
              {isCustomizePage && selectedTab === 1 &&
                <DrawerSettings
                  data={settings}
                  onChange={handleDrawerChange}
                />
              }
              {!isCustomizePage &&
                <ModuleSettings
                  data={settings.modules[type]}
                  onChange={handleModuleChange}
                  onImageUpload={handleModuleImageUpload}
                  isImageUploading={isImageUploading}
                />
              }
            </Box>
            </Scrollable>
          </Card>
        </Layout.Section>

        {/* Live Preview Canvas */}
        <Layout.Section variant="twoThirds" >
          <Card padding="0">
            <Box background="bg-surface-secondary" padding="400" minHeight="650px" borderRadius="200" borderColor="border" borderWidth="025">
              <Box background="bg-surface" borderRadius="200" overflowX="hidden" overflowY="hidden" shadow="300" borderColor="border" borderWidth="025">
                <WidgetPreview
                  type={type}
                  data={settings}
                  permissions={permissions}
                  isDrawerOpen={isDrawerOpen}
                  setIsDrawerOpen={setIsDrawerOpen}
                />
              </Box>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
      </LoadingOverlay>
      <SaveBar id={settingsSaveBarId}>
        <button 
          variant="primary" 
          onClick={handleSave}
          loading={isSavebarLoading ? "true" : undefined}
          disabled={isSavebarLoading}
        >
          { t("cmn.save") }
        </button>
        <button 
          onClick={handleDiscard}
          disabled={isSavebarLoading}
        >
          { t("cmn.discard") }
        </button>
      </SaveBar>
    </Page>
  );
}
