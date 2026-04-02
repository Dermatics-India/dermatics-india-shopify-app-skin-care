import {
  Page,
  Layout,
  Card,
  Button,
  Stack,
  Heading
} from "@shopify/polaris";

export default function SupportPage() {
  return (
    <Page title="Support">

      <Layout>
        <Layout.Section oneThird>
          <Card sectioned>

            <Stack vertical spacing="loose">

              {/* Clean, bigger, properly capitalized heading */}
              <Heading element="h2" style={{ fontSize: "20px", fontWeight: 600 }}>
                Email support
              </Heading>

              <p style={{ fontSize: "14px", color: "#444" }}>
                Contact us anytime using our support email:
              </p>

              <p style={{ fontWeight: "600", fontSize: "15px" }}>
                support@yourapp.com
              </p>

              {/* Center the button and reduce width */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Button 
                  primary
                  onClick={() => window.location.href = "mailto:support@yourapp.com"}
                >
                  Send Email
                </Button>
              </div>

            </Stack>

          </Card>
        </Layout.Section>
      </Layout>

    </Page>
  );
}
