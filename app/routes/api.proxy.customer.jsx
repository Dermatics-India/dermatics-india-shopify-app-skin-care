import { authenticate } from "../shopify.server";
import { upsertCustomer } from "../lib/customer.server";

// POST /apps/derma-advisor/customer
// Upserts a Customer row for the (shop, shopifyCustomerId) pair.
// Called by the storefront extension once per session start.
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

    const result = await upsertCustomer({ shopDomain, payload });
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
