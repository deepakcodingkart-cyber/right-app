// orderMessageTemplate.js
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Success Template
const SUCCESS_TEMPLATE = `
  <h2>🎉 Subscription Replacement Completed</h2>
  <p>The following orders were processed successfully:</p>
  <ul>
    {ordersList}
  </ul>
  <p><em>Total Orders: {count}</em></p>
  <hr/>
  <p style="font-size:12px;color:#666;">This is an automated message from Shopify App.</p>
`;

// ✅ Failure Template
const FAILURE_TEMPLATE = `
  <h2>🚨 Subscription Replacement Failed</h2>
  <p>The following order failed during processing:</p>
  <ul>
    <li><strong>Order ID:</strong> {orderId}</li>
    <li><strong>Error:</strong> {error}</li>
    <li><strong>Timestamp:</strong> {timestamp}</li>
  </ul>
  <hr/>
  <p style="font-size:12px;color:#666;">This is an automated alert from Shopify App.</p>
`;

// ✅ Generate success email body for batch of 3
export function generateSuccessEmailBody(orders) {
  const ordersList = orders
    .map(
      (o) => `
        <li>
          <strong>Order ID:</strong> ${o.orderId} <br/>
          <strong>Processed At:</strong> ${new Date().toISOString()}
        </li>`
    )
    .join("");

  return SUCCESS_TEMPLATE
    .replace("{ordersList}", ordersList)
    .replace("{count}", orders.length);
}

// ✅ Generate failure email body
export function generateFailureEmailBody(failData) {
  return FAILURE_TEMPLATE
    .replace("{orderId}", failData.orderId)
    .replace("{error}", failData.error)
    .replace("{timestamp}", failData.timestamp);
}

// ✅ Send Email (common)
export async function sendEmail(subject, html) {
  const { error } = await resend.emails.send({
    from: "Shopify App <onboarding@resend.dev>",
    to: ["deepak.solanki102001@gmail.com"], 
    subject,
    html,
  });

  if (error) {
    console.error("❌ Email failed:", error);
    return false;
  } else {
    console.log("✅ Email sent successfully!");
    return true;
  }
}
