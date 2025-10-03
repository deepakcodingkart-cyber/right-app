import { authenticate } from "../shopify.server.js";
import { queue } from "../queue/index.js";

const processedEvents = new Map();

export const action = async ({ request }) => {
  try {
    if (request.method === "OPTIONS") return new Response("ok", { status: 200 });

    const eventId = request.headers.get("x-shopify-event-id");
    const { shop, payload } = await authenticate.webhook(request);

    // Deduplicate
    if (processedEvents.has(eventId)) {
      console.log("⚠️ Duplicate webhook ignored:", eventId);
      return new Response(null, { status: 200 });
    }

    processedEvents.set(eventId, Date.now());
    if (processedEvents.size > 1000) processedEvents.clear();

    // Push task to queue
    queue.push({ payload, shop, eventId });

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};
