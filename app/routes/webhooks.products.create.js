import { authenticate } from "../shopify.server.js";
import { Resend } from "resend";
import BetterQueue from "better-queue";

const resend = new Resend(process.env.RESEND_API_KEY);

// --- Map to track processed events ---
const processedEvents = new Map();

// --- Array to hold current batch ---
let batch = [];

// --- Queue: handles batching logic ---
const queue = new BetterQueue(async (task, cb) => {
  try {
    const { payload, shop, eventKey } = task;

    // Add event to the batch
    batch.push({ payload, shop, eventKey });

    // Only send email if batch has 3 events
    if (batch.length === 3) {
      console.log("📧 Sending email for batch:", batch.map(e => e.eventKey));

      // Compose email body
      const emailBody = batch.map((e, i) => {
        const p = e.payload;
        return `
          <h3>Event ${i + 1}</h3>
          <p><strong>Title:</strong> ${p.title}</p>
          <p><strong>Handle:</strong> ${p.handle}</p>
          <p><strong>Type:</strong> ${p.product_type}</p>
          <p><strong>Vendor:</strong> ${p.vendor}</p>
          <p><strong>Status:</strong> ${p.status}</p>
          <p><strong>Created At:</strong> ${p.created_at}</p>
          <p><strong>Updated At:</strong> ${p.updated_at}</p>
          <hr/>
        `;
      }).join('');

      // Send email
      const { error } = await resend.emails.send({
        from: "Shopify App <onboarding@resend.dev>",
        to: ["deepak.solanki102001@gmail.com"],
        subject: `Batch of 3 Products Created`,
        html: emailBody,
      });

      if (error) {
        console.error("❌ Batch email failed:", error);
      } else {
        console.log("✅ Batch email sent successfully!");
      }

      // Clear the batch
      batch = [];
    }

    cb();
  } catch (err) {
    console.error("❌ Queue processing error:", err);
    cb(err);
  }
}, {
  concurrent: 1,  // Process one task at a time to preserve batch order
  maxRetries: 3,
  retryDelay: 1000,
});

// --- Webhook handler ---
export const action = async ({ request }) => {
  try {
    if (request.method === "OPTIONS") return new Response("ok", { status: 200 });

    // Unique event identifier to prevent duplicates
    const eventId = request.headers.get('x-shopify-event-id');

    const { shop, payload } = await authenticate.webhook(request);

    // Ignore duplicates
    if (processedEvents.has(eventId)) {
      console.log("Duplicate webhook ignored:", eventId);
      return new Response(null, { status: 200 });
    }

    processedEvents.set(eventId, Date.now());
    if (processedEvents.size > 1000) processedEvents.clear();


    // Push event to queue (processed asynchronously)
    queue.push({ payload, shop, eventId });

    // // Immediately respond to Shopify
    return new Response("ok", { status: 200 });

  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
};
