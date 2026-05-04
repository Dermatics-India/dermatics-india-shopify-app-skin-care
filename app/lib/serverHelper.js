import prisma from "../db.server";

export function normalizeShopifyCustomerId(value) {
  if (value == null) return null;
  if (typeof value === "string" && value.startsWith("gid://")) {
    const tail = value.split("/").pop();
    return tail || null;
  }
  return String(value);
}

export async function requireShop(shopDomain) {
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

export function rangeFromSearchParams(searchParams) {
  const startParam = searchParams?.get("start");
  const endParam = searchParams?.get("end");

  let gte;
  let lte;

  if (startParam && endParam) {
    gte = new Date(`${startParam}T00:00:00`);
    lte = new Date(`${endParam}T23:59:59.999`);
  } else {
    const end = new Date(); // Right now
    const start = new Date();
    start.setDate(end.getDate() - 29); // Subtract 29 days to get a 30-day window

    gte = new Date(start.setHours(0, 0, 0, 0));
    lte = new Date(end.setHours(23, 59, 59, 999));
  }

  return { gte, lte };
}
