import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { SetupStep } from "../components/setupguide";
import { useShop } from "../providers/ShopProvider";

const Step1Img = "/assets/step1.png";
const Step2Img = "/assets/step2.png";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return {
    extensionUuid: process.env.SHOPIFY_EXTENSION_UUID || process.env.VITE_EXTENSION_UUID || "",
  };
};

export default function SetupGuidePage() {
  const { t } = useTranslation();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const { shopData, embedStatus, checkEmbedStatus } = useShop();

  const [activeStep, setActiveStep] = useState(null);
  const [guideExpanded, setGuideExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isCustomized = shopData?.settings?.isCustomized || false;

  useEffect(() => {
    if (embedStatus.isLoading) return;
    if (!embedStatus.isEnabled) setActiveStep("step1");
    else if (!isCustomized) setActiveStep("step2");
    else setActiveStep("step1");
  }, [embedStatus.isLoading, embedStatus.isEnabled, isCustomized]);

  const handleOpenThemeEditor = useCallback(() => {
    const shop =
      shopData?.shop ||
      shopify?.config?.shop ||
      (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("shop") : null);
    if (!shop) return;
    const appClientId = shopify?.config?.apiKey;
    const extensionUuid =
      (typeof window !== "undefined" && window.__EXTENSION_UUID__) || "";
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

  const steps = useMemo(
    () => [
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
        secondaryAction: !embedStatus.isEnabled
          ? {
              content: t("SetupGuide.steps.step1.refresh"),
              onAction: handleRefreshEmbedStatus,
              loading: isRefreshing,
              disabled: isRefreshing,
            }
          : null,
      },
      {
        id: "step2",
        title: t("SetupGuide.steps.step2.title"),
        description: t("SetupGuide.steps.step2.description"),
        buttonText: t("SetupGuide.steps.step2.button"),
        isCompleted: isCustomized,
        isActive: embedStatus.isEnabled && !isCustomized,
        onAction: () => navigate("/app/customization"),
        illustration: Step2Img,
      },
    ],
    [t, embedStatus, isCustomized, handleOpenThemeEditor, handleRefreshEmbedStatus, isRefreshing, navigate],
  );

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const allDone = completedCount === steps.length;

  return (
    <s-page narrow>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {allDone && (
          <s-banner tone="success" heading={t("SetupGuide.completeBanner.title")}>
            <s-paragraph>{t("SetupGuide.completeBanner.description")}</s-paragraph>
          </s-banner>
        )}

        <s-section padding="none">
          <div style={{ padding: "16px 16px 8px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <s-heading size="large">{t("SetupGuide.title")}</s-heading>
                <s-text tone="subdued">{t("SetupGuide.subtitle")}</s-text>
              </div>
              <s-button
                variant="tertiary"
                icon={guideExpanded ? "chevron-up" : "chevron-down"}
                onClick={() => setGuideExpanded(!guideExpanded)}
                accessibilityLabel="Toggle setup guide"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <s-text tone="subdued">
                  {completedCount} of {steps.length} steps completed
                </s-text>
                <s-text tone="subdued">{progressPercent}%</s-text>
              </div>
              <s-progress-indicator
                progress={progressPercent}
                size="small"
                tone="primary"
              />
            </div>
          </div>

          <div
            id="setup-guide-collapsible"
            style={{
              overflow: "hidden",
              maxHeight: guideExpanded ? "2000px" : "0px",
              transition: "max-height 200ms ease-in-out",
            }}
          >
            <div style={{ padding: "4px 0 8px 0" }}>
              {steps.map((step, index) => (
                <Fragment key={step.id}>
                  {index > 0 && (
                    <div style={{ padding: "0 16px" }}>
                      <s-divider />
                    </div>
                  )}
                  <SetupStep
                    title={step.title}
                    description={step.description}
                    buttonText={step.buttonText}
                    isCompleted={step.isCompleted}
                    isActive={step.isActive}
                    onAction={step.onAction}
                    isExpanded={activeStep === step.id}
                    onToggleExpand={() =>
                      setActiveStep(activeStep === step.id ? null : step.id)
                    }
                    illustration={step.illustration}
                    stepNumber={index + 1}
                    isChecking={step.isChecking}
                    secondaryAction={step.secondaryAction}
                  />
                </Fragment>
              ))}
            </div>
          </div>
        </s-section>

        <s-section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <s-heading>{t("SetupGuide.currentPlan.title")}</s-heading>
              <s-heading size="large">{shopData?.subscription?.planName || "Free"}</s-heading>
            </div>
            <s-button onClick={() => navigate("/app/plans")}>
              {t("SetupGuide.currentPlan.manage")}
            </s-button>
          </div>
        </s-section>

        <div style={{ textAlign: "center", paddingBottom: "16px" }}>
          <s-text tone="subdued">{t("SetupGuide.footer")}</s-text>
        </div>
      </div>
    </s-page>
  );
}
