// app/controllers/order/index.js
import ShopifyOrderService from "../../services/shopifyorder/index.js";
import { pickReplacementVariant } from "../../utils/pickReplacementVariant.js";

/**
* Controller-level orchestration. This file contains the core flow and calls
* low-level GraphQL operations through ShopifyOrderService.
*/

class ShopifyOrderController {
    async handleOrderWebhook(payload, admin) {
        console.log("🔄 Controller: Received replacement request");

        console.log("Order payload ", JSON.stringify(payload, null, 2));

        const subscriptionLineItems = (payload?.line_items || []).filter(li => {
            const propertyNames = (li?.properties || []).map(p => p.name?.toLowerCase());
            return (
                propertyNames.includes("subscription") ||
                li?.title?.toLowerCase().includes("subscription") ||
                li?.name?.toLowerCase().includes("subscription") ||
                li?.varient_title?.toLowerCase().includes("subscription") 
            );
        });


        if (!subscriptionLineItems.length) {
            console.log("ℹ️ No subscription items found - nothing to do");
            return { success: true, message: "No subscription items to replace" };
        }

        const orderService = new ShopifyOrderService();

        const { calcOrder, calcOrderId } = await orderService.beginOrderEdit(
            admin,
            payload.admin_graphql_api_id
        );

        const products = await orderService.fetchReplacementProducts(admin);

        const replacementVariant = pickReplacementVariant(subscriptionLineItems, products);
        if (!replacementVariant) throw new Error("No suitable replacement variant found");

        await orderService.removeSubscriptionItems(admin, calcOrderId, calcOrder, subscriptionLineItems);

        const addedLineItemId = await orderService.addReplacementVariant(
            admin,
            calcOrderId,
            replacementVariant
        );

        const discountPercent = orderService.calculateDiscountPercent(
            subscriptionLineItems[0].price,
            replacementVariant.price
        );

        if (discountPercent > 0) {
            await orderService.applyDiscountToLineItem(admin, calcOrderId, addedLineItemId, discountPercent);
        }

        await orderService.commitOrderEdit(admin, calcOrderId);

        return { success: true, replacementVariantId: replacementVariant.id };
    }
}

export default ShopifyOrderController;