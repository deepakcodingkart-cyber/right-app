import Queue from "better-queue";
import { job } from "../jobs/index.js";

export const queue = new Queue(job, {
  concurrent: 1,
  maxRetries: 3,
  retryDelay: 1000,
});

queue.on("task_finish", (id, result) => {
  console.log(`✅ Task ${id} finished:`, result);
});

queue.on("task_failed", (id, err) => {
  console.error(`❌ Task ${id} failed:`, err.message);
});
