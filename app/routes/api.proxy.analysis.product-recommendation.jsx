import { authenticate } from "../shopify.server";
import { recordProductRecommendation } from "../lib/customer.server";

// POST /apps/derma-advisor/analysis/product-recommendation
// Called by the widget when the product recommendation response is received.
// Consumes 0.5 plan quota and increments the customer's completed scan count.
export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return Response.json(
      { success: false, message: "Method not allowed" },
      { status: 405 },
    );
  }

  try {
    const { session } = await authenticate.public.appProxy(request);
    const shopDomain = session?.shop;
    const payload = await request.json().catch(() => ({}));

    const result = await recordProductRecommendation({ shopDomain, payload });
    return Response.json(result.body, {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return Response.json(
      { success: false, message: error?.message || "Server error" },
      { status: 500 },
    );
  }
};
