import { getRedisClient } from "../dbservices/redis.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

      // Email body banaye
      const emailBody = parsed
        .map((e, i) => {
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
        })
        .join("");

      // Resend mail bhejna
      const { error } = await resend.emails.send({
        from: "Shopify App <onboarding@resend.dev>",
        to: ["deepak.solanki102001@gmail.com"],
        subject: "Batch of 3 Products Created",
        html: emailBody,
      });

      if (error) {
        console.error("❌ Batch email failed:", error);
      } else {
        console.log("✅ Batch email sent successfully!");
      }

      // Clear Redis list (reset for next batch)
      await client.del("job_batch");
    }

    cb(null, { success: true });
  } catch (err) {
    cb(err);
  }
}
