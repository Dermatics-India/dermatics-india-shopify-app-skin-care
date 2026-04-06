import { 
  InlineStack, 
  Text, 
  BlockStack, 
  Box, 
  Icon, 
  Button,
  Collapsible,
  Checkbox
} from "@shopify/polaris";
import { 
  ChevronDownIcon,
  CheckCircleIcon,
  PlusCircleIcon
} from "@shopify/polaris-icons";

function SetupStep({ 
  title, 
  description, 
  buttonText, 
  isCompleted, 
  onAction, 
  onToggleComplete,
  isExpanded, 
  onToggleExpand,
  illustration 
}) {
  return (
    <Box 
      paddingBlockStart="400" 
      paddingBlockEnd="400" 
    >
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center" wrap={false}>
          <InlineStack gap="300" blockAlign="center">
            <Icon source={isCompleted ? CheckCircleIcon : PlusCircleIcon} tone= { isCompleted ? "success" : "base" } />
            {/* <Checkbox
              label=""
              checked={isCompleted}
              onChange={onToggleComplete}
            /> */}
            <Box onClick={onToggleExpand} style={{ cursor: 'pointer' }}>
              <Text 
                variant="bodyMd" 
                as="p" 
                fontWeight={isExpanded ? "bold" : "medium"}
                tone={isCompleted ? "subdued" : "default"}
              >
                {title}
              </Text>
            </Box>
          </InlineStack>
          <Box 
            onClick={onToggleExpand}
            style={{ 
              cursor: 'pointer',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
              transition: 'transform 200ms ease-in-out' 
            }}
          >
            <Icon source={ChevronDownIcon} tone="subdued" />
          </Box>
        </InlineStack>

        <Collapsible 
          open={isExpanded} 
          id={`setup-step-${title.replace(/\s+/g, '-').toLowerCase()}`}
        >
          <Box 
            padding="400" 
            background="bg-surface-secondary" 
            borderRadius="200"
          >
            <InlineStack align="space-between" blockAlign="center" wrap={false} gap="400">
              <BlockStack gap="400" flex="1">
                <Text variant="bodyMd" tone="subdued">
                  {description}
                </Text>
                {buttonText && (
                  <InlineStack gap="300">
                    <Button variant="primary" onClick={onAction}>
                      {buttonText}
                    </Button>
                  </InlineStack>
                )}
              </BlockStack>
              {illustration && (
                <Box maxWidth="100px">
                  <img 
                    src={illustration} 
                    alt="" 
                    style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} 
                  />
                </Box>
              )}
            </InlineStack>
          </Box>
        </Collapsible>
      </BlockStack>
    </Box>
  );
}

export { SetupStep };