import prisma from "../db.server";
import { rangeFromSearchParams } from "./serverHelper";

// Rolls up the numbers shown on the Analytics dashboard for a given
// (shop, [start, end]) window. All aggregates are computed in a single
// round-trip by kicking off the Prisma queries in parallel.
export async function getAnalyticsMetrics({ shopId, searchParams }) {
  const range = rangeFromSearchParams(searchParams);

  const [
    startedCount,
    completedCount,
    orders,
  ] = await Promise.all([
    prisma.aiSession.count({
      where: {
        shopId,
        ...(range ? { startedAt: range } : {}),
      },
    }),
    prisma.aiSession.count({
      where: {
        shopId,
        status: "completed",
        ...(range ? { completedAt: range } : {}),
      },
    }),
    prisma.orders.findMany({
      where: {
        shopId,
        ...(range ? { placedAt: range } : {}),
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
      start: range?.gte?.toISOString(),
      end: range?.lte?.toISOString(),
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
