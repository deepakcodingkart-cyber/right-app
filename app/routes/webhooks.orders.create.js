import { authenticate } from "../shopify.server.js";
import ShopifyOrderController from "../controllers/shopifyOrder/index.js";

// ✅ Main action function (legacy path wired to new MVC flow)
export const action = async ({ request }) => {
  try {
    // Authenticate the webhook request
    const { payload, admin } = await authenticate.webhook(request);
    if (!admin) throw new Error("Admin authentication failed");

    // Delegate to controller which uses services/helpers
    const controller = new ShopifyOrderController();
    await controller.handleOrderWebhook(payload, admin);

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook failed:", err.message);
    // Return 200 to avoid Shopify retries while we log/fix server-side
    return new Response("ok", { status: 200 });
  }
};
