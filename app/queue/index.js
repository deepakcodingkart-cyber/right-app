import BetterQueue from "better-queue";
import { emailSendOnProductCreate } from "../jobs/index.js";

export const queue = new BetterQueue(emailSendOnProductCreate, {
  concurrent: 1,   // process 1 task at a time
  maxRetries: 3,   // retry on failure
  retryDelay: 1000 // wait 1s before retry
});

// Logs (optional but helpful)
queue.on("task_finish", (id, result) => {
  console.log(`✅ Task ${id} finished:`, result);
});

queue.on("task_failed", (id, err) => {
  console.error(`❌ Task ${id} failed:`, err.message);
});
