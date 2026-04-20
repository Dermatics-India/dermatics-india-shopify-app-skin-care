import { authenticate } from "../shopify.server";
import { onAppUninstall } from "../lib/auth.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  await onAppUninstall({ shop });

  return new Response();
};
