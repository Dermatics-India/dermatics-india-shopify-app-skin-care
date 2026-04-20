import { authenticate } from "../shopify.server";
import { getWidgetSettings } from "../lib/proxy.server";

// Storefront request via Shopify App Proxy. authenticate.public.appProxy
// verifies the HMAC signature for us and returns the merchant shop domain.
export const loader = async ({ request }) => {
  try {
    const { session, liquid } = await authenticate.public.appProxy(request);
    void liquid; // unused helper; kept to document the shape of the return

    const url = new URL(request.url);
    const shopDomain = session?.shop || url.searchParams.get("shop");

    const result = await getWidgetSettings({ shopDomain });
    return Response.json(result.body, {
      status: result.status,
      headers: {
        // App proxy responses are public storefront JSON.
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    return Response.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
};
