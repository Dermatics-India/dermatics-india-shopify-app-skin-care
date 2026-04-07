import React, { useState, useEffect, useCallback } from "react";
import { Page, Layout, Card, Box, Tabs, Divider, Scrollable } from "@shopify/polaris";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

// hooks 
import { useCustomizeData } from "../../hooks/useCustomizeData";
import { useApi } from "../../hooks/useApi";

// components 
import { WidgetPreview } from "./WidgetPreview";
import { WidgetSettings } from "./settings/WidgetSettings";
import { DrawerSettings } from "./settings/DrawerSettings";
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

  // Initial State matching the requested schema
  const [selectedTab, setSelectedTab] = useState(0);
  const [settings, setSettings] = useState(defaultSettings)
  const [prevSettings, setPrevSettings] = useState(defaultSettings)
  const [isPageLoading, setPageLoading] = useState(true); 
  const [isSavebarLoading, setSavebarLoading] = useState(false);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(prevSettings);

  const getSettingsData = () => {
    setPageLoading(true)
    api.get(ENDPOINTS.GET_SETTINGS)
      .then(res => {
        // console.log("response data:::", res)
        const drawerSettings = res?.data?.drawer || defaultSettings?.drawer
        const widgetSettings = res?.data?.widget || defaultSettings?.widget
        const settingsObj = { widget: widgetSettings, drawer: drawerSettings }
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
    api.post(ENDPOINTS.UPDATE_SETTINGS, settings)
      .then(res => {
        setSettings(res?.data)
        setPrevSettings(res?.data)
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
  }, [])

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

  const handleDrawerChange = (section, field, value) => {
    if (section) {
      setSettings((prev) => ({
        ...prev,
        drawer: {
          ...prev.drawer,
          [section]: { 
            ...prev.drawer[section], 
            [field]: value
          },
        },
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        drawer: { ...prev.drawer, [field]: value },
      }));
    }
  };

  const handleSave = () => {
    updateSettings(settings)
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
      title={type === "skincare" ? t("Customization.settings.titleSkin") : t("Customization.settings.titleHair")}
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
              <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} fitted />
            </Box>
            <Divider borderColor="border" />
            <Scrollable 
              style={{ 
                height: 'calc(100vh - 250px)', 
                minHeight: '600px' 
              }} 
              shadow
            >
            <Box padding="">
              {selectedTab === 0 &&
                <WidgetSettings
                  data={settings}
                  onChange={handleWidgetChange}
                />
              }
              {selectedTab === 1 &&
                <DrawerSettings
                  data={settings}
                  onChange={handleDrawerChange}
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
