import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import prisma from "../db.server";
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

  const orders = await prisma.orders.findMany({
    where: { shopId: shop.id, customerId: customer.id },
    orderBy: { placedAt: "desc" },
    take: 50,
  });

  // Activity timeline is deferred — still render analyses + orders as events.
  const analyses = await prisma.aiSession.findMany({
    where: { shopId: shop.id, customerId: customer.id },
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

export default function CustomerDetail() {
  const { customer } = useLoaderData();
  const { t } = useTranslation();

  const fulfillmentTone = (status) => {
    if (status === "Fulfilled") return "success";
    if (status === "Partial") return "warning";
    if (status === "Unfulfilled") return "attention";
    return undefined;
  };

  return (
    <s-page heading={customer.name} inlineSize="large">
      <s-link slot="breadcrumb-actions" href="/app/customers">
        {t("cmn.back")}
      </s-link>

      <s-grid gridTemplateColumns="repeat(12, 1fr)" gap="base">
        <s-grid-item gridColumn="span 8" gridRow="span 1">
          <s-section>
            <s-stack direction="block" gap="base">
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-heading>Orders</s-heading>
                <s-text tone="subdued">
                  Last {customer.orders.length > 0 ? customer.orders.length : "0"}
                </s-text>
              </s-stack>
              <s-table>
                <s-table-header-row>
                  <s-table-header>Order ID</s-table-header>
                  <s-table-header>Date</s-table-header>
                  <s-table-header>Fulfillment</s-table-header>
                  <s-table-header>Total</s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {customer.orders.map((o) => (
                    <s-table-row key={o.id}>
                      <s-table-cell>
                        <s-text fontWeight="medium">{o.id}</s-text>
                      </s-table-cell>
                      <s-table-cell>
                        <s-text>{formatDate(o.date)}</s-text>
                      </s-table-cell>
                      <s-table-cell>
                        <s-badge tone={fulfillmentTone(o.fulfillmentStatus)}>
                          {o.fulfillmentStatus}
                        </s-badge>
                      </s-table-cell>
                      <s-table-cell>
                        <s-text>{formatCurrency(o.total, o.currency)}</s-text>
                      </s-table-cell>
                    </s-table-row>
                  ))}
                </s-table-body>
              </s-table>
              {customer.orders.length === 0 && (
                <s-box padding="base">
                  <s-text tone="subdued">No orders yet.</s-text>
                </s-box>
              )}
            </s-stack>
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
