import { useLoaderData, useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import prisma from "../db.server";
import { formatCurrency, formatDate } from "~/utils";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await loadShopRecord(session);

  const rows = await prisma.customer.findMany({
    where: { shopId: shop.id },
    orderBy: { lastAnalysisAt: "desc" },
    take: 200,
  });

  const customers = rows.map((c) => ({
    id: c.id,
    shopifyCustomerId: c.shopifyCustomerId,
    name: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email || "Customer",
    email: c.email || "",
    lastAnalysisDate: c.lastAnalysisAt ? c.lastAnalysisAt.toISOString() : null,
    engagement: c.totalScans,
    orders: c.orderCount,
    lifetimeValue: c.totalSpend,
    currency: c.currency || "USD",
  }));

  return { customers };
};

export default function CustomersIndex() {
  const { t } = useTranslation();
  const { customers } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();

  const shopDomain = shopify?.config?.shop;

  const buildAdminUrl = (shopifyCustomerId) =>
    shopDomain
      ? `https://${shopDomain}/admin/customers/${shopifyCustomerId}`
      : "#";

  return (
    <s-page heading={t("customers.title")}>
      <s-section padding="none">
        <s-table>
          <s-table-header-row>
            <s-table-header>{t("customers.tableColumn.customer")}</s-table-header>
            <s-table-header>{t("customers.tableColumn.lastAnalysis")}</s-table-header>
            <s-table-header>{t("customers.tableColumn.scans")}</s-table-header>
            <s-table-header>{t("customers.tableColumn.orders")}</s-table-header>
            <s-table-header>{t("customers.tableColumn.totalSpend")}</s-table-header>
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
                    {c.email && (
                      <span onClick={(e) => e.stopPropagation()}>
                        <s-link
                          href={buildAdminUrl(c.shopifyCustomerId)}
                          target="_blank"
                        >
                          {c.email}
                        </s-link>
                      </span>
                    )}
                  </s-stack>
                </s-table-cell>
                <s-table-cell>
                  <s-text>{c.lastAnalysisDate ? formatDate(c.lastAnalysisDate) : "—"}</s-text>
                </s-table-cell>
                <s-table-cell>
                  <s-text>{c.engagement}</s-text>
                </s-table-cell>
                <s-table-cell>
                  <s-text>{c.orders}</s-text>
                </s-table-cell>
                <s-table-cell>
                  <s-text>{formatCurrency(c.lifetimeValue, c.currency)}</s-text>
                </s-table-cell>
              </s-table-row>
            ))}
            {customers.length === 0 && (
              <s-table-row>
                <s-table-cell>
                  <s-text tone="subdued">{t("customers.empty") || "No customers yet."}</s-text>
                </s-table-cell>
              </s-table-row>
            )}
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}
