import { authenticate } from "../shopify.server.js";
import { handleOrderWebhook } from "../controllers/shopifyOrder/index.js";
import { isDuplicateWebhook } from "../helpers/duplicateWebhook.js";
export const action = async ({ request }) => {
  try {
    const eventId = request.headers.get("x-shopify-event-id");
    if (isDuplicateWebhook(eventId)) {
      return new Response("ok", { status: 200 });
    }

    const { payload, admin } = await authenticate.webhook(request);

    // Capture the result
    await handleOrderWebhook(payload, admin);

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook failed:", err.message);
    return new Response("ok", { status: 200 });
  }
};

