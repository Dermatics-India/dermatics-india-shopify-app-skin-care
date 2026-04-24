import { authenticate } from "../shopify.server";
import { onOrderCreate } from "../lib/orders.server";

export const action = async ({ request }) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    await onOrderCreate({ shop, payload });
  } catch (error) {
    console.error("orders/create handler failed", error);
  }

  return new Response();
};
