import React, { useEffect, useState } from 'react'
import {
  Card,
  Page,
  Text,
  BlockStack,
  Button,
  List,
  Grid,
  SkeletonBodyText,
  Toast,
  Frame,
  Badge,
  Banner,
  ProgressBar,
  InlineStack,
} from "@shopify/polaris";

import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { ENDPOINTS } from '../utils/endpoints';

const Plans = () => {
  const { t } = useTranslation()
  const api = useApi()
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [trial, setTrial] = useState(null);
  const [usage, setUsage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPlanId, setPendingPlanId] = useState(null);
  const [toast, setToast] = useState({ active: false, message: "", error: false });

  const loadPlans = () => {
    setIsLoading(true);
    api.get(ENDPOINTS.GET_PLANS)
      .then(res => {
        if (res.success) {
          setPlans(res.plans);
          setCurrentPlan(res.currentPlan);
          setTrial(res.trial);
          setUsage(res.usage);
        }
      })
      .catch(() => {
        setToast({ active: true, message: "Failed to load plans", error: true });
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleUpgrade = async (planId) => {
    setPendingPlanId(planId);
    try {
      const res = await api.post(ENDPOINTS.SUBSCRIPTOIN, { planId });
      if (!res?.success) {
        setToast({ active: true, message: res?.message || "Upgrade failed", error: true });
        return;
      }
      if (res.downgraded) {
        setToast({ active: true, message: res.message || "Plan updated", error: false });
        loadPlans();
        return;
      }
      if (res.url) {
        // Break out of the embedded iframe — Shopify billing page must load at top frame.
        if (window.top) {
          window.top.location.href = res.url;
        } else {
          window.location.href = res.url;
        }
      }
    } catch (err) {
      const message = err?.message || err?.errors?.[0]?.message || "Upgrade failed";
      setToast({ active: true, message, error: true });
    } finally {
      setPendingPlanId(null);
    }
  };

  if (isLoading) {
    return (
      <Page title="Plans">
        <Grid>
          {[1, 2, 3, 4].map((i) => (
            <Grid.Cell
              key={`plan-skeleton-${i}`}
              columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}
            >
              <Card sectioned><SkeletonBodyText lines={5} /></Card>
            </Grid.Cell>
          ))}
        </Grid>
      </Page>
    );
  }

  const usageProgress =
    usage && !usage.unlimited && usage.limit > 0
      ? Math.min(100, Math.round((usage.count / usage.limit) * 100))
      : 0;

  return (
    <Frame>
      <Page fullWidth={false}>
        <BlockStack gap="400">
          <BlockStack gap="200" inlineAlign='center'>
            <Text variant='headingLg'>{t("plans.title")}</Text>
            <Text variant='bodyLg'>{t("plans.description")}</Text>
          </BlockStack>

          {trial?.inTrial && (
            <Banner tone="info" title={`Free trial: ${trial.daysRemaining} day${trial.daysRemaining === 1 ? "" : "s"} remaining`}>
              <p>You won't be charged until your trial ends on {new Date(trial.endsAt).toLocaleDateString()}.</p>
            </Banner>
          )}

          {currentPlan && usage && (
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingMd" as="h3">Current plan: {currentPlan.name}</Text>
                  {currentPlan.isUnlimited ? (
                    <Badge tone="success">Unlimited</Badge>
                  ) : (
                    <Badge>{`${usage.count} / ${usage.limit} scans used`}</Badge>
                  )}
                </InlineStack>
                {!currentPlan.isUnlimited && (
                  <>
                    <ProgressBar progress={usageProgress} size="small" />
                    <Text variant="bodySm" tone="subdued">
                      Resets {new Date(usage.periodEndsAt).toLocaleDateString()}
                    </Text>
                  </>
                )}
              </BlockStack>
            </Card>
          )}

          <Grid>
            {plans.map((plan) => (
              <Grid.Cell
                key={plan.id}
                columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3 }}
              >
                <Card sectioned>
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text variant="headingLg" as="h2">{plan.name}</Text>
                      {plan.current && <Badge tone="success">Current</Badge>}
                    </InlineStack>

                    <Text variant="heading2xl" as="p">
                      ${plan.price}
                      <Text variant="bodySm" as="span" tone="subdued">/mo</Text>
                    </Text>

                    {plan.trialDays > 0 && !trial?.used && !plan.current && (
                      <Badge tone="attention">{`${plan.trialDays}-day free trial`}</Badge>
                    )}

                    <List>
                      {plan.features.map((feature, i) => (
                        <List.Item key={i}>{feature}</List.Item>
                      ))}
                    </List>

                    <Button
                      variant={"primary"}
                      disabled={plan.current || pendingPlanId !== null}
                      loading={pendingPlanId === plan.id}
                      onClick={() => handleUpgrade(plan.id)}
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

        {toast.active && (
          <Toast
            content={toast.message}
            error={toast.error}
            onDismiss={() => setToast({ ...toast, active: false })}
          />
        )}
      </Page>
    </Frame>
  )
}

export default Plans
