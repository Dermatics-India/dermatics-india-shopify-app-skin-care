import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import { getAppEmbedStatus } from "../lib/appEmbed.server";

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const shopRecord = await loadShopRecord(session);

    const result = await getAppEmbedStatus({ admin, shopRecord });
    const status = result.success ? 200 : 404;
    return Response.json(result, { status });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Error checking app embed status:", error?.message);
    return Response.json(
      { success: false, isEnabled: false, error: error?.message },
      { status: 500 },
    );
  }
};
