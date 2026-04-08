import crypto from "crypto";

export const verifyAppProxySignature = (req, res, next) => {
    try {
      const { signature, ...rest } = req.query || {};
      if (!signature) {
        return res.status(401).json({ success: false, message: "Missing proxy signature" });
      }
  
      const secret = process.env.SHOPIFY_API_SECRET;
      if (!secret) {
        return res.status(500).json({ success: false, message: "Server proxy secret missing" });
      }
  
      const sortedPairs = Object.keys(rest)
        .sort()
        .flatMap((key) => {
          const value = rest[key];
          if (Array.isArray(value)) {
            return value.map((v) => `${key}=${v}`);
          }
          return [`${key}=${value}`];
        });
  
      const message = sortedPairs.join("");
      const digest = crypto.createHmac("sha256", secret).update(message).digest("hex");
  
      const valid =
        digest.length === String(signature).length &&
        crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(String(signature)));
  
      if (!valid) {
        return res.status(401).json({ success: false, message: "Invalid proxy signature" });
      }
  
      return next();
    } catch (error) {
      return res.status(500).json({ success: false, message: "Proxy validation failed" });
    }
  };