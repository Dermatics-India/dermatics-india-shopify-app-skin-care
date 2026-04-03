import shopify from "../shopify.js";
import productCreator from "../utils/product-creator.js";

/**
 * Gets the total product count for the current shop.
 * API: GET /api/products/count
 */
export const getProductCount = async (req, res) => {
  try {
    const countData = await shopify.api.rest.Product.count({
      session: res.locals.shopify.session,
    });
    res.status(200).send(countData);
  } catch (error) {
    console.error(`❌ Error fetching product count: ${error.message}`);
    res.status(500).send({ error: error.message });
  }
};

/**
 * Creates sample products in the shop.
 * API: POST /api/products
 */
export const createProducts = async (req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`❌ Failed to create products: ${e.message}`);
    status = 500;
    error = e.message;
  }

  res.status(status).send({ success: status === 200, error });
};
