import {
  Page,
  Card,
  Text,
  TextField,
  Button,
  Layout,
  Select,
  Checkbox,
  Box,
} from "@shopify/polaris";
import { useState } from "react";

export default function SettingsPage() {
  const [appEnabled, setAppEnabled] = useState(true);
  const [placement, setPlacement] = useState("right_bottom");
  const [apiKey, setApiKey] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");

  return (
    <Page title="Settings" subtitle="Configure your AI App behavior">
      <Layout>

        {/* APP ENABLE */}
        <Layout.Section>
          <Card title="App Status" sectioned>
            <Checkbox
              label="Enable App"
              checked={appEnabled}
              onChange={(value) => setAppEnabled(value)}
            />
            <Text>
              {appEnabled ? "App is Enabled" : "App is Disabled"}
            </Text>
          </Card>
        </Layout.Section>

        {/* WIDGET OPTIONS */}
        <Layout.Section>
          <Card title="Floating Widget Settings" sectioned>
            <Select
              label="Widget Position"
              options={[
                { label: "Right Bottom (Default)", value: "right_bottom" },
                { label: "Left Bottom", value: "left_bottom" },
                { label: "Right Center", value: "right_center" },
                { label: "Custom Placement (CSS Selector)", value: "custom" },
              ]}
              value={placement}
              onChange={setPlacement}
            />

            {placement === "custom" && (
              <TextField
                label="Custom CSS Selector"
                placeholder="#my-custom-button"
              />
            )}
          </Card>
        </Layout.Section>

        {/* API SETTINGS */}
        <Layout.Section>
          <Card title="API Configuration" sectioned>
            <TextField
              label="API Key"
              value={apiKey}
              onChange={setApiKey}
              placeholder="Enter AI API key"
            />

            <TextField
              label="AI API Endpoint"
              value={apiEndpoint}
              onChange={setApiEndpoint}
              placeholder="https://your-backend.com/analyze"
            />
          </Card>
        </Layout.Section>

        {/* SAVE BUTTONS */}
        <Layout.Section>
          <Card sectioned>
            <Box display="flex" gap="300">
              <Button primary>Save Settings</Button>
              <Button destructive>Reset</Button>
            </Box>
          </Card>
        </Layout.Section>

      </Layout>
    </Page>
  );
}
