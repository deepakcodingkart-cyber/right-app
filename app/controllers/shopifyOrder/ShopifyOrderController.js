import ShopifyOrderService from "../../services/shopifyorder/index.js";

/**
 * Controller for handling Shopify order webhooks
 * Manages the flow between routes and services
 */
class ShopifyOrderController {
  constructor() {
    this.orderService = new ShopifyOrderService();
  }

  /**
   * Handle order webhook from Shopify
   * @param {Object} payload - The webhook payload from Shopify
   * @param {Object} admin - Authenticated admin GraphQL client
   * @returns {Promise<Object>} Result of the webhook processing
   */
  async handleOrderWebhook(payload, admin) {
    try {
      console.log("🎯 Controller: Processing order webhook");

      // Validate payload
      if (!payload || !payload.line_items) {
        throw new Error("Invalid payload: missing line_items");
      }

      // Check for subscription items
      const subscriptionLineItems = this.extractSubscriptionItems(payload.line_items);
      
      if (!subscriptionLineItems || subscriptionLineItems.length === 0) {
        console.log("ℹ️ No subscription items found in order");
        return { success: true, message: "No subscription items to process" };
      }

      console.log(`📦 Found ${subscriptionLineItems.length} subscription item(s)`);

      // Process the order through the service layer
      const result = await new ShopifyOrderService().processOrderReplacement(
        payload,
        admin,
        subscriptionLineItems
      );

      console.log("✅ Controller: Order processed successfully");
      return result;

    } catch (error) {
      console.error("❌ Controller error:", error.message);
      throw error;
    }
  }

  /**
   * Extract subscription line items from order
   * @param {Array} lineItems - Array of line items from the order
   * @returns {Array} Filtered subscription line items
   */
  extractSubscriptionItems(lineItems) {
    try {
      return lineItems.filter(li => {
        const title = (li.title || "").toLowerCase();
        return title.includes("subscription");
      });
    } catch (error) {
      console.error("❌ Error extracting subscription items:", error.message);
      return [];
    }
  }
}

export default ShopifyOrderController;
