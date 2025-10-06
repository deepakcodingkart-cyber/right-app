import { authenticate } from "../shopify.server.js";
import { GET_PRODUCTS } from "../shopifyQueryOrMutaion/product.js";
import { calculateDiscount } from "../utils/discountCalculator.js";
import {
  pickReplacementVariant, beginOrderEdit, removeSubscriptionItems, addReplacementVariant,
  commitOrderEdit, applyDiscount
} from "../services/orderEditService.js";


// ✅ Main action function
export const action = async ({ request }) => {
  try {
    const { payload, admin } = await authenticate.webhook(request);
    if (!admin) throw new Error("Admin authentication failed");

    const subscriptionLineItems = payload.line_items?.filter(li =>
      (li.title || "").toLowerCase().includes("subscription")
    );
    if (!subscriptionLineItems?.length) return new Response("ok", { status: 200 });

    const productResp = await admin.graphql(GET_PRODUCTS, { variables: { query: "tag:currect_coffe" } });
    const productData = await productResp.json();
    const products = productData.data?.products?.nodes || [];

    let replacementVariant = pickReplacementVariant(subscriptionLineItems, products);
    if (!replacementVariant) throw new Error("No suitable replacement variant found");

    const { calcOrder, calcOrderId } = await beginOrderEdit(admin, payload.admin_graphql_api_id);
    console.log("step1")
    await removeSubscriptionItems(admin, calcOrderId, calcOrder, subscriptionLineItems);
    console.log("step2")
    const addedLineItemId = await addReplacementVariant(admin, calcOrderId, replacementVariant);

    console.log("🎯 Final Line Item ID to apply discount:", addedLineItemId);

    const discountPercent = calculateDiscount(subscriptionLineItems[0].price, replacementVariant.price);
    if (discountPercent > 0 && addedLineItemId) {
      console.log(`Applying ${discountPercent}% discount to line item ${addedLineItemId}`);
      await applyDiscount(admin, calcOrderId, addedLineItemId, discountPercent);
      console.log("Discount applied");
    }
    console.log("step3")
    await commitOrderEdit(admin, calcOrderId);
    console.log("Subscription items replaced successfully");

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook failed:", err.message);
    return new Response("ok", { status: 200 });
  }
};
