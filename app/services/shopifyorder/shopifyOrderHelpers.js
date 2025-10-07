import {
  ORDER_EDIT_BEGIN,
  ORDER_EDIT_SET_QUANTITY,
  ORDER_EDIT_ADD_VARIANT,
  ORDER_EDIT_COMMIT
} from "../../shopifyQueryOrMutaion/order.js";
import { apply_discount_add_varient } from "../../shopifyQueryOrMutaion/discount.js";

/**
 * Helper functions for Shopify order operations
 * Contains reusable utility functions for order editing
 */

/**
 * Pick the best replacement variant based on subscription item attributes
 * @param {Array} subscriptionLineItems - Subscription items from the order
 * @param {Array} products - Available products to choose from
 * @returns {Object|null} The best matching variant or null
 */
export function pickReplacementVariant(subscriptionLineItems, products) {
  try {
    if (!subscriptionLineItems?.length || !products?.length) {
      console.warn("⚠️ Missing subscription items or products");
      return null;
    }

    const firstItem = subscriptionLineItems[0];
    let extractedSize = null;
    let extractedTaste = null;

    // Extract size and taste from variant options
    if (firstItem.variant_options?.length) {
      firstItem.variant_options.forEach(opt => {
        const lower = opt.toLowerCase();
        if (/\d+\s?(g|gram|kg|ml)/.test(lower)) {
          extractedSize = lower;
        }
        if (/light|medium|dark/.test(lower)) {
          extractedTaste = lower;
        }
      });
    } 
    // Extract from variant title if options not available
    else if (firstItem.variant_title) {
      const lowerTitle = firstItem.variant_title.toLowerCase();
      
      const sizeMatch = lowerTitle.match(/(\d+\s?(g|gram|kg|ml))/);
      if (sizeMatch) {
        extractedSize = sizeMatch[0];
      }
      
      const tasteMatch = lowerTitle.match(/(light|medium|dark)\s*roast/);
      if (tasteMatch) {
        extractedTaste = tasteMatch[0];
      }
    }

    console.log(`🔍 Looking for variant with size: ${extractedSize}, taste: ${extractedTaste}`);

    // Find matching variant
    let replacementVariant = null;
    outer: for (const product of products) {
      if (!product.variants?.nodes) continue;

      for (const variant of product.variants.nodes) {
        // Build options map
        const opts = (variant.selectedOptions || []).reduce((acc, o) => {
          acc[o.name.toLowerCase().trim()] = o.value.toLowerCase().trim();
          return acc;
        }, {});

        // Skip subscription variants
        const isSubscription =
          (variant.title || "").toLowerCase().includes("subscription") ||
          (product.title || "").toLowerCase().includes("subscription");
        
        if (isSubscription) continue;

        // Check for size and taste match
        const sizeMatch = 
          (opts.size || "").includes(extractedSize) || 
          (variant.title || "").toLowerCase().includes(extractedSize);
        
        const tasteMatch = 
          (opts.taste || "").includes(extractedTaste) || 
          (variant.title || "").toLowerCase().includes(extractedTaste);

        if (sizeMatch && tasteMatch) {
          replacementVariant = variant;
          console.log(`✅ Found matching variant: ${variant.id}`);
          break outer;
        }
      }
    }

    if (!replacementVariant) {
      console.warn("⚠️ No matching replacement variant found");
    }

    return replacementVariant;

  } catch (error) {
    console.error("❌ Error in pickReplacementVariant:", error.message);
    return null;
  }
}

/**
 * Begin an order edit session 
 * @param {Object} admin - Shopify admin GraphQL client
 * @param {String} orderId - The order ID to edit
 * @returns {Promise<Object>} Calculated order and its ID
 */
export async function beginOrderEdit(admin, orderId) {
  try {
    const resp = await admin.graphql(ORDER_EDIT_BEGIN, {
      variables: { id: orderId }
    });

    const json = await resp.json();
    
    if (json.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }

    const calcOrder = json.data?.orderEditBegin?.calculatedOrder;
    const calcOrderId = calcOrder?.id;

    if (!calcOrderId) {
      throw new Error("Failed to begin order edit - no calculated order ID returned");
    }

    console.log(`📝 Order edit begun: ${calcOrderId}`);
    return { calcOrder, calcOrderId };

  } catch (error) {
    console.error("❌ Error in beginOrderEdit:", error.message);
    throw error;
  }
}

/**
 * Remove subscription items from the order
 * @param {Object} admin - Shopify admin GraphQL client
 * @param {String} calcOrderId - Calculated order ID
 * @param {Object} calcOrder - Calculated order object
 * @param {Array} subscriptionLineItems - Subscription items to remove
 */
export async function removeSubscriptionItems(admin, calcOrderId, calcOrder, subscriptionLineItems) {
  try {
    for (const subItem of subscriptionLineItems) {
      // Find the matching line item in the calculated order
      const targetItem = calcOrder.lineItems.nodes.find(
        li => li.variant?.id?.split("/").pop() === String(subItem.variant_id)
      );

      if (!targetItem) {
        console.warn(`⚠️ Could not find line item for variant ${subItem.variant_id}`);
        continue;
      }

      console.log(`🗑️ Removing line item: ${targetItem.id}`);

      // Set quantity to 0 to remove the item
      const resp = await admin.graphql(ORDER_EDIT_SET_QUANTITY, {
        variables: {
          id: calcOrderId,
          lineItemId: targetItem.id,
          quantity: 0
        }
      });

      const json = await resp.json();

      if (json.errors || json.data?.orderEditSetQuantity?.userErrors?.length) {
        const errors = json.errors || json.data.orderEditSetQuantity.userErrors;
        throw new Error(`Failed to remove line item: ${JSON.stringify(errors)}`);
      }

      console.log(`✅ Line item removed: ${targetItem.id}`);
    }

  } catch (error) {
    console.error("❌ Error in removeSubscriptionItems:", error.message);
    throw error;
  }
}

/**
 * Add a replacement variant to the order
 * @param {Object} admin - Shopify admin GraphQL client
 * @param {String} calcOrderId - Calculated order ID
 * @param {Object} replacementVariant - The variant to add
 * @returns {Promise<String>} The ID of the added line item
 */
export async function addReplacementVariant(admin, calcOrderId, replacementVariant) {
  try {
    const resp = await admin.graphql(ORDER_EDIT_ADD_VARIANT, {
      variables: {
        id: calcOrderId,
        variantId: replacementVariant.id,
        quantity: 1
      }
    });

    const json = await resp.json();

    if (json.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }

    if (json.data.orderEditAddVariant.userErrors?.length) {
      throw new Error(
        `Add variant failed: ${JSON.stringify(json.data.orderEditAddVariant.userErrors)}`
      );
    }

    const addedLineItemId =
      json.data.orderEditAddVariant.calculatedOrder?.addedLineItems?.nodes?.[0]?.id;

    if (!addedLineItemId) {
      console.warn("⚠️ No line item ID returned after adding variant");
    }

    console.log("📦 Replacement variant added");
    console.log("✅ Added Line Item ID:", addedLineItemId);

    return addedLineItemId;

  } catch (error) {
    console.error("❌ Error in addReplacementVariant:", error.message);
    throw error;
  }
}

/**
 * Apply a discount to a specific line item
 * @param {Object} admin - Shopify admin GraphQL client
 * @param {String} calcOrderId - Calculated order ID
 * @param {String} lineItemId - Line item ID to apply discount to
 * @param {Number} discountPercent - Discount percentage to apply
 */
export async function applyDiscountToLineItem(admin, calcOrderId, lineItemId, discountPercent) {
  try {
    const resp = await admin.graphql(apply_discount_add_varient, {
      variables: {
        id: calcOrderId,
        lineItemId,
        discount: {
          percentValue: discountPercent,
          description: "Adjusted to match subscription price"
        }
      }
    });

    const json = await resp.json();

    if (json.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }

    if (json.data?.orderEditAddLineItemDiscount?.userErrors?.length) {
      throw new Error(
        `Apply discount failed: ${JSON.stringify(json.data.orderEditAddLineItemDiscount.userErrors)}`
      );
    }

    console.log(`💰 Discount of ${discountPercent.toFixed(2)}% applied to line item`);

  } catch (error) {
    console.error("❌ Error in applyDiscountToLineItem:", error.message);
    throw error;
  }
}

/**
 * Commit the order edit
 * @param {Object} admin - Shopify admin GraphQL client
 * @param {String} calcOrderId - Calculated order ID
 */
export async function commitOrderEdit(admin, calcOrderId) {
  try {
    const resp = await admin.graphql(ORDER_EDIT_COMMIT, {
      variables: {
        id: calcOrderId,
        notifyCustomer: true,
        staffNote: "Subscription replaced automatically via webhook"
      }
    });

    const json = await resp.json();

    if (json.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
    }

    if (json.data?.orderEditCommit?.userErrors?.length) {
      throw new Error(
        `Commit failed: ${JSON.stringify(json.data.orderEditCommit.userErrors)}`
      );
    }

    console.log("✅ Order edit committed successfully");

  } catch (error) {
    console.error("❌ Error in commitOrderEdit:", error.message);
    throw error;
  }
}
