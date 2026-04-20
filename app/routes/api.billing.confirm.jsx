import { redirect } from "@remix-run/node";
import { confirmBilling } from "../lib/billing.server";

// Top-frame redirect from Shopify after the merchant approves the charge.
// This runs without an embedded iframe session, so it loads the offline
// session lazily via unauthenticated.admin() inside confirmBilling().
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const chargeId = url.searchParams.get("charge_id");
  const planId = url.searchParams.get("planId");

  try {
    const result = await confirmBilling({ shop, chargeId, planId });

    if (result.redirect) {
      return redirect(result.redirect);
    }

    return new Response(result.message || "Failed to confirm billing", {
      status: result.status || 500,
    });
  } catch (error) {
    console.error("Confirm billing error:", error);
    return new Response("Failed to confirm billing", { status: 500 });
  }
};
