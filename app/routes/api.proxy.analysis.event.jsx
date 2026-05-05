import { authenticate } from "../shopify.server";
import { recordCustomerEvent } from "../lib/customer.server";

// POST /apps/derma-advisor/analysis/event
// Single endpoint for all customer activity events. Payload must include `type`:
//   session_start          → creates the main AI session
//   image_upload           → enforces daily/usage quota, logs event
//   product_recommendation → best-effort quota, logs event
//   analysis_complete      → marks session completed
//   doctor_report_download → logs event only
//   ai_chat_start          → logs event only
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

    const result = await recordCustomerEvent({ shopDomain, payload });
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
