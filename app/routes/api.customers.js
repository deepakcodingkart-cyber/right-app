// app/routes/api.products.js
import { fetchCustomersFromAPI } from "../utils/fetchCustomer.js";
import { getAccessToken } from "../utils/getAccessToken";

export async function loader({ request }) {
  try {
    const shop = process.env.SHOP_NAME;
    const accessToken = await getAccessToken();
    const customers = await fetchCustomersFromAPI(shop, accessToken);
    return ({ customers });
  } catch (error) {
    console.error("Error in customers API:", error);
    return ({ error: error.message });
  }
}   