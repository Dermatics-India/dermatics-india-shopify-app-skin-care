import prisma from "../db.server";

// Loads the Shop record tied to the current authenticated Shopify session.
// Throws a JSON Response if the shop record is missing so callers can let
// Remix surface the correct status code.
export const loadShopRecord = async (session) => {
  if (!session?.shop) {
    throw Response.json(
      { success: false, message: "Unauthorized: No Session" },
      { status: 401 },
    );
  }

  const shopRecord = await prisma.shop.findUnique({
    where: { shop: session.shop },
  });

  if (!shopRecord) {
    throw Response.json(
      { success: false, message: "Shop not found" },
      { status: 404 },
    );
  }

  return shopRecord;
};
