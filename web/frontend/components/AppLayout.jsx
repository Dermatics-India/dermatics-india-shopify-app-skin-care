import { Page, Layout, Card } from "@shopify/polaris";
import SidebarNav from "./SidebarNav.jsx";

export default function AppLayout({ title, children }) {
  return (
    <Page title={title}>
      <Layout>
        {/* LEFT SIDEBAR */}
        <Layout.Section oneThird>
          <Card>
            <SidebarNav />
          </Card>
        </Layout.Section>

        {/* MAIN CONTENT */}
        <Layout.Section>
          {children}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
