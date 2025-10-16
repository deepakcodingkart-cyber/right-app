// app/routes/api.products.js
import { fetchCustomersFromAPI } from "../utils/fetchCustomer.js";

export async function loader({ request }) {
  try {
    const shop = process.env.SHOP_NAME;
    const accessToken = "shpua_196fbc0bed343fe225e65d2416b4a2b8"; // In production, get this from session
    const customers = await fetchCustomersFromAPI(shop, accessToken);
    return ({ customers });
  } catch (error) {
    console.error("Error in customers API:", error);
    return ({ error: error.message });
  }
}   