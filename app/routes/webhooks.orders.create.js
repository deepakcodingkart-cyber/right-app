import { authenticate } from "../shopify.server.js";
import ShopifyOrderController from "../controllers/shopifyOrder/index.js";
import { isDuplicateWebhook } from "../helpers/duplicateWebhook.js";

// ✅ Main action function (legacy path wired to new MVC flow)
export const action = async ({ request }) => {
  try {
    
    // Check for duplicate webhooks using the event ID
    const eventId = request.headers.get("x-shopify-event-id");
    if (isDuplicateWebhook(eventId)) {
      return new Response("ok", { status: 200 });
    }

    // Authenticate the webhook request
    const { payload, admin } = await authenticate.webhook(request);

    // Process the order webhook using the controller
    const controller = new ShopifyOrderController();
    await controller.handleOrderWebhook(payload, admin);

    // Respond with 200 Ok 
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook failed:", err.message);
    return new Response("ok", { status: 200 });
  }
};
