// queue/shopifyOrderQueue.js
import pkg from "bullmq";
// 👇 Import the Redis connection for BullMQ and the client utility for batch management
import { connection, getRedisClient } from "../../config/redis/index.js"; 
import { handleOrderWebhook } from "../../controllers/shopifyOrder/index.js";
import {
  generateSuccessEmailBody,
  generateFailureEmailBody,
  sendEmail,
} from "../../utils/messageTemplate/orderReplacementMessage.js";

const { Queue, Worker } = pkg;

// 👇 Define the key for the Redis list that stores the batch
const SUCCESS_BATCH_LIST = "shopify:successBatch";
// 👇 Define the batch size
const BATCH_SIZE = 3;

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
      throw new Error(`Job failed for order ${payload?.admin_graphql_api_id}: ${err.message}`);
    }
  },
  { connection, concurrency: 2, lockDuration: 30000 }
);


// ---------------------------------------------
// Worker Event Handlers
// ---------------------------------------------

// Handler for completed jobs (Uses Redis for persistent batching)
shopifyOrderWorker.on("completed", async (job, result) => {
  console.log(`✅ Job completed: ${job.id}`);
  
  try {
    const redisClient = await getRedisClient();
    
    // Convert the result object to a string for saving in Redis
    const resultString = JSON.stringify(result);
    
    // 👇 ADDED CONSOLE LOG HERE to see what's being saved
    console.log(`➡️ Saving to batch (${SUCCESS_BATCH_LIST}):`, resultString);

    // 1. Push the result onto the list (LPUSH adds to the left/head)
    await redisClient.lPush(SUCCESS_BATCH_LIST, resultString);
    
    // 2. Get the current length of the list
    const currentBatchSize = await redisClient.lLen(SUCCESS_BATCH_LIST);
    console.log(`Current batch size: ${currentBatchSize}`);

    // 3. Check if the batch size is reached
    if (currentBatchSize >= BATCH_SIZE) {
      console.log(`📬 Batch size of ${BATCH_SIZE} reached! Sending email...`);

      // 4. Atomically retrieve the batch (LRange)
      const rawBatchData = await redisClient.lRange(SUCCESS_BATCH_LIST, 0, BATCH_SIZE - 1);
      
      // 5. Atomically remove the retrieved items from the list (LTrim)
      // This ensures that the batch is "committed" before the email is sent
      await redisClient.lTrim(SUCCESS_BATCH_LIST, BATCH_SIZE, -1); 
      
      // 6. Parse the data and reverse it (because LPUSH reverses the order)
      const successBatch = rawBatchData
        .map(item => JSON.parse(item))
        .reverse(); 

      // 7. Send the email
      const body = generateSuccessEmailBody(successBatch);
      await sendEmail(`✅ Batch of ${BATCH_SIZE} Orders Completed`, body);

      console.log("✅ Batch email sent and batch reset in Redis.");
    }
  } catch (err) {
    console.error("❌ Failed to process or send batch email (Redis/Email error):", err);
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