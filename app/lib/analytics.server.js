import prisma from "../db.server";

function rangeFromSearchParams(searchParams) {
  const end = searchParams.get("end");
  const start = searchParams.get("start");
  const endDate = end ? new Date(`${end}T23:59:59.999`) : new Date();
  const startDate = start
    ? new Date(`${start}T00:00:00`)
    : new Date(endDate.getTime() - 29 * 24 * 60 * 60 * 1000);
  return { startDate, endDate };
}

// Rolls up the numbers shown on the Analytics dashboard for a given
// (shop, [start, end]) window. All aggregates are computed in a single
// round-trip by kicking off the Prisma queries in parallel.
export async function getAnalyticsMetrics({ shopId, searchParams }) {
  const { startDate, endDate } = rangeFromSearchParams(searchParams);

  const [
    startedCount,
    completedCount,
    orders,
  ] = await Promise.all([
    prisma.aiSession.count({
      where: {
        shopId,
        startedAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.aiSession.count({
      where: {
        shopId,
        status: "completed",
        completedAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.orders.findMany({
      where: {
        shopId,
        placedAt: { gte: startDate, lte: endDate },
      },
      select: { totalPrice: true, currency: true },
    }),
  ]);

  const revenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const orderCount = orders.length;
  const aov = orderCount > 0 ? revenue / orderCount : 0;
  const completionRate = startedCount > 0 ? completedCount / startedCount : 0;
  const conversionRate = startedCount > 0 ? orderCount / startedCount : 0;
  const currency = orders.find((o) => o.currency)?.currency || "USD";

  return {
    range: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    totals: {
      totalAnalyses: startedCount,
      completedAnalyses: completedCount,
      completionRate,
      conversionRate,
      revenue,
      orderCount,
      aov,
      currency,
    },
  };
}
