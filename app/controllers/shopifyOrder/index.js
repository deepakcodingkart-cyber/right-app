import ShopifyOrderService from "../../services/shopifyorder/index.js";
import { pickReplacementVariant } from "../../utils/pickReplacementVariant.js";
import { AppError, handleError } from "../../utils/errorHandler.js";
import { createRecord, updateRecord } from "../../utils/dbservice.js";

/**
 * Handles Shopify order webhook for subscription replacements.
 * @param {Object} payload - Shopify webhook payload (order data)
 * @param {Object} admin - Admin/shop context for Shopify API calls
 * @returns {Promise<Object>} Result object with success/failure info
 */


export async function handleOrderWebhook(payload, admin) {
  let logRecord = null;          // Will hold DB log entry
  let currentStep = "WEBHOOK_RECEIVED";  // Track current processing step for logging

  try {
    console.log("🔄 Controller: Received replacement request");

    // ✅ Step 1: Check for subscription items in the order
    currentStep = "CHECK_SUBSCRIPTION";
    const subscriptionLineItems = (payload?.line_items || []).filter(li => {
      const propertyNames = (li?.properties || []).map(p => p.name?.toLowerCase());
      return (
        propertyNames.includes("subscription") ||
        li?.title?.toLowerCase().includes("subscription") ||
        li?.name?.toLowerCase().includes("subscription") ||
        li?.variant_title?.toLowerCase().includes("subscription")
      );
    });

    // If no subscription items, exit early
    if (!subscriptionLineItems.length) {
      console.log("ℹ️ No subscription items found - nothing to do");
      // return { success: true, message: "No subscription items to replace" };
      return
    }

    // ✅ Step 2: Create initial DB log entry for tracking
    logRecord = await createRecord("order_subscription_log", {
      order_id: payload?.admin_graphql_api_id,
      status: "SUCCESS",   // assume success until proven failed
      step: currentStep,
      payload
    });

    const orderService = new ShopifyOrderService();

    // ✅ Step 3: Begin order edit in Shopify
    currentStep = "BEGIN_ORDER_EDIT";
    const { calcOrder, calcOrderId } = await orderService.beginOrderEdit(
      admin,
      payload.admin_graphql_api_id
    );

    // ✅ Step 4: Fetch available replacement products
    currentStep = "FETCH_PRODUCTS";
    const products = await orderService.fetchReplacementProducts(admin);

    // ✅ Step 5: Pick the most suitable replacement variant
    currentStep = "PICK_REPLACEMENT";
    const replacementVariant = pickReplacementVariant(subscriptionLineItems, products);
    if (!replacementVariant)
      throw new AppError("No suitable replacement variant found", {
        layer: "CONTROLLER",
        context: { subscriptionLineItems },
      });

    // ✅ Step 6: Remove original subscription items from order
    currentStep = "REMOVE_SUBSCRIPTION";
    await orderService.removeSubscriptionItems(admin, calcOrderId, calcOrder, subscriptionLineItems);

    // ✅ Step 7: Add replacement variant to order
    currentStep = "ADD_REPLACEMENT";
    const addedLineItemId = await orderService.addReplacementVariant(admin, calcOrderId, replacementVariant);

    // ✅ Step 8: Apply discount if replacement is cheaper than subscription item
    currentStep = "APPLY_DISCOUNT";
    const discountPercent = orderService.calculateDiscountPercent(
      subscriptionLineItems[0].price,
      replacementVariant.price
    );
    if (discountPercent > 0) {
      await orderService.applyDiscountToLineItem(admin, calcOrderId, addedLineItemId, discountPercent);
    }

    // ✅ Step 9: Commit order edit to Shopify
    currentStep = "COMMIT_ORDER_EDIT";
    await orderService.commitOrderEdit(admin, calcOrderId);

    // ✅ Step 10: Return success response
    // return { success: true, replacementVariantId: replacementVariant.id };

  } catch (err) {
    // Handle errors globally
    handleError(err);

    // Update log in DB to indicate failure
    if (logRecord) {
      await updateRecord("order_subscription_log", logRecord.id, {
        status: "FAIL",
        step: currentStep
      });
    }

    // // Return failure response
    // return { success: false, error: err.message, failedStep: currentStep };
  }
}
