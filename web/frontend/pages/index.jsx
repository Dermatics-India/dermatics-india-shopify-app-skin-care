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
} from "@shopify/polaris";
import { 
  ChevronUpIcon,
  ChevronDownIcon  
} from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";

// components 
import { SetupStep } from "../components/setupguide";


// Assets
import Step1Img from "../assets/step1.png";
import Step2Img from "../assets/step2.png";

export default function HomePage() {
  const { t } = useTranslation();
  const shopify = useAppBridge();
  const navigate = useNavigate();

  const [isEmbedEnabled, setIsEmbedEnabled] = useState(false);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(true);
  
  // Accordion state
  const [activeStep, setActiveStep] = useState('step1');
  const [guideExpanded, setGuideExpanded] = useState(true);

  // Manual completion state for other steps
  const [completedSteps, setCompletedSteps] = useState({
    step1: false,
    step2: false,
    // step3: false,
    // step4: false,
  });

  const checkEmbedStatus = () => {
    fetch("/api/app-embed-status")
      .then((response) => response.json())
      .then((data) => {
        setIsEmbedEnabled(data.isEnabled);
        setCompletedSteps(prev => ({ ...prev, step1: data.isEnabled }));
      })
      .catch((error) => {
        console.error("Failed to check app-embed status:", error);
      })
      .finally(() => {
        setIsLoadingEmbed(false);
      });
  };

  useEffect(() => {
    checkEmbedStatus();
  }, []);

  const handleOpenThemeStore = () => {
    const shop = shopify.config.shop || new URLSearchParams(window.location.search).get("shop");
    if (!shop) return;
    const appId = shopify.config.apiKey;
    const extensionHandle = "ai-dermatics-disabled";
    const url =  `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${appId}/${extensionHandle}`;
    window.open(url, "_blank");
  };

  const steps = useMemo(() => [
    {
      id: 'step1',
      title: t("SetupGuide.steps.step1.title"),
      description: t("SetupGuide.steps.step1.description"),
      buttonText: t("SetupGuide.steps.step1.button"),
      isCompleted: isEmbedEnabled,
      onAction: handleOpenThemeStore,
      illustration: Step1Img
    },
    {
      id: 'step2',
      title: t("SetupGuide.steps.step2.title"),
      description: t("SetupGuide.steps.step2.description"),
      buttonText: t("SetupGuide.steps.step2.button"),
      isCompleted: completedSteps.step2,
      onAction: () => navigate("/customization"),
      illustration: Step2Img
    },
    // {
    //   id: 'step3',
    //   title: t("SetupGuide.steps.step3.title"),
    //   description: t("SetupGuide.steps.step3.description"),
    //   buttonText: t("SetupGuide.steps.step3.button"),
    //   isCompleted: completedSteps.step3,
    //   onAction: () => navigate("/customization"), // Temporarily pointing here
    // },
    // {
    //   id: 'step4',
    //   title: t("SetupGuide.steps.step4.title"),
    //   description: t("SetupGuide.steps.step4.description"),
    //   buttonText: t("SetupGuide.steps.step4.button"),
    //   isCompleted: completedSteps.step4,
    //   onAction: () => navigate("/analytics"), // Temporarily pointing here
    // }
  ], [t, isEmbedEnabled, completedSteps, navigate]);

  const completedCount = steps.filter(s => s.isCompleted).length;

  return (
    <Page narrowWidth>
      <Card padding="0">
        <Box padding="400">
          <BlockStack gap="400">
            <BlockStack gap="200">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingLg" as="h2">{t("SetupGuide.title")}</Text>
                <Button
                  icon={guideExpanded ? ChevronUpIcon : ChevronDownIcon}
                  variant="tertiary"
                  onClick={() => setGuideExpanded(!guideExpanded)}
                />
              </InlineStack>
              <Text as="p" tone="subdued">
                {completedCount} out of {steps.length} steps completed
              </Text>
            </BlockStack>

            <Collapsible open={guideExpanded} id="setup-guide-collapsible">
              <Box paddingBlockStart="200">
                {steps.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <SetupStep
                      title={step.title}
                      description={step.description}
                      buttonText={step.buttonText}
                      isCompleted={step.isCompleted}
                      onAction={step.onAction}
                      isExpanded={activeStep === step.id}
                      onToggleExpand={() => setActiveStep(activeStep === step.id ? null : step.id)}
                      onToggleComplete={() => setCompletedSteps(prev => ({ 
                        ...prev, 
                        [step.id]: !prev[step.id] 
                      }))}
                      illustration={step.illustration}
                    />
                    {index < steps.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </Box>
            </Collapsible>
          </BlockStack>
        </Box>
      </Card>

      <Box paddingBlockStart="400" paddingBlockEnd="400">
        <InlineStack align="center">
          <Text as="p" variant="bodySm" tone="subdued">
             {t("SetupGuide.footer")}
          </Text>
        </InlineStack>
      </Box>
    </Page>
  );
}
