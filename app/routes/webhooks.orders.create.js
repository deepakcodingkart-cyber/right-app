import { authenticate } from "../shopify.server.js";
import { GET_PRODUCTS } from "../shopifyQueryOrMutaion/product.js";
import {
  ORDER_EDIT_BEGIN,
  ORDER_EDIT_SET_QUANTITY,
  ORDER_EDIT_ADD_VARIANT,
  ORDER_EDIT_COMMIT
} from "../shopifyQueryOrMutaion/order.js";

// ✅ 1️⃣ Pick replacement variant
function pickReplacementVariant(subscriptionLineItems, products) {
  if (!subscriptionLineItems?.length || !products?.length) return null;

  const firstItem = subscriptionLineItems[0];
  let extractedSize = null;
  let extractedTaste = null;

  if (firstItem.variant_options?.length) {
    firstItem.variant_options.forEach(opt => {
      const lower = opt.toLowerCase();
      if (/\d+\s?(g|gram|kg|ml)/.test(lower)) extractedSize = lower;
      if (/light|medium|dark/.test(lower)) extractedTaste = lower;
    });
  } else if (firstItem.variant_title) {
    const lowerTitle = firstItem.variant_title.toLowerCase();
    const sizeMatch = lowerTitle.match(/(\d+\s?(g|gram|kg|ml))/);
    if (sizeMatch) extractedSize = sizeMatch[0];
    const tasteMatch = lowerTitle.match(/(light|medium|dark)\s*roast/);
    if (tasteMatch) extractedTaste = tasteMatch[0];
  }

  let replacementVariant = null;
  outer: for (const product of products) {
    for (const variant of product.variants.nodes) {
      const opts = (variant.selectedOptions || []).reduce((acc, o) => {
        acc[o.name.toLowerCase().trim()] = o.value.toLowerCase().trim();
        return acc;
      }, {});

      const isSubscription =
        (variant.title || "").toLowerCase().includes("subscription") ||
        (product.title || "").toLowerCase().includes("subscription");
      if (isSubscription) continue;

      const sizeMatch = (opts.size || "").includes(extractedSize) || (variant.title || "").toLowerCase().includes(extractedSize);
      const tasteMatch = (opts.taste || "").includes(extractedTaste) || (variant.title || "").toLowerCase().includes(extractedTaste);

      if (sizeMatch && tasteMatch) {
        replacementVariant = variant;
        break outer;
      }
    }
  }

  return replacementVariant;
}

// ✅ 2️⃣ Begin order edit
async function beginOrderEdit(admin, orderId) {
  const resp = await admin.graphql(ORDER_EDIT_BEGIN, { variables: { id: orderId } });
  const json = await resp.json();
  const calcOrder = json.data?.orderEditBegin?.calculatedOrder;
  const calcOrderId = calcOrder?.id;
  if (!calcOrderId) throw new Error("Failed to begin order edit");
  return { calcOrder, calcOrderId };
}

// ✅ 3️⃣ Remove subscription items
async function removeSubscriptionItems(admin, calcOrderId, calcOrder, subscriptionLineItems) {
  for (const subItem of subscriptionLineItems) {
    const targetItem = calcOrder.lineItems.nodes.find(
      li => li.variant?.id?.split("/").pop() === String(subItem.variant_id)
    );
    if (!targetItem) continue;

    await admin.graphql(ORDER_EDIT_SET_QUANTITY, {
      variables: { id: calcOrderId, lineItemId: targetItem.id, quantity: 0 }
    });
  }
}

// ✅ 4️⃣ Add replacement variant
async function addReplacementVariant(admin, calcOrderId, replacementVariant) {
  await admin.graphql(ORDER_EDIT_ADD_VARIANT, {
    variables: { id: calcOrderId, variantId: replacementVariant.id, quantity: 1 }
  });
}

// ✅ 5️⃣ Commit order edit
async function commitOrderEdit(admin, calcOrderId) {
  await admin.graphql(ORDER_EDIT_COMMIT, {
    variables: { id: calcOrderId, notifyCustomer: true, staffNote: "Subscription replaced automatically via webhook" }
  });
}

// check the discount percentage
function calculateDiscount(lineItemPrice, replacementPrice) {
  console.log("lineItemPrice",lineItemPrice)
  console.log("replacementPrice",replacementPrice)
  // Calculate discount percentage
  const discountAmount = replacementPrice - lineItemPrice;
  const discountPercentage = (discountAmount / replacementPrice) * 100;
  
  return discountPercentage;
}


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

    const discountApply = calculateDiscount(subscriptionLineItems[0].price, replacementVariant.price)
    console.log("discountApply",discountApply)

    const { calcOrder, calcOrderId } = await beginOrderEdit(admin, payload.admin_graphql_api_id);
    console.log("step1")
    await removeSubscriptionItems(admin, calcOrderId, calcOrder, subscriptionLineItems);
    console.log("step2")
    await addReplacementVariant(admin, calcOrderId, replacementVariant);
    console.log("step3")
    await commitOrderEdit(admin, calcOrderId);
    console.log("Subscription items replaced successfully");

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook failed:", err.message);
    return new Response("ok", { status: 200 });
  }
};
