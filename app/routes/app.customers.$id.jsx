import { useLoaderData, useNavigate } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { formatCurrency, formatDateTime, formatDate } from "~/utils";

// styles 
import customerStyle from '~/styles/customers.css?url'

const DUMMY_CUSTOMERS = {
  1001: {
    id: "1001",
    name: "Amelia Watson",
    email: "amelia.watson@example.com",
    primaryConcern: "Acne",
    orders: [
      { id: "#1042", date: "2026-04-18", fulfillmentStatus: "Fulfilled", total: 89.5 },
      { id: "#1031", date: "2026-03-22", fulfillmentStatus: "Fulfilled", total: 124.0 },
      { id: "#1018", date: "2026-02-11", fulfillmentStatus: "Fulfilled", total: 49.0 },
      { id: "#1004", date: "2026-01-08", fulfillmentStatus: "Partial", total: 50.0 },
      { id: "#0987", date: "2025-12-14", fulfillmentStatus: "Fulfilled", total: 76.25 },
    ],
    timeline: [
      {
        id: "t1",
        type: "analysis",
        title: "Skin Analysis Completed",
        description: "Primary concern identified: Acne. Routine recommended.",
        timestamp: "2026-04-18T10:14:00Z",
      },
      {
        id: "t2",
        type: "order",
        title: "Order #1042 placed",
        description: "Purchased Clarify Gel Cleanser and Niacinamide Serum.",
        timestamp: "2026-04-18T10:52:00Z",
      },
      {
        id: "t3",
        type: "email",
        title: "Follow-up email opened",
        description: "30-day skin progress check-in email viewed.",
        timestamp: "2026-04-04T08:30:00Z",
      },
      {
        id: "t4",
        type: "analysis",
        title: "Skin Analysis Completed",
        description: "Improvement in T-zone oiliness detected.",
        timestamp: "2026-03-20T15:02:00Z",
      },
      {
        id: "t5",
        type: "signup",
        title: "Account created",
        description: "Amelia signed up from the storefront widget.",
        timestamp: "2025-12-14T17:41:00Z",
      },
    ],
  },
};

function getCustomer(id) {
  return (
    DUMMY_CUSTOMERS[id] || {
      id,
      name: "Customer",
      email: "unknown@example.com",
      primaryConcern: "—",
      orders: [],
      timeline: [],
    }
  );
}

export const loader = async ({ request, params }) => {
  await authenticate.admin(request);
  return { customer: getCustomer(params.id) };
};

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


export const links = () => [
  { rel: "stylesheet", href: customerStyle },
];

export default function CustomerDetail() {
  const { customer } = useLoaderData();
  const { t } = useTranslation()

  const fulfillmentTone = (status) => {
    if (status === "Fulfilled") return "success";
    if (status === "Partial") return "warning";
    if (status === "Unfulfilled") return "attention";
    return undefined;
  }

  return (
    <s-page
      heading={customer.name}
      inlineSize="large"
    >
      <s-link slot="breadcrumb-actions" href="/app/customers">{t("cmn.back")}</s-link>

      <s-grid
        gridTemplateColumns="repeat(12, 1fr)"
        gap="base"
      >
        <s-grid-item gridColumn="span 8" gridRow="span 1">
          <s-section>
            <s-stack direction="block" gap="base">
              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-heading>Orders</s-heading>
                <s-text tone="subdued">Last {customer?.orders && customer?.orders.length > 0 ? customer?.orders.length : "0"}</s-text>
              </s-stack>
              <s-table >
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
                        <s-text>{formatCurrency(o.total)}</s-text>
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
                      <s-text tone="subdued">{ev.description}</s-text>
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
