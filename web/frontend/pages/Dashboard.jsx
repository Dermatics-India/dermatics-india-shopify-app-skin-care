import { 
  Page,
  Layout,
  Card,
  Text,
  Button
} from "@shopify/polaris";

export default function Dashboard() {
  return (
    <Page title="Dashboard" subtitle="Manage your AI Skin & Hair App">

      <Layout>

        {/* HERO SECTION */}
        <Layout.Section>
          <Card sectioned>
            <Text variant="headingLg">Hello, Dermatics.in 👋</Text>
            <p style={{ marginTop: "8px" }}>
              Welcome to your AI Skin & Hair App Dashboard.
            </p>

            <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Button primary url="/widgets">Manage Widgets</Button>
              <Button url="/theme-sections">Theme Sections</Button>
              <Button url="/analytics">Analytics</Button>
            </div>
          </Card>
        </Layout.Section>

        {/* QUICK ACTIONS */}
        <Layout.Section>
          <Card title="Quick Actions" sectioned>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Button url="/settings">Settings</Button>
              <Button url="/support">Support</Button>
              <Button url="/pricing">Upgrade</Button>
            </div>
          </Card>
        </Layout.Section>

        {/* WIDGETS PANEL */}
        <Layout.Section>
          <Card title="Your Widgets" sectioned>
            <p>You currently have 0 widgets configured.</p>
            <Button primary url="/widgets" style={{ marginTop: "12px" }}>
              Create Widget
            </Button>
          </Card>
        </Layout.Section>

        {/* PLAN SECTION */}
        <Layout.Section>
          <Card title="Plan & Billing" sectioned>
            <p>Your current plan: Free</p>
            <Button primary url="/pricing" style={{ marginTop: "12px" }}>
              Upgrade Plan
            </Button>
          </Card>
        </Layout.Section>

      </Layout>

    </Page>
  );
}
