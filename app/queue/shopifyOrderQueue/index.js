// queue/shopifyOrderQueue.js
import pkg from "bullmq";
import { connection } from "../../config/redis/index.js";
import { handleOrderWebhook } from "../../controllers/shopifyOrder/index.js";
const { Queue, Worker } = pkg;

// ✅ Create Queue
export const shopifyOrderQueue = new Queue("shopifyOrderQueue", { 
  connection,
  defaultJobOptions: {
    // Retry configuration (replaces QueueScheduler functionality)
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100, // Keep only 100 completed jobs
    removeOnFail: 100, // Keep only 100 failed jobs
  }
});

// ✅ Worker (process jobs)
const shopifyOrderWorker = new Worker(
  shopifyOrderQueue.name,
  async (job) => {
    const { payload } = job.data;
    // const { payload, admin } = job.data;
    // const accessToken = await getAccessToken();
    // const shop = process.env.SHOP_NAME
    try {
      await handleOrderWebhook(payload);
      return { success: true };
    } catch (err) {
      console.error(`❌ Job failed for order ${payload?.admin_graphql_api_id}:`, err.message);
      throw err;
    }
  },
  {
    connection,
    concurrency: 2,
    lockDuration: 30000,
  }
);

// Events
shopifyOrderWorker.on("completed", (job) => {
  console.log(`✅ Job completed: ${job.id}`);
});

shopifyOrderWorker.on("failed", (job, err) => {
  console.error(`❌ Job failed: ${job.id}`, err.message);
});

shopifyOrderWorker.on("error", (err) => {
  console.error(`🔥 Worker error:`, err);
});

console.log("🟢 ShopifyOrderWorker started and listening for jobs...");