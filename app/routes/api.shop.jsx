import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import { getShopPayload } from "../lib/shop.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const shopRecord = await loadShopRecord(session);
    return Response.json(getShopPayload(shopRecord));
  } catch (error) {
    if (error instanceof Response) throw error;
    return Response.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
};
