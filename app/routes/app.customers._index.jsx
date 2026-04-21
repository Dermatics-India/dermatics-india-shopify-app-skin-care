import { useLoaderData, useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";

const DUMMY_CUSTOMERS = [
  {
    id: "1001",
    shopifyCustomerId: "8866728673469",
    name: "Sanjay",
    email: "sanjaydermatics@gmail.com",
    lastAnalysisDate: "2026-04-18",
    primaryConcern: "Acne",
    engagement: 12,
    orders: 4,
    lifetimeValue: 312.5,
  },
  {
    id: "1002",
    shopifyCustomerId: "8123456790",
    name: "Noah Carter",
    email: "noah.carter@example.com",
    lastAnalysisDate: "2026-04-15",
    primaryConcern: "Dryness",
    engagement: 7,
    orders: 2,
    lifetimeValue: 149.0,
  },
  {
    id: "1003",
    shopifyCustomerId: "8123456791",
    name: "Sophia Patel",
    email: "sophia.patel@example.com",
    lastAnalysisDate: "2026-04-11",
    primaryConcern: "Pigmentation",
    engagement: 21,
    orders: 6,
    lifetimeValue: 584.25,
  },
  {
    id: "1004",
    shopifyCustomerId: "8123456792",
    name: "Liam Chen",
    email: "liam.chen@example.com",
    lastAnalysisDate: "2026-04-02",
    primaryConcern: "Sensitivity",
    engagement: 3,
    orders: 1,
    lifetimeValue: 58.0,
  },
  {
    id: "1005",
    shopifyCustomerId: "8123456793",
    name: "Isabella Novak",
    email: "isabella.novak@example.com",
    lastAnalysisDate: "2026-03-28",
    primaryConcern: "Anti-aging",
    engagement: 15,
    orders: 5,
    lifetimeValue: 472.8,
  },
];

const concernTone = {
  Acne: "critical",
  Dryness: "info",
  Pigmentation: "magic",
  Sensitivity: "warning",
  "Anti-aging": "success",
};

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return { customers: DUMMY_CUSTOMERS };
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function CustomersIndex() {
  const { t } = useTranslation()
  const { customers } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();

  const shopDomain = shopify?.config?.shop;

  const buildAdminUrl = (shopifyCustomerId) =>
    shopDomain
      ? `https://${shopDomain}/admin/customers/${shopifyCustomerId}`
      : "#";

  return (
    <s-page heading={ t('customers.title')}>
      <s-section padding="none">
        <s-table >
          <s-table-header-row>
            <s-table-header>{t('customers.tableColumn.customer')}</s-table-header>
            <s-table-header>{t('customers.tableColumn.lastAnalysis')}</s-table-header>
            <s-table-header>{t('customers.tableColumn.primaryConcern')}</s-table-header>
            <s-table-header>{t('customers.tableColumn.scans')}</s-table-header>
            <s-table-header>{t('customers.tableColumn.orders')}</s-table-header>
            <s-table-header>{t('customers.tableColumn.totalSpend')}</s-table-header>
          </s-table-header-row>
          <s-table-body>
            {customers.map((c) => (
              <s-table-row
                key={c.id}
                onClick={() => navigate(`/app/customers/${c.id}`)}
                style={{ cursor: "pointer" }}
              >
                <s-table-cell>
                  <s-stack direction="block" gap="none">
                    <s-text fontWeight="medium">{c.name}</s-text>
                    <span onClick={(e) => e.stopPropagation()}>
                    <s-link
                      href={buildAdminUrl(c.shopifyCustomerId)}
                      target="_blank"
                    >
                      {c.email} 
                    </s-link>
                    </span>
                  </s-stack>
                </s-table-cell>
                <s-table-cell>
                  <s-text>{formatDate(c.lastAnalysisDate)}</s-text>
                </s-table-cell>
                <s-table-cell>
                  <s-badge tone={concernTone[c.primaryConcern] || undefined}>
                    {c.primaryConcern}
                  </s-badge>
                </s-table-cell>
                <s-table-cell>
                  <s-text>{c.engagement}</s-text>
                </s-table-cell>
                <s-table-cell>
                  <s-text>{c.orders}</s-text>
                </s-table-cell>
                <s-table-cell>
                  <s-text>{formatCurrency(c.lifetimeValue)}</s-text>
                </s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}
