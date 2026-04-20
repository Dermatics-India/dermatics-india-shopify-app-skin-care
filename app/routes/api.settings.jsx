import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import { getSettings, updateSettings } from "../lib/settings.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const shopRecord = await loadShopRecord(session);
    const result = await getSettings({ shopRecord });
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof Response) throw error;
    return Response.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
};

export const action = async ({ request }) => {
  try {
    if (request.method !== "POST") {
      return Response.json(
        { success: false, message: "Method not allowed" },
        { status: 405 },
      );
    }

    const { session } = await authenticate.admin(request);
    const shopRecord = await loadShopRecord(session);
    const payload = await request.json();

    const result = await updateSettings({ shopRecord, payload });
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof Response) throw error;
    return Response.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
};
