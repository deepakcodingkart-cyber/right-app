import ShopifyProductService from "../shopifyproduct/shopifyProductService.js";
import {
  ORDER_EDIT_BEGIN,
  ORDER_EDIT_SET_QUANTITY,
  ORDER_EDIT_ADD_VARIANT,
  ORDER_EDIT_COMMIT,
} from "../../shopifyQueryOrMutaion/order.js";
import { apply_discount_add_varient } from "../../shopifyQueryOrMutaion/discount.js";
import { calculateDiscount } from "../../utils/discountCalculator.js";
import { AppError } from "../../utils/errorHandler.js";
import { callShopifyGraphQL } from "../../utils/shopifyGraphQL.js"; // Your global function
/**
 * ShopifyOrderService
 * 
 * This service handles all operations related to Shopify Order Edits,
 * including fetching replacement products, modifying order line items,
 * applying discounts, and committing the changes.
 * 
 * Each method uses AppError to standardize error handling across the service layer.
 */


class ShopifyOrderService {
  constructor() {
    // Initialize ShopifyProductService to fetch product/variant data when needed
    this.productService = new ShopifyProductService();
  }

  /**
   * fetchReplacementProducts
   * 
   * Fetches all available replacement products from Shopify.
   * Uses ShopifyProductService internally.
   */
  async fetchReplacementProducts(shop, accessToken) {
    try {
      return this.productService.fetchReplacementProducts(shop, accessToken);
    } catch (err) {
      // Wrap original error with contextual AppError
      throw new AppError("Failed to fetch replacement products", {
        layer: "SERVICE",
        originalError: err,
      });
    }
  }

  /**
   * beginOrderEdit
   * 
   * Starts an order edit session for a given order ID.
   * Returns the calculated order object and its ID.
   */
  async beginOrderEdit(shop, accessToken, orderId) {
    try {
      const resp = await callShopifyGraphQL(shop, accessToken, ORDER_EDIT_BEGIN, { id: orderId });

      // Check for any GraphQL errors
      if (resp.errors) throw new Error(JSON.stringify(resp.errors));

      const calcOrder = resp.data?.orderEditBegin?.calculatedOrder;
      const calcOrderId = calcOrder?.id;

      if (!calcOrderId) throw new Error("No calculated order ID returned");

      console.log(`📝 Order edit begun: ${calcOrderId}`);
      return { calcOrder, calcOrderId };
    } catch (err) {
      throw new AppError("Failed to begin order edit", {
        layer: "SERVICE",
        context: { orderId },
        originalError: err,
      });
    }
  }
 /**
   * removeSubscriptionItems
   * 
   * Removes specific subscription items from an ongoing calculated order.
   * Iterates over each subscription line item and sets its quantity to zero.
   */
  async removeSubscriptionItems(shop, accessToken, calcOrderId, calcOrder, subscriptionLineItems) {
    try {
      for (const subItem of subscriptionLineItems) {
        const targetItem = calcOrder.lineItems.nodes.find(
          (li) => li.variant?.id?.split("/").pop() === String(subItem.variant_id)
        );

        if (!targetItem) {
          console.warn(`⚠️ Could not find line item for variant ${subItem.variant_id}`);
          continue;
        }

        const resp = await callShopifyGraphQL(shop, accessToken, ORDER_EDIT_SET_QUANTITY, {
          id: calcOrderId,
          lineItemId: targetItem.id,
          quantity: 0,
        });

        if (resp.errors || resp.data?.orderEditSetQuantity?.userErrors?.length) {
          const errors = resp.errors || resp.data.orderEditSetQuantity.userErrors;
          throw new Error(JSON.stringify(errors));
        }

        console.log(`✅ Line item removed: ${targetItem.id}`);
      }
    } catch (err) {
      throw new AppError("Failed to remove subscription items", {
        layer: "SERVICE",
        context: { calcOrderId, subscriptionLineItems },
        originalError: err,
      });
    }
  }

  /**
   * addReplacementVariant
   * 
   * Adds a replacement variant to the calculated order.
   * Returns the ID of the newly added line item.
   */
  async addReplacementVariant(shop, accessToken, calcOrderId, replacementVariant) {
    try {
      const resp = await callShopifyGraphQL(shop, accessToken, ORDER_EDIT_ADD_VARIANT, {
        id: calcOrderId,
        variantId: replacementVariant.id,
        quantity: 1,
      });

      if (resp.errors) throw new Error(JSON.stringify(resp.errors));
      if (resp.data.orderEditAddVariant.userErrors?.length) {
        throw new Error(JSON.stringify(resp.data.orderEditAddVariant.userErrors));
      }

      const addedLineItemId =
        resp.data.orderEditAddVariant.calculatedOrder?.addedLineItems?.nodes?.[0]?.id;

      if (!addedLineItemId) console.warn("⚠️ No line item ID returned after adding variant");
      console.log("📦 Replacement variant added", addedLineItemId);

      return addedLineItemId;
    } catch (err) {
      throw new AppError("Failed to add replacement variant", {
        layer: "SERVICE",
        context: { calcOrderId, replacementVariant },
        originalError: err,
      });
    }
  }

  /**
   * calculateDiscountPercent
   * 
   * Utility method to compute discount percentage based on subscription and replacement prices.
   */
  calculateDiscountPercent(subscriptionPrice, replacementPrice) {
    return calculateDiscount(subscriptionPrice, replacementPrice);
  }

 /**
   * applyDiscountToLineItem
   * 
   * Applies a discount to a specific line item in the calculated order.
   * The discount is provided as a percentage.
   */
  async applyDiscountToLineItem(shop, accessToken, calcOrderId, lineItemId, discountPercent) {
    try {
      const resp = await callShopifyGraphQL(shop, accessToken, apply_discount_add_varient, {
        id: calcOrderId,
        lineItemId,
        discount: {
          percentValue: discountPercent,
          description: "Adjusted to match subscription price",
        },
      });

      if (resp.errors) throw new Error(JSON.stringify(resp.errors));
      if (resp.data?.orderEditAddLineItemDiscount?.userErrors?.length) {
        throw new Error(JSON.stringify(resp.data.orderEditAddLineItemDiscount.userErrors));
      }

      console.log(`💰 Discount of ${discountPercent.toFixed(2)}% applied to line item`);
    } catch (err) {
      throw new AppError("Failed to apply discount", {
        layer: "SERVICE",
        context: { calcOrderId, lineItemId, discountPercent },
        originalError: err,
      });
    }
  }

  /**
   * commitOrderEdit
   * 
   * Commits the calculated order changes and optionally notifies the customer.
   */
  async commitOrderEdit(shop, accessToken, calcOrderId) {
    try {
      const resp = await callShopifyGraphQL(shop, accessToken, ORDER_EDIT_COMMIT, {
        id: calcOrderId,
        notifyCustomer: true,
        staffNote: "Subscription replaced automatically via webhook",
      });

      if (resp.errors) throw new Error(JSON.stringify(resp.errors));
      if (resp.data?.orderEditCommit?.userErrors?.length) {
        throw new Error(JSON.stringify(resp.data.orderEditCommit.userErrors));
      }

      console.log("✅ Order edit committed successfully");
    } catch (err) {
      throw new AppError("Failed to commit order edit", {
        layer: "SERVICE",
        context: { calcOrderId },
        originalError: err,
      });
    }
  }
}

export default ShopifyOrderService;
