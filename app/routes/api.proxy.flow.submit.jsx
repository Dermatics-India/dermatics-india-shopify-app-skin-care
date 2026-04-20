import { authenticate } from "../shopify.server";
import { submitFlow } from "../lib/flow.server";

export const action = async ({ request }) => {
  try {
    await authenticate.public.appProxy(request);
    const body = await request.json().catch(() => ({}));
    const payload = await submitFlow(body);
    return Response.json(payload);
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error("Submit Error:", err);
    return Response.json({ error: true }, { status: 500 });
  }
};
