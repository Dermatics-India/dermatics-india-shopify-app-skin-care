import { 
  Card, 
  BlockStack, 
  InlineStack, 
  Text, 
  Button, 
  Box, 
  Image 
} from "@shopify/polaris";

/**
 * A reusable card for customization categories.
 * @param {Object} props
 * @param {string} props.title - The title of the category.
 * @param {string} props.description - A brief description of what can be customized.
 * @param {string} props.buttonText - The label for the action button.
 * @param {string} props.image - The source URL for the category icon/illustration.
 * @param {Function} props.onAction - The callback function when the button is clicked.
 * @param {boolean} props.disabled - Whether the card actions are disabled.
 */
export function CategoryCard({ title, description, buttonText, image, onAction, disabled }) {
  return (
    <Card padding="500">
      <BlockStack gap="400">
        {image && (
          <Box 
            align="center" 
            style={{ opacity: disabled ? 0.5 : 1, filter: disabled ? 'grayscale(100%)' : 'none' }}
          >
            <Image
              source={image}
              alt={title}
              width="120"
            />
          </Box>
        )}
        <BlockStack gap="200">
          <Text 
            variant="headingMd" 
            as="h3" 
            tone={disabled ? "disabled" : "base"}
          >
            {title}
          </Text>
          <Text 
            as="p" 
            tone={disabled ? "disabled" : "subdued"}
          >
            {description}
          </Text>
        </BlockStack>
        <InlineStack align="end">
          <Button 
            variant="secondary" 
            onClick={onAction} 
            disabled={disabled} // This disables the button click and styling
          >
            {buttonText}
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}