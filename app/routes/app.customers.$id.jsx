import { useLoaderData, useSearchParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import prisma from "../db.server";
import { DataTable, DateRangePicker, EmptyState } from "~/components/common";
import { formatCurrency, formatDateTime, formatDate } from "~/utils";

import customerStyle from "~/styles/customers.css?url";

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const shop = await loadShopRecord(session);

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, shopId: shop.id },
  });
  if (!customer) {
    throw Response.json(
      { success: false, message: "Customer not found" },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const startParam = url.searchParams.get("start");
  const endParam = url.searchParams.get("end");

  // Only apply the date filter when both bounds are present.
  const range =
    startParam && endParam
      ? {
          gte: new Date(`${startParam}T00:00:00`),
          lte: new Date(`${endParam}T23:59:59.999`),
        }
      : undefined;

  const orders = await prisma.orders.findMany({
    where: {
      shopId: shop.id,
      customerId: customer.id,
      ...(range ? { placedAt: range } : {}),
    },
    orderBy: { placedAt: "desc" },
    take: 50,
  });

  // Activity timeline is deferred — still render analyses + orders as events.
  const analyses = await prisma.aiSession.findMany({
    where: {
      shopId: shop.id,
      customerId: customer.id,
      ...(range ? { startedAt: range } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  const timeline = [
    ...analyses.map((a) => ({
      id: `a-${a.id}`,
      type: "analysis",
      title:
        a.status === "completed"
          ? "Skin Analysis Completed"
          : "Skin Analysis Started",
      description: a.flowType ? `Flow: ${a.flowType}` : "",
      timestamp: (a.completedAt || a.startedAt).toISOString(),
    })),
    ...orders.map((o) => ({
      id: `o-${o.id}`,
      type: "order",
      title: `Order ${o.orderNumber || `#${o.shopifyOrderId}`} placed`,
      description: `${o.lineItemCount} item(s)`,
      timestamp: o.placedAt.toISOString(),
    })),
  ].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  return {
    customer: {
      id: customer.id,
      name:
        [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
        customer.email ||
        "Customer",
      email: customer.email || "",
      shopifyCustomerId: customer.shopifyCustomerId,
      currency: customer.currency || "USD",
      orders: orders.map((o) => ({
        id: o.orderNumber || `#${o.shopifyOrderId}`,
        date: o.placedAt.toISOString(),
        fulfillmentStatus:
          o.fulfillmentStatus === "fulfilled"
            ? "Fulfilled"
            : o.fulfillmentStatus === "partial"
              ? "Partial"
              : "Unfulfilled",
        total: o.totalPrice,
        currency: o.currency || customer.currency || "USD",
      })),
      timeline,
    },
  };
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
  const { customer } = useLoaderData();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

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
      header: "Order ID",
      // sortable: true,
      // sortValue: (o) => o.id,
      render: (o) => <s-text fontWeight="medium">{o.id}</s-text>,
    },
    {
      key: "date",
      header: "Date",
      // sortable: true,
      // sortValue: (o) => o.date,
      render: (o) => <s-text>{formatDate(o.date)}</s-text>,
    },
    {
      key: "fulfillmentStatus",
      header: "Fulfillment",
      // sortable: true,
      // sortValue: (o) => o.fulfillmentStatus,
      render: (o) => (
        <s-badge tone={fulfillmentTone(o.fulfillmentStatus)}>
          {o.fulfillmentStatus}
        </s-badge>
      ),
    },
    {
      key: "total",
      header: "Total",
      // sortable: true,
      // sortValue: (o) => o.total,
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
              rows={customer.orders}
              rowKey={(o) => o.id}
              searchableFields={["id"]}
              searchPlaceholder={t("customers.searchPlaceholder")}
              pageSize={10}
              emptyState={
                <EmptyState
                  icon="order"
                  heading={t("orders.empty.heading")}
                  description={t("orders.empty.description")}
                />
              }
            />
          </s-section>
        </s-grid-item>

        <s-grid-item gridColumn="span 4" gridRow="span 2">
          <s-section>
            <s-stack direction="block" gap="base">
              <s-heading>Activity</s-heading>
              <div className="customer-timeline">
                {customer.timeline.length === 0 && (
                  <s-text tone="subdued">No activity yet.</s-text>
                )}
                {customer.timeline.map((ev, i) => (
                  <div className="timeline-entry" key={ev.id}>
                    <div className="timeline-marker">
                      <s-icon
                        type={eventIcon[ev.type] || "clock"}
                        tone={eventTone[ev.type] || "subdued"}
                      />
                      {i < customer.timeline.length - 1 && (
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
            </s-stack>
          </s-section>
        </s-grid-item>
      </s-grid>
    </s-page>
  );
}
