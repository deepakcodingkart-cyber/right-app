// app/routes/api.products.js
import { fetchProductsFromAPI } from "../utils/fetchProduct.js";

export async function loader({ request }) {
  try {
    const shop = process.env.SHOP_NAME;
    const accessToken = "shpua_196fbc0bed343fe225e65d2416b4a2b8"; // In production, get this from session
    const products = await fetchProductsFromAPI(shop, accessToken);
    return ({ products });
  } catch (error) {
    console.error("Error in products API:", error);
    return ({ error: error.message });
  }
}   