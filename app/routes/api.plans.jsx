import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import { getPlans } from "../lib/billing.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const shopRecord = await loadShopRecord(session);
    const payload = await getPlans({ shopRecord });
    return Response.json(payload);
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error fetching plans:", error);
    return Response.json(
      { success: false, message: "Failed to fetch plans" },
      { status: 500 },
    );
  }
};
