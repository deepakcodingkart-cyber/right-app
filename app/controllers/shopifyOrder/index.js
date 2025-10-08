import ShopifyOrderService from "../../services/shopifyorder/index.js";
import { pickReplacementVariant } from "../../utils/pickReplacementVariant.js";
import { AppError, handleError } from "../../utils/errorHandler.js";
import prisma from "../../db.server.js"; // prisma client import

export async function handleOrderWebhook(payload, admin) {
  try {
    console.log("🔄 Controller: Received replacement request");

    const subscriptionLineItems = (payload?.line_items || []).filter(li => {
      const propertyNames = (li?.properties || []).map(p => p.name?.toLowerCase());
      return (
        propertyNames.includes("subscription") ||
        li?.title?.toLowerCase().includes("subscription") ||
        li?.name?.toLowerCase().includes("subscription") ||
        li?.variant_title?.toLowerCase().includes("subscription")
      );
    });

    if (!subscriptionLineItems.length) {
      console.log("ℹ️ No subscription items found - nothing to do");
      return { success: true, message: "No subscription items to replace" };
    }

    const dummyLog = await prisma.order_subscription_log.create({
      data: {
        order_id: payload?.admin_graphql_api_id,
        status: "SUCCESS",
        step: "Found_subscription_product",
        payload: payload
      }
    });

    console.log("✅ Database log created:", {
      id: dummyLog.id,
      order_id: dummyLog.order_id,
      status: dummyLog.status,
      step: dummyLog.step
    });

    const orderService = new ShopifyOrderService();

    // Begin order edit
    const { calcOrder, calcOrderId } = await orderService.beginOrderEdit(
      admin,
      payload.admin_graphql_api_id
    );

    // Fetch replacement products
    const products = await orderService.fetchReplacementProducts(admin);

    // Pick suitable replacement
    const replacementVariant = pickReplacementVariant(subscriptionLineItems, products);
    if (!replacementVariant)
      throw new AppError("No suitable replacement variant found", {
        layer: "CONTROLLER",
        context: { subscriptionLineItems },
      });

    // Remove old subscription items
    await orderService.removeSubscriptionItems(admin, calcOrderId, calcOrder, subscriptionLineItems);

    // Add replacement variant
    const addedLineItemId = await orderService.addReplacementVariant(admin, calcOrderId, replacementVariant);

    // Calculate discount
    const discountPercent = orderService.calculateDiscountPercent(
      subscriptionLineItems[0].price,
      replacementVariant.price
    );

    if (discountPercent > 0) {
      await orderService.applyDiscountToLineItem(admin, calcOrderId, addedLineItemId, discountPercent);
    }

    // Commit order edit
    await orderService.commitOrderEdit(admin, calcOrderId);

    return { success: true, replacementVariantId: replacementVariant.id };

  } catch (err) {
    handleError(err); // Centralized logging
    return { success: false, error: err.message };
  }
}
