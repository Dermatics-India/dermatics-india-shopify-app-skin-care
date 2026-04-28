import { useLoaderData, useNavigate, useNavigation, useSearchParams } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import { getCustomerList } from "../lib/customer.server";

// Components
import { DataTable, EmptyState, DateRangePicker } from "~/components/common";

// Utils
import { formatCurrency, formatDate } from "~/utils";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = await loadShopRecord(session);
  const url = new URL(request.url);
  return getCustomerList({ shopId: shop.id, searchParams: url.searchParams });
};

function toInputValue(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function CustomersIndex() {
  const { t } = useTranslation();
  const { customers } = useLoaderData();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const shopify = useAppBridge();
  const [searchParams, setSearchParams] = useSearchParams();

  const isLoading = navigation.state === "loading";

  const shopDomain = shopify?.config?.shop;
  const buildAdminUrl = (shopifyCustomerId) =>
    shopDomain ? `https://${shopDomain}/admin/customers/${shopifyCustomerId}` : "#";

  const handleRangeChange = ({ start, end }) => {
    if (!start || !end) return;
    const next = new URLSearchParams(searchParams);
    next.set("start", toInputValue(start));
    next.set("end", toInputValue(end));
    setSearchParams(next, { replace: true });
  };

  const defaultPreset = searchParams.get("start") ? "custom" : "last30";

  const columns = [
    {
      key: "name",
      header: t("customers.tableColumn.customer"),
      render: (c) => (
        <s-stack direction="block" gap="none">
          <s-text fontWeight="medium">{c.name}</s-text>
          {c.email && (
            <span onClick={(e) => e.stopPropagation()}>
              <s-link href={buildAdminUrl(c.shopifyCustomerId)} target="_blank">
                {c.email}
              </s-link>
            </span>
          )}
        </s-stack>
      ),
    },
    {
      key: "lastAnalysisDate",
      header: t("customers.tableColumn.lastAnalysis"),
      render: (c) => <s-text>{c.lastAnalysisDate ? formatDate(c.lastAnalysisDate) : "—"}</s-text>,
    },
    {
      key: "engagement",
      header: t("customers.tableColumn.scans"),
      render: (c) => <s-text>{c.engagement}</s-text>,
    },
    {
      key: "orders",
      header: t("customers.tableColumn.orders"),
      render: (c) => <s-text>{c.orders}</s-text>,
    },
    {
      key: "lifetimeValue",
      header: t("customers.tableColumn.totalSpend"),
      render: (c) => <s-text>{formatCurrency(c.lifetimeValue, c.currency)}</s-text>,
    },
  ];

  return (
    <s-page heading={t("customers.title")}>
      <s-stack
        direction="inline"
        justifyContent="space-between"
        alignItems="center"
        gap="large-100"
        paddingBlock="base"
      >
        <s-box>
          <s-heading accessibilityRole="presentation" accessibilityVisibility="hidden">
            {t('customers.title')}
          </s-heading>
        </s-box>
        <s-box>
          <DateRangePicker
            defaultPreset={defaultPreset}
            onChange={handleRangeChange}
          />
        </s-box>
      </s-stack>

      <s-section padding="none">
        <DataTable
          columns={columns}
          rows={customers}
          rowKey={(c) => c.id}
          loading={isLoading}
          onRowClick={(c) => navigate(`/app/customers/${c.id}`)}
          pageSize={20}
          searchableFields={["name", "email"]}
          searchPlaceholder={t("customers.searchPlaceholder")}
          searchLabel={t("customers.searchLabel")}
          emptyState={
            <EmptyState
              icon="person"
              heading={t("customers.empty.heading")}
              description={t("customers.empty.description")}
            />
          }
        />
      </s-section>
    </s-page>
  );
}
