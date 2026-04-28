import { useEffect, useRef, useState } from "react";
import {
  useFetcher,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { useTranslation } from "react-i18next";

// servers 
import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import { getCustomerDetail } from "../lib/customer.server";

// components 
import { DataTable, DateRangePicker, EmptyState } from "~/components/common";

// utils 
import { formatCurrency, formatDateTime, formatDate } from "~/utils";

// css 
import customerStyle from "~/styles/customers.css?url";

const ACTIVITY_PER_PAGE = 15;

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const shop = await loadShopRecord(session);

  const url = new URL(request.url);
  return getCustomerDetail({
    shopId: shop.id,
    customerId: params.id,
    searchParams: url.searchParams,
  });
};

export const links = () => [
  { rel: "stylesheet", href: customerStyle },
];

const eventIcon = {
  analysis: "view",
  order: "orders",
  email: "email",
  signup: "person",
};

const eventTone = {
  analysis: "magic",
  order: "success",
  email: "info",
  signup: "subdued",
};

function toInputValue(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function CustomerDetail() {
  const {
    customer,
    ordersPagination: initialOrdersPagination,
    activity: initialActivity,
  } = useLoaderData();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isReloadingPage = navigation.state === "loading";

  // ── Orders state ─────────────────────────────────────────────────────────
  const [ordersItems, setOrdersItems] = useState(customer.orders);
  const [ordersPagination, setOrdersPagination] = useState(initialOrdersPagination);
  const lastOrdersRef = useRef(initialOrdersPagination);

  useEffect(() => {
    if (lastOrdersRef.current !== initialOrdersPagination) {
      lastOrdersRef.current = initialOrdersPagination;
      setOrdersItems(customer.orders);
      setOrdersPagination(initialOrdersPagination);
    }
  }, [initialOrdersPagination, customer.orders]);

  // ── Activity state ────────────────────────────────────────────────────────
  const [activityItems, setActivityItems] = useState(initialActivity.items);
  const [activityPagination, setActivityPagination] = useState(initialActivity.pagination);
  const lastActivityRef = useRef(initialActivity);

  useEffect(() => {
    if (lastActivityRef.current !== initialActivity) {
      lastActivityRef.current = initialActivity;
      setActivityItems(initialActivity.items);
      setActivityPagination(initialActivity.pagination);
    }
  }, [initialActivity]);

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const ordersFetcher = useFetcher({ key: "customer-orders" });
  const activityFetcher = useFetcher({ key: "customer-activity" });

  // Independent loading flags — each section shows its own spinner.
  const isLoadingOrders = ordersFetcher.state !== "idle" || isReloadingPage;
  const isLoadingActivity = activityFetcher.state !== "idle" || isReloadingPage;

  useEffect(() => {
    if (!ordersFetcher.data) return;
    setOrdersItems(ordersFetcher.data.items);
    setOrdersPagination(ordersFetcher.data.pagination);
  }, [ordersFetcher.data]);

  useEffect(() => {
    if (!activityFetcher.data) return;
    setActivityItems((prev) => [...prev, ...activityFetcher.data.items]);
    setActivityPagination(activityFetcher.data.pagination);
  }, [activityFetcher.data]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOrdersPageChange = (page) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("perPage", String(ordersPagination.perPage));
    if (searchParams.get("start")) params.set("start", searchParams.get("start"));
    if (searchParams.get("end")) params.set("end", searchParams.get("end"));
    ordersFetcher.load(`/api/customer/${customer.id}/orders?${params.toString()}`);
  };

  const handleLoadMoreActivity = () => {
    if (!activityPagination?.hasNext || activityFetcher.state !== "idle") return;
    const nextPage = (activityPagination.currentPage ?? 1) + 1;
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    params.set("perPage", String(ACTIVITY_PER_PAGE));
    if (searchParams.get("start")) params.set("start", searchParams.get("start"));
    if (searchParams.get("end")) params.set("end", searchParams.get("end"));
    activityFetcher.load(`/api/customer/${customer.id}/activity?${params.toString()}`);
  };

  const handleRangeChange = ({ start, end }) => {
    if (!start || !end) return;
    const next = new URLSearchParams(searchParams);
    next.set("start", toInputValue(start));
    next.set("end", toInputValue(end));
    setSearchParams(next, { replace: true });
  };

  const defaultPreset = searchParams.get("start") ? "custom" : "last30";

  const fulfillmentTone = (status) => {
    if (status === "Fulfilled") return "success";
    if (status === "Partial") return "warning";
    if (status === "Unfulfilled") return "attention";
    return undefined;
  };

  const orderColumns = [
    {
      key: "id",
      header: t("customers.detail.orderColumns.id"),
      render: (o) => <s-text fontWeight="medium">{o.id}</s-text>,
    },
    {
      key: "date",
      header: t("customers.detail.orderColumns.date"),
      render: (o) => <s-text>{formatDate(o.date)}</s-text>,
    },
    {
      key: "fulfillmentStatus",
      header: t("customers.detail.orderColumns.fulfillment"),
      render: (o) => (
        <s-badge tone={fulfillmentTone(o.fulfillmentStatus)}>
          {o.fulfillmentStatus}
        </s-badge>
      ),
    },
    {
      key: "total",
      header: t("customers.detail.orderColumns.total"),
      render: (o) => <s-text>{formatCurrency(o.total, o.currency)}</s-text>,
    },
  ];

  return (
    <s-page heading={customer.name} inlineSize="large">
      <s-link slot="breadcrumb-actions" href="/app/customers">
        {t("cmn.back")}
      </s-link>

      <s-stack
        direction="inline"
        justifyContent="end"
        alignItems="center"
        paddingBlock="small"
      >
        <DateRangePicker
          defaultPreset={defaultPreset}
          onChange={handleRangeChange}
        />
      </s-stack>

      <s-grid gridTemplateColumns="repeat(12, 1fr)" gap="base">
        <s-grid-item gridColumn="span 8" gridRow="span 1">
          <s-section padding="none">
            <DataTable
              columns={orderColumns}
              rows={ordersItems}
              rowKey={(o) => o.id}
              loading={isLoadingOrders}
              searchableFields={["id"]}
              searchPlaceholder={t("customers.detail.orders.searchPlaceholder")}
              pageSize={ordersPagination.perPage}
              pageSizeOptions={[ordersPagination.perPage]}
              page={ordersPagination.currentPage}
              totalCount={ordersPagination.totalCount}
              onPageChange={handleOrdersPageChange}
              emptyState={
                <EmptyState
                  icon="order"
                  heading={t("customers.detail.orders.empty.heading")}
                  description={t("customers.detail.orders.empty.description")}
                />
              }
            />
          </s-section>
        </s-grid-item>

        <s-grid-item gridColumn="span 4" gridRow="span 2">
          <s-section>
            <s-stack direction="block" gap="base">
              <s-stack
                direction="inline"
                justifyContent="space-between"
                alignItems="center"
                gap="small-200"
              >
                <s-heading>{t("customers.detail.activity.heading")}</s-heading>
                {activityPagination?.totalCount > 0 && (
                  <s-text tone="subdued">
                    {t("customers.detail.activity.count", {
                      loaded: activityItems.length,
                      total: activityPagination.totalCount,
                    })}
                  </s-text>
                )}
              </s-stack>

              {isLoadingActivity ? (
                <s-stack
                  direction="block"
                  alignItems="center"
                  justifyContent="center"
                  padding="large-200"
                >
                  <s-spinner accessibilityLabel={t("cmn.loading")} />
                </s-stack>
              ) : activityItems.length === 0 ? (
                <s-text tone="subdued">
                  {t("customers.detail.activity.empty")}
                </s-text>
              ) : (
                <div className="customer-timeline-scroll">
                  <div className="customer-timeline">
                    {activityItems.map((ev, i) => (
                      <div className="timeline-entry" key={ev.id}>
                        <div className="timeline-marker">
                          <s-icon
                            type={eventIcon[ev.type] || "clock"}
                            tone={eventTone[ev.type] || "subdued"}
                          />
                          {i < activityItems.length - 1 && (
                            <span className="timeline-line" />
                          )}
                        </div>
                        <div className="timeline-content">
                          <s-text tone="subdued">{formatDateTime(ev.timestamp)}</s-text>
                          <s-text fontWeight="medium">{ev.title}</s-text>
                          {ev.description && (
                            <s-text tone="subdued">{ev.description}</s-text>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isLoadingActivity && activityPagination?.hasNext && (
                <s-stack direction="inline" justifyContent="center">
                  <s-button
                    onClick={handleLoadMoreActivity}
                    disabled={isLoadingActivity}
                    loading={isLoadingActivity}
                  >
                    {isLoadingActivity
                      ? t("customers.detail.activity.loading")
                      : t("customers.detail.activity.loadMore")}
                  </s-button>
                </s-stack>
              )}
            </s-stack>
          </s-section>
        </s-grid-item>
      </s-grid>
    </s-page>
  );
}
