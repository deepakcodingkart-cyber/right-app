// queue/shopifyOrderQueue.js
import pkg from "bullmq";
import { connection } from "../../config/redis/index.js";
import { handleOrderWebhook } from "../../controllers/shopifyOrder/index.js";
import {
  generateSuccessEmailBody,
  generateFailureEmailBody,
  sendEmail,
} from "../../utils/messageTemplate/orderReplacementMessage.js";

const { Queue, Worker } = pkg;

// Create the Queue for Shopify orders
export const shopifyOrderQueue = new Queue("shopifyOrderQueue", {
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100, // Keep last 100 successful job logs
    removeOnFail: 100, // Keep last 100 failed job logs
  },
});

// Store successful job results temporarily for batch email sending
let successBatch = [];

// Worker (processes jobs from the queue)
const shopifyOrderWorker = new Worker(
  shopifyOrderQueue.name,
  async (job) => {
    const { payload } = job.data;
    try {
      await handleOrderWebhook(payload);
      // Return data for the 'completed' event
      return { success: true, orderId: payload?.admin_graphql_api_id || payload?.id };
    } catch (err) {
      // 1. Log the error immediately
      console.error(`Error processing Job ${job.id}:`, err);
      // 2. Re-throw an error to signal BullMQ that the job FAILED.
      // This is crucial for triggering retries or the 'failed' event.
      throw new Error(`Job failed for order ${payload?.admin_graphql_api_id}: ${err.message}`);
    }
  },
  { connection, concurrency: 2, lockDuration: 30000 }
);


// ---------------------------------------------
// Worker Event Handlers
// ---------------------------------------------

// Handler for completed jobs
shopifyOrderWorker.on("completed", async (job, result) => {
  console.log(`✅ Job completed: ${job.id}`);

  // Push result to batch
  successBatch.push(result);
  console.log("batch ", successBatch)

  // Send a batch email notification when 3 successful jobs are processed
  if (successBatch.length >= 3) {
    const body = generateSuccessEmailBody(successBatch);
    await sendEmail("✅ Batch of 3 Orders Completed", body);

    // Reset batch
    successBatch = [];
  }
});

// Handler for failed job attempts (including permanent failures)
shopifyOrderWorker.on("failed", async (job, err) => {
  // 1. Get the maximum attempts allowed.
  const maxAttempts = job.opts.attempts || 3;

  // 2. Check for final permanent failure (no more retries).
  if (job.attemptsMade >= maxAttempts) {
    console.error(`❌ Job permanently failed after ${job.attemptsMade} attempts: ${job.id}`, err.message);
    const failData = {
      orderId: job?.data?.payload?.admin_graphql_api_id || job?.data?.payload?.id,
      error: err.message,
      timestamp: new Date().toISOString(),
      attempts: job.attemptsMade,
      maxAttempts: maxAttempts
    };

    const body = generateFailureEmailBody(failData);
    // Send a final email for permanent failure.
    await sendEmail("❌ Order Processing Failed (Permanent)", body);

  } else {
    // Log the retry failure, but suppress email notification for intermediate retries
    console.warn(`⚠️ Job attempt failed: ${job.id}. Retrying (${job.attemptsMade} of ${maxAttempts}).`);
  }
});

// Handler for worker-level errors (e.g., connection issues, internal BullMQ errors)
shopifyOrderWorker.on("error", async (err) => {
  console.error(`🔥 Worker error:`, err);

  const body = `
    <h3>🔥 Worker Crashed</h3>
    <p>Error: ${err.message}</p>
    <p>Timestamp: ${new Date().toISOString()}</p>
  `;
  await sendEmail("🔥 Worker Crashed - ShopifyOrderWorker", body);
});

// Initial startup log
console.log("🟢 ShopifyOrderWorker started and listening for jobs...");