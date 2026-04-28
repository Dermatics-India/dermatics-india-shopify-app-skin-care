import prisma from "../db.server";

const DEFAULT_PER_PAGE = 15;

function eventFromAnalysis(a) {
  const analysisType = a?.flowType === 'skin_flow' ? "Skin Analysis" : "Hair Analysis"
  return {
    id: `a-${a?.id}`,
    type: "analysis",
    title:
      a?.status === "completed"
        ? `${analysisType} Completed`
        : `${analysisType} Started`,
    description: a?.flowType ? `Flow: ${a?.flowType}` : "",
    timestamp: (a?.completedAt || a?.startedAt).toISOString(),
  };
}

function eventFromOrder(o) {
  return {
    id: `o-${o?.id}`,
    type: "order",
    title: `Order ${o?.orderNumber || `#${o?.shopifyOrderId}`} placed`,
    description: `${o?.lineItemCount} item(s)`,
    timestamp: o?.placedAt?.toISOString(),
  };
}

/**
 * Page-based activity feed that merges AI sessions and orders into a single
 * chronological timeline.
 *
 * Returns `{ items, pagination }` where pagination is:
 *   { hasNext, hasPrev, totalCount, perPage, currentPage }
 */
export async function getCustomerActivity({
  shopId,
  customerId,
  page = 1,
  perPage = DEFAULT_PER_PAGE,
  range,
}) {
  const baseWhere = (dateField) => ({
    shopId,
    customerId,
    ...(range ? { [dateField]: range } : {}),
  });

  const [analyses, orders, sessionCount, orderCount] = await Promise.all([
    prisma.aiSession.findMany({
      where: baseWhere("startedAt"),
      orderBy: { startedAt: "desc" },
    }),
    prisma.orders.findMany({
      where: baseWhere("placedAt"),
      orderBy: { placedAt: "desc" },
    }),
    prisma.aiSession.count({ where: baseWhere("startedAt") }),
    prisma.orders.count({ where: baseWhere("placedAt") }),
  ]);

  const totalCount = sessionCount + orderCount;

  const merged = [
    ...analyses.map(eventFromAnalysis),
    ...orders.map(eventFromOrder),
  ].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  const currentPage = Math.max(1, page);
  const start = (currentPage - 1) * perPage;
  const items = merged.slice(start, start + perPage);

  return {
    items,
    pagination: {
      hasNext: start + perPage < totalCount,
      hasPrev: currentPage > 1,
      totalCount,
      perPage,
      currentPage,
    },
  };
}
