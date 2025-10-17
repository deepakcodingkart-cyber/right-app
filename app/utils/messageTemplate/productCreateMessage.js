// messageTemplate.js
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

// Global message template
const GLOBAL_MESSAGE_TEMPLATE = `
  <h3>Product Event</h3>
  <p><strong>Title:</strong> {title}</p>
  <p><strong>Handle:</strong> {handle}</p>
  <p><strong>Type:</strong> {type}</p>
  <p><strong>Vendor:</strong> {vendor}</p>
  <p><strong>Status:</strong> {status}</p>
  <p><strong>Created At:</strong> {createdAt}</p>
  <p><strong>Updated At:</strong> {updatedAt}</p>
`;

// Function to generate email body
export function generateEmailBody(payload) {
  let message = GLOBAL_MESSAGE_TEMPLATE;
  return message
    .replace(/{title}/g, payload.title)
    .replace(/{handle}/g, payload.handle)
    .replace(/{type}/g, payload.product_type)
    .replace(/{vendor}/g, payload.vendor)
    .replace(/{status}/g, payload.status)
    .replace(/{createdAt}/g, payload.created_at)
    .replace(/{updatedAt}/g, payload.updated_at);
}

// Function to send email
export async function sendBatchEmail(emailBody) {
  const { error } = await resend.emails.send({
    from: "Shopify App <onboarding@resend.dev>",
    to: ["deepak.solanki102001@gmail.com"],
    subject: "Batch of 3 Products Created",
    html: emailBody,
  });

  if (error) {
    console.error("❌ Batch email failed:", error);
    return false;
  } else {
    console.log("✅ Batch email sent successfully!");
    return true;
  }
}
