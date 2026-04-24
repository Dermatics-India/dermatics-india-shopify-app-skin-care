import prisma from "../db.server";

function normalizeShopifyCustomerId(value) {
  if (value == null) return null;
  if (typeof value === "string" && value.startsWith("gid://")) {
    const tail = value.split("/").pop();
    return tail || null;
  }
  return String(value);
}

async function requireShop(shopDomain) {
  if (!shopDomain) {
    return { error: { status: 400, body: { success: false, message: "Shop domain is required" } } };
  }
  const shop = await prisma.shop.findUnique({
    where: { shop: String(shopDomain).toLowerCase().trim() },
  });
  if (!shop) {
    return { error: { status: 404, body: { success: false, message: "Shop not found" } } };
  }
  return { shop };
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
