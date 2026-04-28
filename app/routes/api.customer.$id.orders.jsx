import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import { getCustomerOrders } from "../lib/customer.server";
import { rangeFromSearchParams } from "~/lib/serverHelper";

// GET /api/customer/:id/orders?page=<n>&perPage=<n>&start=<YYYY-MM-DD>&end=<YYYY-MM-DD>
export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const shop = await loadShopRecord(session);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = Math.min(Math.max(Number(searchParams.get("perPage")) || 25, 1), 100);
  const range = rangeFromSearchParams(searchParams);

  const result = await getCustomerOrders({
    shopId: shop.id,
    customerId: params.id,
    page,
    perPage,
    range,
  });

  return Response.json(result);
};
