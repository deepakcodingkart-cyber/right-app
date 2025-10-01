import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory batch
let batch = [];

export async function emailSendOnProductCreate(task, cb) {
  try {
    const { payload, shop, eventId } = task;

    // Add to batch
    batch.push({ payload, shop, eventId });

    // Send email only when 3 events collected
    if (batch.length === 3) {
      console.log("📧 Sending email for batch:", batch.map(e => e.eventId));

      // Build email body
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
        cb(new Error("Email sending failed"));
      } else {
        console.log("✅ Batch email sent successfully!");
        cb(null, "Batch email sent successfully");
      }

      // Reset batch
      batch = [];
    } else {
      cb(null, "Task added to batch, waiting for more");
    }
  } catch (err) {
    console.error("❌ Job error:", err);
    cb(err);
  }
}
