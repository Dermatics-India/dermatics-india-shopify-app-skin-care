
import Shop from "../models/Shop.js";

export const checkShop = async (req, res, next) => {
    
    const session = res.locals.shopify?.session;
  
    if (!session) {
      return res.status(401).json({ success: false, message: "Unauthorized: No Session" });
    }
  
    try {
      const shopRecord = await Shop.findOne({ shop: session.shop });
      if (!shopRecord) {
        return res.status(404).json({ success: false, message: "Shop not found" });
      }
  
      res.locals.shopRecord = shopRecord;
      next();
    } catch (error) {
      console.error("4. Middleware Database Error:", error);
      next(error); 
    }
  };