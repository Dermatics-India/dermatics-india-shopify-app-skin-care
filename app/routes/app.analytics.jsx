import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { DateRangePicker } from "../components/common";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

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
    <s-page heading={t("analytics.title")}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <s-text tone="subdued">{t("analytics.subtitle")}</s-text>
          <DateRangePicker defaultPreset="last30" />
        </div>

        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
          {DUMMY_METRICS.map((metric) => (
            <s-section key={metric.key}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <s-text tone="subdued">{t(`analytics.${metric.key}.title`)}</s-text>
                <span style={{ fontSize: "28px", fontWeight: 700 }}>{metric.value}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span
                    style={{
                      color:
                        metric.trend === "up"
                          ? "var(--p-color-text-success, #007d48)"
                          : "var(--p-color-text-critical, #cc0000)",
                      fontSize: "12px",
                    }}
                  >
                    {metric.trend === "up" ? "\u2191" : "\u2193"}
                  </span>
                  <s-text tone="subdued">{t(`analytics.${metric.key}.change`)}</s-text>
                </div>
              </div>
            </s-section>
          ))}
        </s-grid>
      </div>
    </s-page>
  );
}
