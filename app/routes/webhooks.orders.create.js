import { authenticate } from "../shopify.server.js";
// import { handleOrderWebhook } from "../controllers/shopifyOrder/index.js";
import { isDuplicateWebhook } from "../helpers/duplicateWebhook.js";
import { shopifyOrderQueue } from "../queue/shopifyOrderQueue/index.js";
export const action = async ({ request }) => {
  try {
    const eventId = request.headers.get("x-shopify-event-id");
    if (isDuplicateWebhook(eventId)) {
      return new Response("ok", { status: 200 });
    }

    const { payload  } = await authenticate.webhook(request);

    // Add job to BullMQ queue
    await shopifyOrderQueue.add("shopifyOrderJob", { payload });

    // console.log("wait kar rha tha")

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook failed:", err.message);
    return new Response("ok", { status: 200 });
  }
};

