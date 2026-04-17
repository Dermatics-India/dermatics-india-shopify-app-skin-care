import {
  InlineStack,
  Text,
  BlockStack,
  Box,
  Icon,
  Button,
  Collapsible,
  Badge,
  InlineGrid,
  Spinner,
} from "@shopify/polaris";
import {
  ChevronDownIcon,
  CheckCircleIcon,
  PlusCircleIcon
} from "@shopify/polaris-icons";
import { useTranslation } from "react-i18next";

function SetupStep({
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
    <Box
      paddingBlockStart="300"
      paddingBlockEnd="300"
      paddingInlineStart="400"
      paddingInlineEnd="400"
    >
      <BlockStack gap="300">
        {/* Step Header Row */}
        <div
          onClick={onToggleExpand}
          style={{ cursor: "pointer" }}
        >
          <InlineStack align="space-between" blockAlign="center" wrap={false}>
            <InlineStack gap="300" blockAlign="center">
              <div style={{
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                {isChecking ? (
                  <Spinner size="small" />
                ) : (
                  <Icon
                    source={isCompleted ? CheckCircleIcon : PlusCircleIcon}
                    tone={isCompleted ? "success" : "subdued"}
                  />
                )}
              </div>
              <BlockStack gap="050">
                <InlineStack gap="200" blockAlign="center">
                  <Text
                    variant="bodyMd"
                    as="span"
                    fontWeight={isExpanded ? "bold" : "medium"}
                    tone={isCompleted ? "subdued" : undefined}
                  >
                    {title}
                  </Text>
                  {isCompleted && (
                    <Badge tone="success">{t("SetupGuide.badges.done")}</Badge>
                  )}
                  {isActive && !isCompleted && (
                    <Badge tone="attention">{t("SetupGuide.badges.actionNeeded")}</Badge>
                  )}
                </InlineStack>
              </BlockStack>
            </InlineStack>
            <Box style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 200ms ease-in-out",
            }}>
              <Icon source={ChevronDownIcon} tone="subdued" />
            </Box>
          </InlineStack>
        </div>

        {/* Expandable Content */}
        <Collapsible
          open={isExpanded}
          id={`setup-step-${stepNumber}`}
          transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
        >
          <Box paddingInlineStart="700">
            <Box
              padding="400"
              background="bg-surface-secondary"
              borderRadius="300"
            >
              <InlineGrid columns={illustration ? ["twoThirds", "oneThird"] : ["oneHalf"]} gap="400" alignItems="center">
                <BlockStack gap="300">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    {description}
                  </Text>
                  <InlineStack gap="200">
                    {buttonText && (
                      <Button
                        variant="primary"
                        onClick={onAction}
                        disabled={isChecking}
                      >
                        {buttonText}
                      </Button>
                    )}
                    {secondaryAction && (
                      <Button
                        onClick={secondaryAction.onAction}
                        loading={secondaryAction.loading}
                        disabled={secondaryAction.disabled}
                      >
                        {secondaryAction.content}
                      </Button>
                    )}
                  </InlineStack>
                </BlockStack>
                {illustration && (
                  <Box>
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
                  </Box>
                )}
              </InlineGrid>
            </Box>
          </Box>
        </Collapsible>
      </BlockStack>
    </Box>
  );
}

export { SetupStep };
