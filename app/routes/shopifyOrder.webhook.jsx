// import { authenticate } from "../shopify.server.js";
// import ShopifyOrderController from "../controllers/shopifyOrder/index.js";

// /**
//  * Webhook route for Shopify order creation
//  * Handles incoming order webhooks and processes subscription replacements
//  */
// export const action = async ({ request }) => {
//   try {
//     // Authenticate the webhook request
//     const { payload, admin } = await authenticate.webhook(request);
    
//     if (!admin) {
//       throw new Error("Admin authentication failed");
//     }

//     // Initialize controller and handle the webhook
//     const controller = new ShopifyOrderController();
//     const result = await controller.handleOrderWebhook(payload, admin);

//     return new Response("ok", { status: 200 });
//   } catch (error) {
//     console.error("❌ Webhook route error:", error.message);
//     // Return 200 to prevent Shopify from retrying
//     return new Response("ok", { status: 200 });
//   }
// };
