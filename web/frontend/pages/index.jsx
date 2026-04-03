import {
  Card,
  Page,
  Layout,
  Text,
  BlockStack,
  InlineStack,
  Box,
  ProgressBar,
  Banner,
  Button,
  Link,
  Icon,
} from "@shopify/polaris";
import { 
  CheckCircleIcon,
  LayoutHeaderIcon,
  SettingsIcon,
  PaintBrushRoundIcon,
  ProductIcon
} from "@shopify/polaris-icons";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation, Trans } from "react-i18next";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// components 
import { SetupStep } from "../components/setupguide";

export default function HomePage() {
  const { t } = useTranslation();
  const shopify = useAppBridge();
  const navigate = useNavigate();

  const [isEmbedEnabled, setIsEmbedEnabled] = useState(false);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(true);

  console.log("isEmbedEnabled:::", isEmbedEnabled)

  const checkEmbedStatus = async () => {
    try {
      console.log("called api")
      const response = await fetch("/api/app-embed-status");
      console.log("response:::", response)
      const { isEnabled } = await response.json();

      setIsEmbedEnabled(isEnabled);
    } catch (error) {
      console.error("Failed to check app-embed status:", error);
    } finally {
      setIsLoadingEmbed(false);
    }
  };

  useEffect(() => {
    checkEmbedStatus();
  }, []);

  // Mock state for completion (in a real app, this would come from a backend or state)
  const stepsCompleted = isEmbedEnabled ? 2 : 1;
  const totalSteps = 4;
  const progress = (stepsCompleted / totalSteps) * 100;

  const handleOpenThemeStore = () => {
    const shop = shopify.config.shop || new URLSearchParams(window.location.search).get("shop");
    if (!shop) {
      console.warn("Shop domain not found for redirect.");
      return;
    }
    // Deep link to App Embed section: admin/themes/current/editor?context=apps&activateAppId={appId}/{extensionHandle}
    const appId = "92882f522785015d08e74946009e779f";
    const extensionHandle = "ai-dermatics-disabled";
    const url =  `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${appId}/${extensionHandle}`;
    window.open(url, "_blank");
  };

  return (
    <Page narrowWidth>
      <TitleBar title={t("NavigationMenu.setupGuide")} />
      
      <BlockStack gap="500">
        {/* Header Section */}
        <Box padding="400" background="bg-surface-secondary" borderRadius="300">
          <BlockStack gap="400">
            <BlockStack gap="200">
              <Text as="h1" variant="headingLg">
                {t("SetupGuide.title")}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                {t("SetupGuide.subtitle")}
              </Text>
            </BlockStack>
            
            <BlockStack gap="200">
              <InlineStack align="space-between">
                <Text as="p" variant="bodySm" fontWeight="bold">
                  {t("SetupGuide.progress", { count: stepsCompleted })}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {Math.round(progress)}%
                </Text>
              </InlineStack>
              <ProgressBar progress={progress} size="small" tone="success" />
            </BlockStack>
          </BlockStack>
        </Box>

        {/* Setup Steps */}
        <BlockStack gap="300">
          <SetupStep
            number={1}
            title={t("SetupGuide.steps.step1.title")}
            description={t("SetupGuide.steps.step1.description")}
            buttonText={t("SetupGuide.steps.step1.button")}
            icon={LayoutHeaderIcon}
            isCompleted={isEmbedEnabled}
            onAction={handleOpenThemeStore}
          />
          <SetupStep
            number={2}
            title={t("SetupGuide.steps.step2.title")}
            description={t("SetupGuide.steps.step2.description")}
            buttonText={t("SetupGuide.steps.step2.button")}
            icon={SettingsIcon}
            isCompleted={false}
            onAction={() => navigate("/customization")}
          />
          <SetupStep
            number={3}
            title={t("SetupGuide.steps.step3.title")}
            description={t("SetupGuide.steps.step3.description")}
            buttonText={t("SetupGuide.steps.step3.button")}
            icon={PaintBrushRoundIcon}
            isCompleted={false}
          />
          <SetupStep
            number={4}
            title={t("SetupGuide.steps.step4.title")}
            description={t("SetupGuide.steps.step4.description")}
            buttonText={t("SetupGuide.steps.step4.button")}
            icon={ProductIcon}
            isCompleted={false}
          />
        </BlockStack>

        <Box paddingBlockStart="400" paddingBlockEnd="400">
          <InlineStack align="center">
            <Text as="p" variant="bodySm" tone="subdued">
              <Trans
                i18nKey="SetupGuide.footer"
                components={{
                  DocumentationLink: <Link url="https://help.shopify.com" external />,
                  SupportLink: <Link url="mailto:support@example.com" />
                }}
              />
            </Text>
          </InlineStack>
        </Box>
      </BlockStack>
    </Page>
  );
}


