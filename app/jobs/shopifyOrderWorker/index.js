// // import { Worker } from "bullmq";
// import pkg from "bullmq";
// import { handleOrderWebhook } from "../../controllers/shopifyOrder/index.js";
// import { getRedisClient, connection } from "../../config/redis";
// import { shopifyOrderQueue } from "../../queue/shopifyOrderQueue/index.js";



// const { Worker } = pkg;
// const shopifyOrderWorker = new Worker(
//   shopifyOrderQueue.name,
//   async (job) => {
//     const { payload, admin } = job.data;

//     try {
//       // Run full Shopify order webhook logic
//       await handleOrderWebhook(payload, admin);

//       // Optional: log completion in Redis
//       const client = await getRedisClient();
//       await client.rPush(
//         "shopify_order_completed",
//         JSON.stringify({ orderId: payload?.admin_graphql_api_id, timestamp: new Date() })
//       );

//       return { success: true };
//     } catch (err) {
//       console.error(`❌ Job failed for order ${payload?.admin_graphql_api_id}:`, err.message);
//       throw err; // rethrow for BullMQ to handle retries
//     }
//   },
//   {
//     connection,
//     concurrency: 2,      // adjust concurrency as needed
//     lockDuration: 30000, // 30s lock per job
//   }
// );

// shopifyOrderWorker.on("completed", (job) => {
//   console.log(`✅ Shopify order job completed: ${job.id}`);
// });

// shopifyOrderWorker.on("failed", (job, err) => {
//   console.error(`❌ Shopify order job failed: ${job.id}`, err.message);
// });

// console.log("🟢 ShopifyOrderWorker started and listening for jobs...");
