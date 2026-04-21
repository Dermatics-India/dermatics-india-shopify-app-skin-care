import { authenticate } from "../shopify.server";
import { onAppSubscriptionUpdate } from "../lib/billing.server";

export const action = async ({ request }) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  await onAppSubscriptionUpdate({ shop, payload });

  return new Response();
};
