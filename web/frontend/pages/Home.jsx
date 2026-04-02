import { Page, Card, Button } from "@shopify/polaris";

export default function Home({ sessionToken }) {

  async function callBackendAPI() {
    try {
      const response = await fetch("/api/products/list", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      const data = await response.json();
      console.log("🔥 API Response:", data);

      alert("Check console—API call successful!");
    } catch (error) {
      console.error("❌ API Error:", error);
    }
  }

  return (
    <Page title="Dashboard">
      <Card sectioned>
        <Button primary onClick={callBackendAPI}>
          Call API (Fetch Products)
        </Button>
      </Card>
      
    </Page>
  );
}
