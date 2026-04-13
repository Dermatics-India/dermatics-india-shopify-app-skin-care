
import Shop from "../models/Shop.js";

export const checkShop = async (req, res, next) => {
    console.log("1. Middleware reached");
    
    const session = res.locals.shopify?.session;
    console.log("2. Session found:", session?.shop);
  
    if (!session) {
      console.error("ERROR: No Shopify session found in res.locals");
      return res.status(401).json({ success: false, message: "Unauthorized: No Session" });
    }
  
    try {
      const shopRecord = await Shop.findOne({ shop: session.shop });
      if (!shopRecord) {
        console.error("ERROR: Shop not in DB:", session.shop);
        return res.status(404).json({ success: false, message: "Shop not found" });
      }
  
      res.locals.shopRecord = shopRecord;
      console.log("3. shopRecord attached successfully");
      next();
    } catch (error) {
      console.error("4. Middleware Database Error:", error);
      next(error); 
    }
  };