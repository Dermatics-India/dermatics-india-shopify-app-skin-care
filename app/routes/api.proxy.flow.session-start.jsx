import { authenticate } from "../shopify.server";
import { startSession } from "../lib/flow.server";

export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.public.appProxy(request);
    const body = await request.json().catch(() => ({}));
    const shop = body?.shop || session?.shop;

    const payload = await startSession({ shop });
    return Response.json(payload);
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error("Session Start Error:", err);
    return Response.json({ error: true }, { status: 500 });
  }
};
