import { authenticate } from "../shopify.server";
import { recordImageUploaded } from "../lib/customer.server";

// POST /apps/derma-advisor/analysis/image-uploaded
// Called by the widget after the external AI image upload succeeds.
// Enforces daily scan limit and consumes 0.5 plan quota.
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

    const result = await recordImageUploaded({ shopDomain, payload });
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
