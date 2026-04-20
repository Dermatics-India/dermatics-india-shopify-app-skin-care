import { authenticate } from "../shopify.server";
import { uploadImage } from "../lib/flow.server";

export const action = async ({ request }) => {
  try {
    await authenticate.public.appProxy(request);
    const body = await request.json().catch(() => ({}));
    const payload = await uploadImage(body);
    return Response.json(payload);
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error("Flow Upload Error:", err);
    return Response.json({ error: true }, { status: 500 });
  }
};
