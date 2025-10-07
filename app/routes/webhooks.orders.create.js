import { authenticate } from "../shopify.server.js";
import { handleOrderWebhook } from "../controllers/shopifyOrder/index.js";
import { isDuplicateWebhook } from "../helpers/duplicateWebhook.js";

export const action = async ({ request }) => {
  try {
    // Check for duplicate webhooks using the event ID
    const eventId = request.headers.get("x-shopify-event-id");
    if (isDuplicateWebhook(eventId)) {
      return new Response("ok", { status: 200 });
    }

    // Authenticate the webhook request
    const { payload, admin } = await authenticate.webhook(request);

    // Call the controller function
    await handleOrderWebhook(payload, admin);

    // Respond with 200 Ok 
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook failed:", err.message);
    return new Response("ok", { status: 200 });
  }
};
