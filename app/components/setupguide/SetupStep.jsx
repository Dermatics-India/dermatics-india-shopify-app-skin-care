import { useTranslation } from "react-i18next";

export function SetupStep({
  title,
  description,
  buttonText,
  isCompleted,
  isActive,
  onAction,
  isExpanded,
  onToggleExpand,
  illustration,
  stepNumber,
  isChecking,
  secondaryAction,
}) {
  const { t } = useTranslation();

  return (
    <s-box paddingBlock="small-300" paddingInline="base">
      <s-stack direction="block" gap="small-300">
        <div
          onClick={onToggleExpand}
          style={{ cursor: "pointer" }}
        >
          <s-stack direction="inline" alignItems="center" justifyContent="space-between" gap="small-300">
            <s-stack direction="inline" alignItems="center" gap="small-300">
              <s-box inlineSize="28px" blockSize="28px">
                <s-stack direction="inline" alignItems="center" justifyContent="center" inlineSize="28px" blockSize="28px">
                  {isChecking ? (
                    <s-spinner size="small" accessibilityLabel="Checking" />
                  ) : (
                    <s-icon
                      type={isCompleted ? "check-circle" : "alert-circle"}
                      tone={isCompleted ? "success" : "warning"}
                    />
                  )}
                </s-stack>
              </s-box>
              <s-stack direction="inline" alignItems="center" gap="small-200">
                <s-text
                  fontWeight={isExpanded ? "bold" : "medium"}
                  tone={isCompleted ? "subdued" : undefined}
                >
                  {title}
                </s-text>
                {isCompleted && <s-badge tone="success">{t("SetupGuide.badges.done")}</s-badge>}
                {isActive && !isCompleted && (
                  <s-badge tone="warning">{t("SetupGuide.badges.actionNeeded")}</s-badge>
                )}
              </s-stack>
            </s-stack>
            <div
              style={{
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 200ms ease-in-out",
                display: "inline-flex",
              }}
            >
              <s-icon source="chevron-down" tone="subdued" />
            </div>
          </s-stack>
        </div>

        <div
          id={`setup-step-${stepNumber}`}
          style={{
            overflow: "hidden",
            maxHeight: isExpanded ? "1000px" : "0px",
            transition: "max-height 200ms ease-in-out",
          }}
        >
          <s-box paddingInlineStart="large-200">
            <s-box
              padding="base"
              background="subdued"
              borderRadius="large"
            >
              <s-grid
                gridTemplateColumns={illustration ? "2fr 1fr" : "1fr"}
                gap="base"
                alignItems="center"
              >
                <s-stack direction="block" gap="base">
                  <s-paragraph tone="subdued">{description}</s-paragraph>
                  <s-stack direction="inline" gap="small-200">
                    {buttonText && (
                      <s-button variant="primary" onClick={onAction} disabled={isChecking}>
                        {buttonText}
                      </s-button>
                    )}
                    {secondaryAction && (
                      <s-button
                        onClick={secondaryAction.onAction}
                        loading={secondaryAction.loading ? "" : undefined}
                        disabled={secondaryAction.disabled}
                      >
                        {secondaryAction.content}
                      </s-button>
                    )}
                  </s-stack>
                </s-stack>
                {illustration && (
                  <img
                    src={illustration}
                    alt=""
                    style={{
                      width: "100%",
                      maxWidth: "120px",
                      height: "auto",
                      display: "block",
                      borderRadius: "12px",
                      marginLeft: "auto",
                    }}
                  />
                )}
              </s-grid>
            </s-box>
          </s-box>
        </div>
      </s-stack>
    </s-box>
  );
}
