import { Page, Card } from "@shopify/polaris";
import AppLayout from "../components/AppLayout.jsx";
import { TitleBar } from "@shopify/app-bridge-react";


export default function HomePage() {
  return (
    <Page title="New-Derma App">
      <Card sectioned>
        <p>Welcome to New-Derma App! Your app is working 🎉</p>
      </Card>

      <Card sectioned title="Next Steps">
        <p>Start creating your dashboard, settings, and more!</p>
      </Card>
    </Page>
  );
}
