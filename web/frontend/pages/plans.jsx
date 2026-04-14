import React, { useEffect, useState } from 'react'
import {
  Card,
  Page,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Button,
  Collapsible,
  Divider,
  Layout,
  SkeletonBodyText
} from "@shopify/polaris";

import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';

const plans = () => {
  const { t } = useTranslation()
  const api = useApi()
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  console.log("plans:::", plans)

  useEffect(() => {
    // Fetch plans from the new API
    api.get("/api/plans")
      .then(res => {
        if (res.success) setPlans(res.plans);
      })
      .catch(() => {

      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <Page title="Plans">
        <Layout>
          {[1, 2, 3, 4].map(i => (
            <Layout.Section oneFourth key={i}>
              <Card sectioned><SkeletonBodyText lines={5} /></Card>
            </Layout.Section>
          ))}
        </Layout>
      </Page>
    );
  }

  return (
    <Page 
      fullWidth={false}
    >
      <BlockStack gap="400">
      <BlockStack 
        gap="200" 
        inlineAlign='center'
      >
        <Text variant='headingLg'>{ t("plans.title") }</Text>
        <Text variant='bodyLg'>{ t("plans.description") }</Text>

      </BlockStack>
      </BlockStack>

      <Layout>
        {plans.map((plan) => (
          <Layout.Section oneFourth key={plan.id}>
            <LegacyCard sectioned>
              <BlockStack gap="400">
                <Text variant="headingLg" as="h2">{plan.id}</Text>
                
                <Text variant="heading2xl" as="p">
                  ${plan.price}
                  <Text variant="bodySm" as="span" tone="subdued">/mo</Text>
                </Text>

                <List>
                  {plan.features.map((feature, i) => (
                    <List.Item key={i}>{feature}</List.Item>
                  ))}
                </List>

                <Button 
                  primary={plan.id === "Combo"} // Re-apply highlight logic here
                  disabled={plan.current}
                  onClick={() => handleUpgrade(plan.id)}
                  fullWidth
                >
                  {plan.current ? "Current Plan" : "Select"}
                </Button>
              </BlockStack>
            </LegacyCard>
          </Layout.Section>
        ))}
      </Layout>
    </Page>
    
  )
}

export default plans