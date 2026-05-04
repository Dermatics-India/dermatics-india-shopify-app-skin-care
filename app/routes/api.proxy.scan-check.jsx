import { authenticate } from "../shopify.server";
import { checkScanAvailability } from "../lib/customer.server";

// GET /apps/derma-advisor/scan-check?customerId=<id>
// Returns whether the logged-in customer has daily scans remaining.
// Called by the widget before starting a session to give early feedback.
export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.public.appProxy(request);
    const shopDomain = session?.shop;
    const customerId = new URL(request.url).searchParams.get("customerId");

    const result = await checkScanAvailability({ shopDomain, customerId });
    return Response.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    // Fail open — never block the widget on a check error
    return Response.json({ allowed: true }, { status: 200 });
  }
};
