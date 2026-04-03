import { Card, InlineStack, Text, BlockStack, Box, Icon, Button } from "@shopify/polaris";
import { CheckCircleIcon } from "@shopify/polaris-icons";


function SetupStep({ number, title, description, buttonText, icon, isCompleted, onAction }) {
  return (
    <Card padding="400">
      <InlineStack gap="400" blockAlign="start" wrap={false}>
        <Box
          background={isCompleted ? "bg-fill-success-secondary" : "bg-fill-info-secondary"}
          padding="200"
          borderRadius="200"
        >
          <Icon source={icon} tone={isCompleted ? "success" : "info"} />
        </Box>
        
        <BlockStack gap="200" flex="1">
          <InlineStack align="space-between">
            <Text as="h3" variant="headingMd" fontWeight={isCompleted ? "medium" : "bold"}>
              {number}. {title}
            </Text>
            {isCompleted && (
              <InlineStack gap="100" blockAlign="center">
                <Icon source={CheckCircleIcon} tone="success" />
                <Text as="span" variant="bodySm" tone="success">Done</Text>
              </InlineStack>
            )}
          </InlineStack>
          
          <Text as="p" variant="bodyMd" tone="subdued">
            {description}
          </Text>
          
          {!isCompleted && (
            <Box paddingBlockStart="200">
              <InlineStack gap="200">
                <Button variant="primary" onClick={onAction}>
                  {buttonText}
                </Button>
              </InlineStack>
            </Box>
          )}
        </BlockStack>
      </InlineStack>
    </Card>
  );
}

export { SetupStep };