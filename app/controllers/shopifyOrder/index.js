import ShopifyOrderService from "../../services/shopifyorder/index.js";
import { pickReplacementVariant } from "../../utils/pickReplacementVariant.js";
import { AppError, handleError } from "../../utils/errorHandler.js";
import { createRecord, updateRecord } from "../../utils/dbservice.js";
import { getAccessToken } from "../../utils/getAccessToken.js";

/**
 * Handles Shopify order webhook for subscription replacements.
 * @param {Object} payload - Shopify webhook payload (order data)
 * @returns {Promise<void>}
 */
export async function handleOrderWebhook(payload) {
  let logRecord = null;
  let currentStep = "WEBHOOK_RECEIVED";

  try {
    console.log("🔄 Controller: Received replacement request");

    // ✅ Step 1: Check for subscription items in the order
    currentStep = "CHECK_SUBSCRIPTION";
    const subscriptionLineItems = (payload?.line_items || []).filter((li) => {
      const propertyNames = (li?.properties || []).map((p) => p.name?.toLowerCase());
      return (
        propertyNames.includes("subscription") ||
        li?.title?.toLowerCase().includes("subscription") ||
        li?.name?.toLowerCase().includes("subscription") ||
        li?.variant_title?.toLowerCase().includes("subscription")
      );
    });

    if (!subscriptionLineItems.length) {
      console.log("ℹ️ No subscription items found - nothing to do");
      return;
    }

    // ✅ Step 2: Create initial DB log entry
    logRecord = await createRecord("order_subscription_log", {
      order_id: payload?.admin_graphql_api_id,
      status: "SUCCESS",
      step: currentStep,
      payload,
    });

    // ✅ Step 3: Get shop info and access token
    const accessToken = await getAccessToken();
    const shop = process.env.SHOP_NAME;

    const orderService = new ShopifyOrderService();

    // ✅ Step 4: Begin order edit
    currentStep = "BEGIN_ORDER_EDIT";
    const { calcOrder, calcOrderId } = await orderService.beginOrderEdit(
      shop,
      accessToken,
      payload.admin_graphql_api_id
    );

    // ✅ Step 5: Fetch available replacement products
    currentStep = "FETCH_PRODUCTS";
    const products = await orderService.fetchReplacementProducts(shop, accessToken);

    // ✅ Step 6: Pick the most suitable replacement variant
    currentStep = "PICK_REPLACEMENT";
    const replacementVariant = pickReplacementVariant(subscriptionLineItems, products);
    if (!replacementVariant)
      throw new AppError("No suitable replacement variant found", {
        layer: "CONTROLLER",
        context: { subscriptionLineItems },
      });

    // ✅ Step 7: Remove original subscription items
    currentStep = "REMOVE_SUBSCRIPTION";
    await orderService.removeSubscriptionItems(
      shop,
      accessToken,
      calcOrderId,
      calcOrder,
      subscriptionLineItems
    );

    // ✅ Step 8: Add replacement variant
    currentStep = "ADD_REPLACEMENT";
    const addedLineItemId = await orderService.addReplacementVariant(
      shop,
      accessToken,
      calcOrderId,
      replacementVariant
    );

    // ✅ Step 9: Apply discount if needed
    currentStep = "APPLY_DISCOUNT";
    const discountPercent = orderService.calculateDiscountPercent(
      subscriptionLineItems[0].price,
      replacementVariant.price
    );
    if (discountPercent > 0) {
      await orderService.applyDiscountToLineItem(
        shop,
        accessToken,
        calcOrderId,
        addedLineItemId,
        discountPercent
      );
    }

    // ✅ Step 10: Commit order edit
    currentStep = "COMMIT_ORDER_EDIT";
    await orderService.commitOrderEdit(shop, accessToken, calcOrderId);

    console.log("✅ Subscription replacement completed successfully");

  } catch (err) {
    handleError(err);

    if (logRecord) {
      await updateRecord("order_subscription_log", logRecord.id, {
        status: "FAIL",
        step: currentStep,
      });
    }
    throw err 
  }
}

// function identifyOrderType(order) {
//   // Check if order has required data
//   if (!order || !order.line_items || order.line_items.length === 0) {
//     return "UNKNOWN";
//   }

//   const source = order.source_name;
//   const quantity = order.line_items[0].quantity;

//   // Normal Order - Web source with client details
//   if (source === "web" && 
//       order.client_details !== null && 
//       order.cart_token !== null && 
//       order.browser_ip !== null) {
//     return "NORMAL_ORDER";
//   }

//   // Subscription Order - subscription_contract source without client data
//   if (source === "subscription_contract" && 
//       order.client_details === null && 
//       order.cart_token === null && 
//       order.browser_ip === null) {
    
//     if (quantity > 3) return "SUBSCRIPTION_PREPAID";
//     if (quantity === 1) return "SUBSCRIPTION_MONTHLY";
//     return "SUBSCRIPTION_OTHER";
//   }

//   return "UNKNOWN";
// }


