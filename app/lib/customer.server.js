import prisma from "../db.server";
import { getCustomerActivity } from "./activity.server";

import { normalizeShopifyCustomerId, requireShop, rangeFromSearchParams } from "./serverHelper";

const DETAIL_ORDERS_PAGE_SIZE = 10;
const DETAIL_ACTIVITY_PAGE_SIZE = 15;

function fulfillmentLabel(status) {
  if (status === "fulfilled") return "Fulfilled";
  if (status === "partial") return "Partial";
  return "Unfulfilled";
}

function formatCustomer(customer) {
  return {
    id: customer.id,
    name:
      [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
      customer.email ||
      "Customer",
    email: customer.email || "",
    shopifyCustomerId: customer.shopifyCustomerId,
    currency: customer.currency || "USD",
  };
}

function formatOrder(order, customerCurrency) {
  return {
    id: order.orderNumber || `#${order.shopifyOrderId}`,
    date: order.placedAt.toISOString(),
    fulfillmentStatus: fulfillmentLabel(order.fulfillmentStatus),
    total: order.totalPrice,
    currency: order.currency || customerCurrency || "USD",
  };
}

/**
 * Cursor-based orders feed for a single customer. The cursor is the ISO
 * timestamp of the last order returned; subsequent calls fetch orders
 * strictly older than the cursor. Mirrors the shape of `getCustomerActivity`.
 */
export async function getCustomerOrders({
  shopId,
  customerId,
  range,
  page = 1,
  perPage = 25,
  defaultCurrency,
}) {
  let currency = defaultCurrency;
  if (!currency) {
    const c = await prisma.customer.findFirst({
      where: { id: customerId, shopId },
      select: { currency: true },
    });
    currency = c?.currency || "USD";
  }

  const where = {
    shopId,
    customerId,
    ...(range ? { placedAt: range } : {}),
  };

  const currentPage = Math.max(1, page);
  const skip = (currentPage - 1) * perPage;

  const [rows, totalCount] = await Promise.all([
    prisma.orders.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip,
      take: perPage,
    }),
    prisma.orders.count({ where }),
  ]);

  const items = rows.map((o) => formatOrder(o, currency));

  return {
    items,
    pagination: {
      hasNext: skip + perPage < totalCount,
      hasPrev: currentPage > 1,
      totalCount,
      perPage,
      currentPage,
    },
  };
}

export async function getCustomerList({ shopId, searchParams }) {
  const range = rangeFromSearchParams(searchParams);

  const rows = await prisma.customer.findMany({
    where: {
      shopId,
      ...(range ? { lastAnalysisAt: range } : {}),
    },
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
}

/**
 * Loads everything the customer detail page needs in one shot:
 *  - The customer record (404 → throws a Response).
 *  - The first orders page, optionally filtered by date range.
 *  - The first activity page (orders + analyses merged, cursor-based).
 *
 * Throws a Response.json 404 when the customer is not found so loaders can
 * just `return await getCustomerDetail(...)` and let Remix surface the
 * status code.
 */
export async function getCustomerDetail({ shopId, customerId, searchParams }) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, shopId },
  });
  if (!customer) {
    throw Response.json(
      { success: false, message: "Customer not found" },
      { status: 404 },
    );
  }

  const range = rangeFromSearchParams(searchParams);

  const [orders, activity] = await Promise.all([
    getCustomerOrders({
      shopId,
      customerId: customer.id,
      range,
      perPage: DETAIL_ORDERS_PAGE_SIZE,
      defaultCurrency: customer.currency || "USD",
    }),
    getCustomerActivity({
      shopId,
      customerId: customer.id,
      perPage: DETAIL_ACTIVITY_PAGE_SIZE,
      range,
    }),
  ]);

  return {
    customer: {
      ...formatCustomer(customer),
      orders: orders.items,
    },
    ordersPagination: orders.pagination,
    activity: {
      items: activity.items,
      pagination: activity.pagination,
    },
  };
}

export async function upsertCustomer({ shopDomain, payload }) {
  const { shop, error } = await requireShop(shopDomain);
  if (error) return error;

  const shopifyCustomerId = normalizeShopifyCustomerId(payload?.shopifyCustomerId);
  if (!shopifyCustomerId) {
    return { status: 400, body: { success: false, message: "shopifyCustomerId is required" } };
  }

  const data = {
    email: payload.email ?? null,
    firstName: payload.firstName ?? null,
    lastName: payload.lastName ?? null,
  };

  const customer = await prisma.customer.upsert({
    where: { shopId_shopifyCustomerId: { shopId: shop.id, shopifyCustomerId } },
    update: data,
    create: {
      shopId: shop.id,
      shopifyCustomerId,
      ...data,
    },
  });

  return {
    status: 200,
    body: { success: true, data: { customerId: customer.id } },
  };
}

export async function recordAnalysisStart({ shopDomain, payload }) {
  const { shop, error } = await requireShop(shopDomain);
  if (error) return error;

  const { customerId, externalSessionId, flowType } = payload || {};
  if (!customerId) {
    return { status: 400, body: { success: false, message: "customerId is required" } };
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, shopId: shop.id },
  });
  if (!customer) {
    return { status: 404, body: { success: false, message: "Customer not found" } };
  }

  const now = new Date();
  const session = await prisma.aiSession.create({
    data: {
      shopId: shop.id,
      customerId: customer.id,
      externalSessionId: externalSessionId || null,
      flowType: flowType || null,
      status: "started",
      startedAt: now,
    },
  });

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      totalScans: { increment: 1 },
      lastAnalysisAt: now,
    },
  });

  return {
    status: 200,
    body: { success: true, data: { sessionId: session.id } },
  };
}

export async function recordAnalysisComplete({ shopDomain, payload }) {
  const { shop, error } = await requireShop(shopDomain);
  if (error) return error;

  const { externalSessionId, sessionId } = payload || {};
  if (!externalSessionId && !sessionId) {
    return { status: 400, body: { success: false, message: "sessionId or externalSessionId is required" } };
  }

  const existing = sessionId
    ? await prisma.aiSession.findFirst({ where: { id: sessionId, shopId: shop.id } })
    : await prisma.aiSession.findFirst({
        where: { shopId: shop.id, externalSessionId, status: "started" },
        orderBy: { startedAt: "desc" },
      });

  if (!existing) {
    return { status: 404, body: { success: false, message: "Analysis session not found" } };
  }
  if (existing.status === "completed") {
    return { status: 200, body: { success: true, data: { sessionId: existing.id, alreadyCompleted: true } } };
  }

  await prisma.aiSession.update({
    where: { id: existing.id },
    data: { status: "completed", completedAt: new Date() },
  });

  await prisma.customer.update({
    where: { id: existing.customerId },
    data: { completedScans: { increment: 1 } },
  });

  return {
    status: 200,
    body: { success: true, data: { sessionId: existing.id } },
  };
}
