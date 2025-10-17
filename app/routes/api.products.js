// app/routes/api.products.js
import { fetchProductsFromAPI } from "../utils/fetchProduct.js";
import { getAccessToken } from "../utils/getAccessToken";

export async function loader({ request }) {
  try {
    const shop = process.env.SHOP_NAME;
    const accessToken = await getAccessToken();
    const products = await fetchProductsFromAPI(shop, accessToken);
    return ({ products });
  } catch (error) {
    console.error("Error in products API:", error);
    return ({ error: error.message });
  } 
}   