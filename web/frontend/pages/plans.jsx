import React, { useEffect, useState } from 'react'
import {
  Card,
  Page,
  Text,
  BlockStack,
  Button,
  Layout,
  List,
  Grid,
  SkeletonBodyText
} from "@shopify/polaris";

import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { ENDPOINTS } from '../utils/endpoints';

const plans = () => {
  const { t } = useTranslation()
  const api = useApi()
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  console.log("plans:::", plans)

  useEffect(() => {
    // Fetch plans from the new API
    api.get(ENDPOINTS.GET_PLANS)
      .then(res => {
        if (res.success) setPlans(res.plans);
      })
      .catch(() => {

      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleUpgrade = (planId) => {
    // console.log("pland id:::", planId)
    const payload = { planId: planId }
    api.post(ENDPOINTS.SUBSCRIPTOIN, payload)
    .then((res) => {
      console.log("res:::", res)

      // redirect.dispatch(Redirect.Action.REMOTE, data.url);
    })
    .catch((err) => {
      console.log("err:::", err)
    })
  }

  if (isLoading) {
    return (
      <Page title="Plans">
        <Grid>
          {[1, 2, 3, 4].map((i) => (
            <Grid.Cell
              key={`plan-skeleton-${i}`}
              columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }} // Adjusts width across breakpoints
            >
              <Card sectioned><SkeletonBodyText lines={5} /></Card>
            </Grid.Cell>
          ))}
        </Grid>
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
          <Text variant='headingLg'>{t("plans.title")}</Text>
          <Text variant='bodyLg'>{t("plans.description")}</Text>
        </BlockStack>

        <Grid>
          {plans.map((plan) => (
            <Grid.Cell
              key={plan._id}
              columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }} // Adjusts width across breakpoints
            >
              <Card sectioned>
                <BlockStack gap="400">
                  <Text variant="headingLg" as="h2">{plan.name}</Text>

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
                    variant={"primary"}
                    disabled={plan.current}
                    onClick={() => handleUpgrade(plan.planId)}
                    fullWidth
                  >
                    {plan.current ? t('plans.currentPlan') : t('plans.upgrade')}
                  </Button>
                </BlockStack>
              </Card>
            </Grid.Cell>
          ))}
        </Grid>
      </BlockStack>
    </Page>

  )
}

export default plans