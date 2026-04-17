import {
  Card,
  Page,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Button,
  Collapsible,
  Divider,
  ProgressBar,
  Banner,
  Badge,
} from "@shopify/polaris";
import {
  ChevronUpIcon,
  ChevronDownIcon,
} from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";

// Components
import { SetupStep } from "../components/setupguide";

// Context
import { useShop } from "../components/providers/ShopProvider";

// Assets
import Step1Img from "../assets/step1.png";
import Step2Img from "../assets/step2.png";

export default function HomePage() {
  const { t } = useTranslation();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const { shopData, embedStatus, checkEmbedStatus } = useShop();

  const [activeStep, setActiveStep] = useState(null);
  const [guideExpanded, setGuideExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isCustomized = shopData?.settings?.isCustomized || false;

  // Auto-expand the first incomplete step
  useEffect(() => {
    if (embedStatus.isLoading) return;
    if (!embedStatus.isEnabled) {
      setActiveStep("step1");
    } else if (!isCustomized) {
      setActiveStep("step2");
    } else {
      setActiveStep("step1");
    }
  }, [embedStatus.isLoading, embedStatus.isEnabled, isCustomized]);

  const handleOpenThemeEditor = useCallback(() => {
    const shop = shopData?.shop || shopify?.config?.shop || new URLSearchParams(window.location.search).get("shop");
    if (!shop) return;
    const appClientId = import.meta.env.VITE_SHOPIFY_API_KEY;
    const extensionUuid = import.meta.env.VITE_EXTENSION_UUID;
    const url = `https://${shop}/admin/themes/current/editor?context=apps&template=index&activateAppId=${appClientId}/${extensionUuid}`;
    window.open(url, "_blank");
  }, [shopData, shopify]);

  const handleRefreshEmbedStatus = useCallback(() => {
    setIsRefreshing(true);
    checkEmbedStatus()
      .then((isEnabled) => {
        if (isEnabled) {
          shopify.toast.show(t("SetupGuide.toast.embedEnabled"));
          if (!isCustomized) setActiveStep("step2");
        } else {
          shopify.toast.show(t("SetupGuide.toast.embedNotDetected"), { isError: true });
        }
      })
      .finally(() => setIsRefreshing(false));
  }, [checkEmbedStatus, isCustomized, shopify, t]);

  const steps = useMemo(() => [
    {
      id: "step1",
      title: t("SetupGuide.steps.step1.title"),
      description: t("SetupGuide.steps.step1.description"),
      buttonText: t("SetupGuide.steps.step1.button"),
      isCompleted: embedStatus.isEnabled,
      isActive: !embedStatus.isEnabled,
      onAction: handleOpenThemeEditor,
      illustration: Step1Img,
      isChecking: embedStatus.isLoading,
      secondaryAction: !embedStatus.isEnabled ? {
        content: t("SetupGuide.steps.step1.refresh"),
        onAction: handleRefreshEmbedStatus,
        loading: isRefreshing,
        disabled: isRefreshing,
      } : null,
    },
    {
      id: "step2",
      title: t("SetupGuide.steps.step2.title"),
      description: t("SetupGuide.steps.step2.description"),
      buttonText: t("SetupGuide.steps.step2.button"),
      isCompleted: isCustomized,
      isActive: embedStatus.isEnabled && !isCustomized,
      onAction: () => navigate("/customization"),
      illustration: Step2Img,
    },
  ], [t, embedStatus, isCustomized, handleOpenThemeEditor, handleRefreshEmbedStatus, isRefreshing, navigate]);

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const allDone = completedCount === steps.length;

  return (
    <Page narrowWidth>
      <BlockStack gap="400">
        {/* Welcome Banner */}
        {allDone && (
          <Banner
            title={t("SetupGuide.completeBanner.title")}
            tone="success"
            onDismiss={() => {}}
          >
            <p>{t("SetupGuide.completeBanner.description")}</p>
          </Banner>
        )}

        {/* Setup Guide Card */}
        <Card padding="0">
          {/* Header */}
          <Box padding="400" paddingBlockEnd="200">
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text variant="headingLg" as="h2">
                    {t("SetupGuide.title")}
                  </Text>
                  <Text as="p" tone="subdued" variant="bodySm">
                    {t("SetupGuide.subtitle")}
                  </Text>
                </BlockStack>
                <Button
                  icon={guideExpanded ? ChevronUpIcon : ChevronDownIcon}
                  variant="tertiary"
                  onClick={() => setGuideExpanded(!guideExpanded)}
                  accessibilityLabel="Toggle setup guide"
                />
              </InlineStack>

              {/* Progress */}
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="bodySm" as="p" tone="subdued">
                    {completedCount} of {steps.length} steps completed
                  </Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    {progressPercent}%
                  </Text>
                </InlineStack>
                <ProgressBar
                  progress={progressPercent}
                  size="small"
                  tone="primary"
                />
              </BlockStack>
            </BlockStack>
          </Box>

          {/* Steps */}
          <Collapsible open={guideExpanded} id="setup-guide-collapsible">
            <Box paddingBlockStart="100" paddingBlockEnd="200">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  {index > 0 && (
                    <Box paddingInlineStart="400" paddingInlineEnd="400">
                      <Divider />
                    </Box>
                  )}
                  <SetupStep
                    title={step.title}
                    description={step.description}
                    buttonText={step.buttonText}
                    isCompleted={step.isCompleted}
                    isActive={step.isActive}
                    onAction={step.onAction}
                    isExpanded={activeStep === step.id}
                    onToggleExpand={() => setActiveStep(activeStep === step.id ? null : step.id)}
                    illustration={step.illustration}
                    stepNumber={index + 1}
                    isChecking={step.isChecking}
                    secondaryAction={step.secondaryAction}
                  />
                </React.Fragment>
              ))}
            </Box>
          </Collapsible>
        </Card>

        {/* Current Plan Card */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text variant="headingMd" as="h3">
                  {t("SetupGuide.currentPlan.title")}
                </Text>
                <InlineStack gap="200" blockAlign="center">
                  <Text variant="headingLg" as="p">
                    {shopData?.subscription?.planName || "Free"}
                  </Text>
                  {/* <Badge tone={shopData?.subscription?.status === "ACTIVE" ? "success" : "info"}>
                    {shopData?.subscription?.status || "Active"}
                  </Badge> */}
                </InlineStack>
              </BlockStack>
              <Button onClick={() => navigate("/plans")}>
                {t("SetupGuide.currentPlan.manage")}
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Footer */}
        <Box paddingBlockEnd="400">
          <InlineStack align="center">
            <Text as="p" variant="bodySm" tone="subdued">
              {t("SetupGuide.footer")}
            </Text>
          </InlineStack>
        </Box>
      </BlockStack>
    </Page>
  );
}
