import crypto from "crypto";

// Verifies a Shopify App Proxy HMAC signature against SHOPIFY_API_SECRET.
// Returns true when the query params are signed by Shopify, false otherwise.
export const verifyAppProxySignature = (searchParams) => {
  const signature = searchParams.get("signature");
  if (!signature) return false;

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return false;

  // Collect every non-signature param, sorted; join key=value pairs without delimiter.
  const entries = [];
  for (const [key, value] of searchParams.entries()) {
    if (key === "signature") continue;
    entries.push([key, value]);
  }
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  // URLSearchParams preserves repeated keys; flatten to "key=value" for each.
  const message = entries.map(([k, v]) => `${k}=${v}`).join("");
  const digest = crypto.createHmac("sha256", secret).update(message).digest("hex");

  if (digest.length !== String(signature).length) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(String(signature)),
    );
  } catch {
    return false;
  }
};
