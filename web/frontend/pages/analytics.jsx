import React from "react";
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Grid,
  Box,
} from "@shopify/polaris";
import { useTranslation } from "react-i18next";
import { DateRangePicker } from "../components/common";

const DUMMY_METRICS = [
  { key: "totalAnalyses", value: "1,248", trend: "up" },
  { key: "completionRate", value: "74.3%", trend: "up" },
  { key: "avgDuration", value: "1m 42s", trend: "up" },
  { key: "conversionRate", value: "12.6%", trend: "up" },
  { key: "revenue", value: "$8,430", trend: "up" },
  { key: "aov", value: "$67.50", trend: "up" },
];

export default function Analytics() {
  const { t } = useTranslation();

  return (
    <Page title={t("analytics.title")}>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text variant="bodyMd" as="p" tone="subdued">
            {t("analytics.subtitle")}
          </Text>
          <DateRangePicker defaultPreset="last30" />
        </InlineStack>

        <Grid>
          {DUMMY_METRICS.map((metric) => (
            <Grid.Cell
              key={metric.key}
              columnSpan={{ xs: 6, sm: 3, md: 2, lg: 4 }}
            >
              <Card>
                <BlockStack gap="200">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    {t(`analytics.${metric.key}.title`)}
                  </Text>
                  <Text variant="headingXl" as="p">
                    {metric.value}
                  </Text>
                  <InlineStack gap="100" blockAlign="center">
                    <Box>
                      <span
                        style={{
                          color:
                            metric.trend === "up"
                              ? "var(--p-color-text-success)"
                              : "var(--p-color-text-critical)",
                          fontSize: "12px",
                        }}
                      >
                        {metric.trend === "up" ? "\u2191" : "\u2193"}
                      </span>
                    </Box>
                    <Text variant="bodySm" as="span" tone="subdued">
                      {t(`analytics.${metric.key}.change`)}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Grid.Cell>
          ))}
        </Grid>
      </BlockStack>
    </Page>
  );
}
