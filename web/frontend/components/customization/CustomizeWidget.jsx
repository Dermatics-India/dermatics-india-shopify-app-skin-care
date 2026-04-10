import React, { useState, useEffect, useCallback } from "react";
import { Page, Layout, Card, Box, Tabs, Divider, Scrollable } from "@shopify/polaris";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { produce } from "immer";

// hooks 
import { useCustomizeData } from "../../hooks/useCustomizeData";
import { useApi } from "../../hooks/useApi";

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


export function CustomizeWidget({ type }) {
  const shopify = useAppBridge();
  const { t } = useTranslation();
  const api = useApi()
  const settingsSaveBarId = 'settings-save-bar'
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
        flags: defaultSettings.flags,
      };
  // Initial State matching the requested schema
  const [selectedTab, setSelectedTab] = useState(0);
  const [settings, setSettings] = useState(fallbackSettings)
  const [prevSettings, setPrevSettings] = useState(fallbackSettings)
  const [isPageLoading, setPageLoading] = useState(true); 
  const [isSavebarLoading, setSavebarLoading] = useState(false);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(prevSettings);

  console.log("settings:::", settings)

  const getSettingsData = () => {
    setPageLoading(true)
    api.get(ENDPOINTS.GET_SETTINGS, { type })
      .then(res => {
        // const settingsObj = isCustomizePage
        //   ? {
        //       widget: res?.data?.widget || fallbackSettings?.widget,
        //       drawer: res?.data?.drawer || fallbackSettings?.drawer,
        //     }
        //   : {
        //       widget: res?.data?.widget || fallbackSettings?.widget,
        //       drawer: res?.data?.drawer || fallbackSettings?.drawer,
        //       modules: res?.data?.modules || fallbackSettings?.modules,
        //       flags: res?.data?.flags || fallbackSettings?.flags,
        //     };
        const settingsObj = {
          widget: res?.data?.widget || fallbackSettings?.widget,
          drawer: res?.data?.drawer || fallbackSettings?.drawer,
          modules: res?.data?.modules || fallbackSettings?.modules,
          flags: res?.data?.flags || fallbackSettings?.flags,
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
        modules: settings.modules, // Sending the full object { skinCare: ..., hairCare: ... }
        // flags: settings.flags
      };

    api.post(ENDPOINTS.UPDATE_SETTINGS, payload)
      .then(res => {
        const data = res?.data;
        const syncSettings = {
          widget: data?.widget,
          drawer: data?.drawer,
          modules: data?.modules,
          flags: data?.flags
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
    // path would be an array, e.g., ["bubble", "boat", "height"]
    setSettings(
      produce((draft) => {
        let current = draft.drawer;
        // Navigate to the second-to-last key
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
        }
        // Update the value
        current[path[path.length - 1]] = value;
      })
    );
  };

  const handleSave = () => {
    updateSettings(settings)
  };

  const handleModuleChange = (section, field, value) => {
    if (section) {
      setSettings((prev) => ({
        ...prev,
        modules: {
          ...prev.modules,
          [currentModuleKey]: {
            ...prev.modules[currentModuleKey],
            [section]: {
              ...prev.modules[currentModuleKey][section],
              [field]: value,
            },
          }
        },
      }));
      return;
    }

    setSettings((prev) => ({
      ...prev,
      modules: { 
        ...prev.modules, 
        [currentModuleKey]: {
          ...prev.modules[currentModuleKey],
          [field]: value },
        }
    }));
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
    // backAction={{ content: t("Customization.settings.back"), url: "/customization" }}
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
