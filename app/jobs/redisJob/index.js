import { getRedisClient } from "../../config/redis";

import { generateEmailBody, sendBatchEmail } from "../../utils/messageTemplate/productCreateMessage.js";

export async function job(input, cb) {
  try {
    const client = await getRedisClient();

    // Redis list me job store karo
    await client.rPush("job_batch", JSON.stringify(input));

    // List length check karo
    const length = await client.lLen("job_batch");

    if (length >= 3) {
      // Get all jobs
      const batchJobs = await client.lRange("job_batch", 0, -1);

      // Parse jobs
      const parsed = batchJobs.map((j) => JSON.parse(j));

      // Email body banaye using imported function
      const emailBody = parsed
        .map((e, i) => generateEmailBody(e.payload))
        .join("");

      // Send email using imported function
      await sendBatchEmail(emailBody);

      // Clear Redis list (reset for next batch)
      await client.del("job_batch");
    }

    cb(null, { success: true });
  } catch (err) {
    cb(err);
  }
}