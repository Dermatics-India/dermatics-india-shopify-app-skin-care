import { useLoaderData, useSearchParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import { getAnalyticsMetrics } from "../lib/analytics.server";
import { DateRangePicker } from "../components/common";
import { formatCurrency } from "~/utils";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await loadShopRecord(session);

  const url = new URL(request.url);
  const metrics = await getAnalyticsMetrics({
    shopId: shop.id,
    searchParams: url.searchParams,
  });

  return metrics;
};

function toInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

export default function Analytics() {
  const { t } = useTranslation();
  const { totals, range } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();

  const metrics = [
    { key: "totalAnalyses", value: totals.totalAnalyses.toLocaleString() },
    { key: "completionRate", value: formatPercent(totals.completionRate) },
    { key: "conversionRate", value: formatPercent(totals.conversionRate) },
    { key: "revenue", value: formatCurrency(totals.revenue, totals.currency) },
    { key: "aov", value: formatCurrency(totals.aov, totals.currency) },
  ];

  const handleRangeChange = ({ start, end }) => {
    if (!start || !end) return;
    const next = new URLSearchParams(searchParams);
    next.set("start", toInputValue(start));
    next.set("end", toInputValue(end));
    setSearchParams(next, { replace: true });
  };

  const defaultPreset = searchParams.get("start") ? "custom" : "last30";

  return (
    <s-page heading={t("analytics.title")}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <s-text tone="subdued">{t("analytics.subtitle")}</s-text>
          <DateRangePicker
            defaultPreset={defaultPreset}
            onChange={handleRangeChange}
          />
        </div>

        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap="base">
          {metrics.map((metric) => (
            <s-section key={metric.key}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <s-text tone="subdued">{t(`analytics.${metric.key}.title`)}</s-text>
                <span style={{ fontSize: "28px", fontWeight: 700 }}>{metric.value}</span>
                <s-text tone="subdued">
                  {new Date(range.start).toLocaleDateString()} – {new Date(range.end).toLocaleDateString()}
                </s-text>
              </div>
            </s-section>
          ))}
        </s-grid>
      </div>
    </s-page>
  );
}
