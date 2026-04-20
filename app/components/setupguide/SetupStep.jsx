import { useTranslation } from "react-i18next";

// Collapsible row on the setup guide page. Polaris web components don't have a
// Collapsible yet, so we gate the expanded content on the `isExpanded` prop
// and animate max-height via CSS.
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
    <div
      style={{
        paddingBlock: "12px",
        paddingInline: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        onClick={onToggleExpand}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isChecking ? (
              <s-spinner size="small" accessibilityLabel="Checking" />
            ) : (
              <s-icon
                source={isCompleted ? "check-circle" : "plus-circle"}
                tone={isCompleted ? "success" : "subdued"}
              />
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <s-text
              fontWeight={isExpanded ? "bold" : "medium"}
              tone={isCompleted ? "subdued" : undefined}
            >
              {title}
            </s-text>
            {isCompleted && <s-badge tone="success">{t("SetupGuide.badges.done")}</s-badge>}
            {isActive && !isCompleted && (
              <s-badge tone="attention">{t("SetupGuide.badges.actionNeeded")}</s-badge>
            )}
          </div>
        </div>
        <div
          style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms ease-in-out",
            display: "inline-flex",
          }}
        >
          <s-icon source="chevron-down" tone="subdued" />
        </div>
      </div>

      <div
        id={`setup-step-${stepNumber}`}
        style={{
          overflow: "hidden",
          maxHeight: isExpanded ? "1000px" : "0px",
          transition: "max-height 200ms ease-in-out",
        }}
      >
        <div style={{ paddingInlineStart: "40px" }}>
          <div
            style={{
              padding: "16px",
              background: "var(--p-color-bg-surface-secondary, #f6f6f7)",
              borderRadius: "12px",
              display: "grid",
              gridTemplateColumns: illustration ? "2fr 1fr" : "1fr",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <s-paragraph tone="subdued">{description}</s-paragraph>
              <div style={{ display: "flex", gap: "8px" }}>
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
              </div>
            </div>
            {illustration && (
              <div>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
