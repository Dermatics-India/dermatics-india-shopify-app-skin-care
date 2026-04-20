import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import { createPlanSubscription } from "../lib/billing.server";

export const action = async ({ request }) => {
  try {
    if (request.method !== "POST") {
      return Response.json(
        { success: false, message: "Method not allowed" },
        { status: 405 },
      );
    }

    const { admin, session } = await authenticate.admin(request);
    const shopRecord = await loadShopRecord(session);
    const body = await request.json();

    const result = await createPlanSubscription({
      admin,
      shopRecord,
      planId: body?.planId,
    });

    return Response.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof Response) throw error;
    if (error?.response?.body?.errors) {
      console.error(
        "GraphQL Errors:",
        JSON.stringify(error.response.body.errors, null, 2),
      );
    } else {
      console.error("Billing Integration Error:", error);
    }
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
};
