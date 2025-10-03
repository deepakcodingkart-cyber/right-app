import { authenticate } from "../shopify.server.js";
import { queue } from "../queue/index.js";

const processedEvents = new Map();

export const action = async ({ request }) => {
  try {
    if (request.method === "OPTIONS") {
      return new Response("ok", { status: 200 });
    }

    const eventId = request.headers.get("x-shopify-event-id");
    const { shop, payload } = await authenticate.webhook(request);

    // 🔹 Deduplication
    if (processedEvents.has(eventId)) {
      console.log("⚠️ Duplicate webhook ignored:", eventId);
      return new Response("ok", { status: 200 }); // ✅ Shopify ko ok bhejna hi hoga
    }

    processedEvents.set(eventId, Date.now());
    if (processedEvents.size > 1000) {
      processedEvents.clear(); // memory leak se bacha
    }

    // 🔹 Push to queue
    queue.push(
      { payload, shop, eventId },
      (err) => {
        if (err) {
          console.error("❌ Queue push failed:", err);
        } else {
          console.log(`📩 Event queued: ${eventId} from ${shop}`);
        }
      }
    );

    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};
