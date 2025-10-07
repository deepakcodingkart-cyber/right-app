// app/services/order/index.js
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

class ShopifyOrderService {
  constructor() {
    this.productService = new ShopifyProductService();
  }

  async fetchReplacementProducts(admin) {
    try {
      return this.productService.fetchReplacementProducts(admin);
    } catch (err) {
      throw new AppError("Failed to fetch replacement products", {
        layer: "SERVICE",
        originalError: err,
      });
    }
  }

  async beginOrderEdit(admin, orderId) {
    try {
      const resp = await admin.graphql(ORDER_EDIT_BEGIN, { variables: { id: orderId } });
      const json = await resp.json();
      if (json.errors) throw new Error(JSON.stringify(json.errors));

      const calcOrder = json.data?.orderEditBegin?.calculatedOrder;
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

  async removeSubscriptionItems(admin, calcOrderId, calcOrder, subscriptionLineItems) {
    try {
      for (const subItem of subscriptionLineItems) {
        const targetItem = calcOrder.lineItems.nodes.find(
          (li) => li.variant?.id?.split("/").pop() === String(subItem.variant_id)
        );
        if (!targetItem) {
          console.warn(`⚠️ Could not find line item for variant ${subItem.variant_id}`);
          continue;
        }

        console.log(`🗑️ Removing line item: ${targetItem.id}`);
        const resp = await admin.graphql(ORDER_EDIT_SET_QUANTITY, {
          variables: { id: calcOrderId, lineItemId: targetItem.id, quantity: 0 },
        });

        const json = await resp.json();
        if (json.errors || json.data?.orderEditSetQuantity?.userErrors?.length) {
          const errors = json.errors || json.data.orderEditSetQuantity.userErrors;
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

  async addReplacementVariant(admin, calcOrderId, replacementVariant) {
    try {
      const resp = await admin.graphql(ORDER_EDIT_ADD_VARIANT, {
        variables: { id: calcOrderId, variantId: replacementVariant.id, quantity: 1 },
      });
      const json = await resp.json();
      if (json.errors) throw new Error(JSON.stringify(json.errors));
      if (json.data.orderEditAddVariant.userErrors?.length) {
        throw new Error(JSON.stringify(json.data.orderEditAddVariant.userErrors));
      }

      const addedLineItemId =
        json.data.orderEditAddVariant.calculatedOrder?.addedLineItems?.nodes?.[0]?.id;

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

  calculateDiscountPercent(subscriptionPrice, replacementPrice) {
    return calculateDiscount(subscriptionPrice, replacementPrice);
  }

  async applyDiscountToLineItem(admin, calcOrderId, lineItemId, discountPercent) {
    try {
      const resp = await admin.graphql(apply_discount_add_varient, {
        variables: {
          id: calcOrderId,
          lineItemId,
          discount: {
            percentValue: discountPercent,
            description: "Adjusted to match subscription price",
          },
        },
      });

      const json = await resp.json();
      if (json.errors) throw new Error(JSON.stringify(json.errors));
      if (json.data?.orderEditAddLineItemDiscount?.userErrors?.length) {
        throw new Error(JSON.stringify(json.data.orderEditAddLineItemDiscount.userErrors));
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

  async commitOrderEdit(admin, calcOrderId) {
    try {
      const resp = await admin.graphql(ORDER_EDIT_COMMIT, {
        variables: {
          id: calcOrderId,
          notifyCustomer: true,
          staffNote: "Subscription replaced automatically via webhook",
        },
      });

      const json = await resp.json();
      if (json.errors) throw new Error(JSON.stringify(json.errors));
      if (json.data?.orderEditCommit?.userErrors?.length) {
        throw new Error(JSON.stringify(json.data.orderEditCommit.userErrors));
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
