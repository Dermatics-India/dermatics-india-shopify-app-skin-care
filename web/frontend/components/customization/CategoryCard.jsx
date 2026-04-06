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
 */
export function CategoryCard({ title, description, buttonText, image, onAction }) {
  return (
    <Card padding="500">
      <BlockStack gap="400">
        {image && (
          <Box align="center">
            <Image
              source={image}
              alt={title}
              width="120"
            />
          </Box>
        )}
        <BlockStack gap="200">
          <Text variant="headingMd" as="h3">
            {title}
          </Text>
          <Text as="p" tone="subdued">
            {description}
          </Text>
        </BlockStack>
        <InlineStack align="end">
          <Button variant="primary" onClick={onAction}>
            {buttonText}
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
