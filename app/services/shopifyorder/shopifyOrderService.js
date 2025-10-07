import ShopifyProductService from "../shopifyproduct/index.js";
import { calculateDiscount } from "../../utils/discountCalculator.js";
import * as OrderHelpers from "./shopifyOrderHelpers.js";

/**
 * Service class for handling Shopify order operations
 * Contains business logic for order processing and replacement
 */
class ShopifyOrderService {
  constructor() {
    this.productService = new ShopifyProductService();
  }

  /**
   * Process order replacement for subscription items
   * @param {Object} payload - Order payload from webhook
   * @param {Object} admin - Shopify admin GraphQL client
   * @param {Array} subscriptionLineItems - Subscription items to replace
   * @returns {Promise<Object>} Result of the replacement process
   */
  async processOrderReplacement(payload, admin, subscriptionLineItems) {
    try {
      console.log("🔄 Service: Starting order replacement process");

      // Step 1: Fetch replacement products
      const products = await this.productService.fetchReplacementProducts(admin);
      
      if (!products || products.length === 0) {
        throw new Error("No replacement products found");
      }

      console.log(`📦 Found ${products.length} potential replacement product(s)`);

      // Step 2: Pick the best replacement variant
      // Diagnostics: ensure helper is available and is a function
      if (process && process.env && process.env.NODE_ENV !== "production") {
        console.log("🧩 OrderHelpers exports:", Object.keys(OrderHelpers));
        console.log(
          "🧪 typeof OrderHelpers.pickReplacementVariant:",
          typeof OrderHelpers.pickReplacementVariant
        );
      }

      if (typeof OrderHelpers.pickReplacementVariant !== "function") {
        throw new Error("pickReplacementVariant export not found or not a function from shopifyOrderHelpers.js");
      }

      const replacementVariant = OrderHelpers.pickReplacementVariant(subscriptionLineItems, products);
      
      if (!replacementVariant) {
        throw new Error("No suitable replacement variant found");
      }

      console.log("✅ Replacement variant selected:", replacementVariant.id);

      // Step 3: Begin order edit
      const { calcOrder, calcOrderId } = await OrderHelpers.beginOrderEdit(admin, payload.admin_graphql_api_id);
      console.log("✅ Step 1: Order edit begun");

      // Step 4: Remove subscription items
      await OrderHelpers.removeSubscriptionItems(admin, calcOrderId, calcOrder, subscriptionLineItems);
      console.log("✅ Step 2: Subscription items removed");

      // Step 5: Add replacement variant
      const addedLineItemId = await OrderHelpers.addReplacementVariant(admin, calcOrderId, replacementVariant);
      console.log("✅ Step 3: Replacement variant added");

      // Step 6: Apply discount if needed
      await this.applyDiscountIfNeeded(
        admin,
        calcOrderId,
        addedLineItemId,
        subscriptionLineItems[0],
        replacementVariant
      );
      console.log("✅ Step 4: Discount applied (if applicable)");

      // Step 7: Commit the order edit
      await OrderHelpers.commitOrderEdit(admin, calcOrderId);
      console.log("✅ Step 5: Order edit committed");

      console.log("🎉 Service: Order replacement completed successfully");

      return {
        success: true,
        message: "Subscription items replaced successfully",
        replacementVariantId: replacementVariant.id
      };

    } catch (error) {
      console.error("❌ Service error in processOrderReplacement:", error.message);
      throw error;
    }
  }

  /**
   * Apply discount to the added line item if needed
   * @param {Object} admin - Shopify admin GraphQL client
   * @param {String} calcOrderId - Calculated order ID
   * @param {String} addedLineItemId - ID of the added line item
   * @param {Object} subscriptionItem - Original subscription item
   * @param {Object} replacementVariant - Replacement variant
   */
  async applyDiscountIfNeeded(admin, calcOrderId, addedLineItemId, subscriptionItem, replacementVariant) {
    try {
      if (!addedLineItemId) {
        console.warn("⚠️ No line item ID available for discount application");
        return;
      }

      const discountPercent = calculateDiscount(
        subscriptionItem.price,
        replacementVariant.price
      );

      if (discountPercent > 0) {
        console.log(`💰 Applying ${discountPercent.toFixed(2)}% discount to line item ${addedLineItemId}`);
        
        await OrderHelpers.applyDiscountToLineItem(admin, calcOrderId, addedLineItemId, discountPercent);
        
        console.log("✅ Discount applied successfully");
      } else {
        console.log("ℹ️ No discount needed (discount percent: 0)");
      }

    } catch (error) {
      console.error("❌ Error applying discount:", error.message);
      // Don't throw - discount is not critical
      console.warn("⚠️ Continuing without discount");
    }
  }
}

export default ShopifyOrderService;
