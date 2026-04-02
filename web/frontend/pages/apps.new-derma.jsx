import { Page, Card, Layout, Text, BlockStack } from "@shopify/polaris";

export default function AppHome() {
  return (
    <Page title="AI Skincare Advisor">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">
                Your AI Skincare App is Installed 🎉
              </Text>
              <Text>
                The floating AI widget is now active on your storefront.  
                You can customize its settings in the Theme Editor → App Embeds.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
