import { Card, EmptyState, Page, Text } from "@shopify/polaris";

export default function NotFound() {
  return (
    <Page title="Page Not Found">
      <Card>
        <EmptyState
          heading="Page not found"
          image="https://cdn.shopify.com/s/files/1/0533/2089/files/empty-state.svg"
        >
          <Text>
            The page you are looking for does not exist or has been moved.
          </Text>
        </EmptyState>
      </Card>
    </Page>
  );
}
