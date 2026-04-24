import prisma from "../db.server";

const ATTR_SESSION = "ai_dermatics_session";
const ATTR_CUSTOMER = "ai_dermatics_customer";
const ATTR_AI_SESSION = "ai_dermatics_ai_session";

function readNoteAttributes(list) {
  const out = {};
  if (!Array.isArray(list)) return out;
  for (const entry of list) {
    if (entry && typeof entry.name === "string") {
      out[entry.name] = entry.value;
    }
  }
  return out;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// Processes a Shopify orders/create webhook payload and, if the order was
// placed from an AI-assisted session (note_attributes), records it as an
// `Orders` row and bumps the customer's counters.
export async function onOrderCreate({ shop, payload }) {
  if (!shop || !payload?.id) return { skipped: true, reason: "missing shop or id" };

  const shopRecord = await prisma.shop.findUnique({
    where: { shop: String(shop).toLowerCase().trim() },
  });
  if (!shopRecord) return { skipped: true, reason: "shop not found" };

  const attrs = readNoteAttributes(payload.note_attributes);
  const externalSessionId = attrs[ATTR_SESSION] || null;
  const customerRef = attrs[ATTR_CUSTOMER] || null;

  // Not an AI-attributed order — ignore silently.
  if (!externalSessionId && !customerRef) {
    return { skipped: true, reason: "not attributed" };
  }

  const shopifyCustomerId = payload.customer?.id ? String(payload.customer.id) : null;

  let customer = null;
  if (customerRef) {
    customer = await prisma.customer.findFirst({
      where: { id: customerRef, shopId: shopRecord.id },
    });
  }
  if (!customer && shopifyCustomerId) {
    customer = await prisma.customer.findUnique({
      where: { shopId_shopifyCustomerId: { shopId: shopRecord.id, shopifyCustomerId } },
    });
  }
  if (!customer && shopifyCustomerId) {
    customer = await prisma.customer.create({
      data: {
        shopId: shopRecord.id,
        shopifyCustomerId,
        email: payload.customer?.email ?? null,
        firstName: payload.customer?.first_name ?? null,
        lastName: payload.customer?.last_name ?? null,
      },
    });
  }
  if (!customer) return { skipped: true, reason: "no customer" };

  const shopifyOrderId = String(payload.id);
  const totalPrice = toNumber(payload.current_total_price ?? payload.total_price);
  const currency = payload.currency || payload.presentment_currency || null;
  const lineItemCount = Array.isArray(payload.line_items)
    ? payload.line_items.reduce((sum, li) => sum + toNumber(li.quantity), 0)
    : 0;
  const placedAt = payload.created_at ? new Date(payload.created_at) : new Date();

  // Upsert keeps us idempotent against webhook retries.
  const existing = await prisma.orders.findUnique({
    where: { shopId_shopifyOrderId: { shopId: shopRecord.id, shopifyOrderId } },
  });

  if (existing) {
    await prisma.orders.update({
      where: { id: existing.id },
      data: {
        totalPrice,
        currency,
        lineItemCount,
        fulfillmentStatus: payload.fulfillment_status ?? null,
        financialStatus: payload.financial_status ?? null,
        placedAt,
      },
    });
    return { skipped: true, reason: "duplicate" };
  }

  await prisma.orders.create({
    data: {
      shopId: shopRecord.id,
      customerId: customer.id,
      shopifyOrderId,
      orderNumber: payload.name ?? null,
      externalSessionId,
      totalPrice,
      currency,
      lineItemCount,
      fulfillmentStatus: payload.fulfillment_status ?? null,
      financialStatus: payload.financial_status ?? null,
      placedAt,
    },
  });

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      orderCount: { increment: 1 },
      totalSpend: { increment: totalPrice },
      lastOrderAt: placedAt,
      currency: currency ?? customer.currency,
    },
  });

  return { ok: true };
}
