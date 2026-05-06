import prisma from "../db.server";
import { getCustomerActivity } from "./activity.server";
import { normalizeShopifyCustomerId, requireShop, rangeFromSearchParams } from "./serverHelper";
import { getPlanForShop, consumeUsage } from "./planHelper.server";
import { DAILY_SCAN_LIMIT, USAGE_PER_SCAN, SCAN_WINDOW_MS, EVENT_TYPES } from "~/constant";

// Shared read helper — single source of truth for daily scan state.
// Returns the current count, whether the window is still active,
// and the exact ISO timestamp when the limit resets.
function getScanStatus(customer) {
  const now = new Date();
  const resetAt = customer?.dailyScanResetAt ? new Date(customer.dailyScanResetAt) : null;
  const isActive = !!resetAt && now < resetAt;
  const countToday = isActive ? (customer.dailyScanCount || 0) : 0;
  // Require capacity for a full scan (image + product rec = 2 × USAGE_PER_SCAN).
  // This prevents starting a session when only 0.5 remains — not enough to complete.
  const FULL_SCAN_COST = 2 * USAGE_PER_SCAN;
  const allowed = countToday + FULL_SCAN_COST <= DAILY_SCAN_LIMIT;

  return {
    countToday,
    isActive,
    allowed,
    nextAvailableAt: !allowed && resetAt ? resetAt.toISOString() : null,
  };
}

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
  const hasExplicitRange = searchParams?.get("start") && searchParams?.get("end");
  const range = hasExplicitRange ? rangeFromSearchParams(searchParams) : null;

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

export async function checkScanAvailability({ shopDomain, shopifyCustomerId }) {
  const { shop, error } = await requireShop(shopDomain);
  if (error) return { allowed: true };

  const normalizedId = normalizeShopifyCustomerId(shopifyCustomerId);
  const customer = normalizedId
    ? await prisma.customer.findFirst({ where: { shopifyCustomerId: normalizedId, shopId: shop.id } })
    : null;

  const { countToday, allowed, nextAvailableAt } = getScanStatus(customer);

  return {
    allowed,
    scansUsed: countToday,
    scansLimit: DAILY_SCAN_LIMIT,
    nextAvailableAt,
  };
}

// Shared: compute Prisma update fields for daily scan tracking.
// Extends the window if still active, starts a new 24-hour window otherwise.
function getDailyScanUpdate(customer) {
  const { countToday, isActive, nextAvailableAt } = getScanStatus(customer);
  return {
    countToday,
    nextAvailableAt,
    fields: {
      dailyScanCount: isActive ? { increment: USAGE_PER_SCAN } : USAGE_PER_SCAN,
      dailyScanResetAt: isActive
        ? customer.dailyScanResetAt
        : new Date(Date.now() + SCAN_WINDOW_MS),
    },
  };
}

// Shared: look up an AI session by internal id or external id.
async function findSession(shopId, { aiSessionId, externalSessionId }) {
  if (aiSessionId) {
    return prisma.aiSession.findFirst({ where: { id: aiSessionId, shopId } });
  }
  return prisma.aiSession.findFirst({
    where: { shopId, externalSessionId, status: "started" },
    orderBy: { startedAt: "desc" },
  });
}

// Shared: consume USAGE_PER_SCAN quota then update the customer record.
// `customerData` is the Prisma update payload for Customer (field increments etc.).
// `strict` = true  → blocks on quota denial and returns a 429 result object.
// `strict` = false → best-effort, never blocks (fire-and-forget quota).
async function consumeAndUpdateCustomer(shop, customerId, customerData, strict = true) {
  const plan = await getPlanForShop(shop);
  const usageResult = await consumeUsage(shop, plan, USAGE_PER_SCAN).catch(() => ({ allowed: true }));

  if (strict && !usageResult.allowed) {
    return {
      denied: true,
      result: {
        status: 429,
        body: {
          success: false,
          code: "USAGE_LIMIT_REACHED",
          message: usageResult.reason,
          usage: usageResult.status,
        },
      },
    };
  }

  await prisma.customer.update({ where: { id: customerId }, data: customerData });
  return { denied: false };
}

// Unified customer event recorder — single endpoint for all activity types.
// Stores each event as an AiSession row (flowType = event type) so the
// activity feed has one unified data source.
// Valid types defined in ~/constant: EVENT_TYPES
export async function recordCustomerEvent({ shopDomain, payload }) {
  const { shop, error } = await requireShop(shopDomain);
  if (error) return error;

  const { type, customerId, aiSessionId, externalSessionId, flowType } = payload || {};

  if (!Object.values(EVENT_TYPES).includes(type)) {
    return {
      status: 400,
      body: { success: false, message: `type must be one of: ${Object.values(EVENT_TYPES).join(", ")}` },
    };
  }

  // Resolve the main analysis session (needed for analysis_complete and to find the customer).
  let mainSession = null;
  if (aiSessionId || externalSessionId) {
    mainSession = await findSession(shop.id, { aiSessionId, externalSessionId });
  }

  // Resolve customer from payload or from the session.
  const resolvedCustomerId = customerId || mainSession?.customerId;
  if (!resolvedCustomerId) {
    return { status: 400, body: { success: false, message: "customerId or valid session required" } };
  }
  const customer = await prisma.customer.findFirst({
    where: { id: resolvedCustomerId, shopId: shop.id },
  });
  if (!customer) {
    return { status: 404, body: { success: false, message: "Customer not found" } };
  }

  const responseData = {};
  const now = new Date();

  switch (type) {
    case EVENT_TYPES.SESSION_START: {
      const newSession = await prisma.aiSession.create({
        data: {
          shopId: shop.id,
          customerId: customer.id,
          externalSessionId: externalSessionId || null,
          flowType: flowType || null,
          status: "started",
          startedAt: now,
        },
      });
      mainSession = newSession;
      responseData.aiSessionId = newSession.id;
      break;
    }

    case EVENT_TYPES.IMAGE_UPLOAD: {
      const { fields: dailyFields } = getDailyScanUpdate(customer);
      const { denied, result } = await consumeAndUpdateCustomer(shop, customer.id, {
        totalScans: { increment: USAGE_PER_SCAN },
        lastAnalysisAt: now,
        ...dailyFields,
      });
      if (denied) return result;
      await prisma.aiSession.create({
        data: {
          shopId: shop.id,
          customerId: customer.id,
          flowType: EVENT_TYPES.IMAGE_UPLOAD,
          status: "completed",
          startedAt: now,
          completedAt: now,
        },
      });
      break;
    }

    case EVENT_TYPES.PRODUCT_RECOMMENDATION: {
      const { fields: dailyFields } = getDailyScanUpdate(customer);
      await consumeAndUpdateCustomer(
        shop,
        customer.id,
        { totalScans: { increment: USAGE_PER_SCAN }, lastAnalysisAt: now, ...dailyFields },
        false,
      );
      await prisma.aiSession.create({
        data: {
          shopId: shop.id,
          customerId: customer.id,
          flowType: EVENT_TYPES.PRODUCT_RECOMMENDATION,
          status: "completed",
          startedAt: now,
          completedAt: now,
        },
      });
      break;
    }

    case EVENT_TYPES.ANALYSIS_COMPLETE: {
      if (!mainSession) {
        return { status: 404, body: { success: false, message: "Session not found" } };
      }
      if (mainSession.status === "completed") {
        responseData.alreadyCompleted = true;
        break;
      }
      await prisma.aiSession.update({
        where: { id: mainSession.id },
        data: { status: "completed", completedAt: now },
      });
      break;
    }

    case EVENT_TYPES.DOCTOR_REPORT_DOWNLOAD:
    case EVENT_TYPES.AI_CHAT_START: {
      await prisma.aiSession.create({
        data: {
          shopId: shop.id,
          customerId: customer.id,
          flowType: type,
          status: "completed",
          startedAt: now,
          completedAt: now,
        },
      });
      break;
    }
  }

  return {
    status: 200,
    body: { success: true, data: { aiSessionId: mainSession?.id || null, ...responseData } },
  };
}

