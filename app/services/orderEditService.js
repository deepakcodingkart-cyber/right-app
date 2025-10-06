import {
  ORDER_EDIT_BEGIN,
  ORDER_EDIT_SET_QUANTITY,
  ORDER_EDIT_ADD_VARIANT,
  ORDER_EDIT_COMMIT
} from "../shopifyQueryOrMutaion/order.js";
import { apply_discount_add_varient } from "../shopifyQueryOrMutaion/discount.js";

// Pick replacement variant
export function pickReplacementVariant(subscriptionLineItems, products) {
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

export async function beginOrderEdit(admin, orderId) {
  const resp = await admin.graphql(ORDER_EDIT_BEGIN, { variables: { id: orderId } });
  const json = await resp.json();
  const calcOrder = json.data?.orderEditBegin?.calculatedOrder;
  const calcOrderId = calcOrder?.id;
  if (!calcOrderId) throw new Error("Failed to begin order edit");
  return { calcOrder, calcOrderId };
}

export async function removeSubscriptionItems(admin, calcOrderId, calcOrder, subscriptionLineItems) {
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

export async function addReplacementVariant(admin, calcOrderId, replacementVariant) {
  const resp = await admin.graphql(ORDER_EDIT_ADD_VARIANT, {
    variables: { id: calcOrderId, variantId: replacementVariant.id, quantity: 1 }
  });
  const json = await resp.json();

  if (json.data.orderEditAddVariant.userErrors?.length) {
    throw new Error(`Add variant failed: ${JSON.stringify(json.data.orderEditAddVariant.userErrors)}`);
  }

  const addedLineItemId =
    json.data.orderEditAddVariant.calculatedOrder?.addedLineItems?.nodes?.[0]?.id;

  console.log("📦 Replacement variant response:", JSON.stringify(json.data.orderEditAddVariant.calculatedOrder, null, 2));
  console.log("✅ Added Line Item ID:", addedLineItemId);

  return addedLineItemId;
}

export async function applyDiscount(admin, calcOrderId, lineItemId, discountPercent) {
  await admin.graphql(apply_discount_add_varient, {
    variables: {
      id: calcOrderId,
      lineItemId,
      discount: {
        percentValue: discountPercent,
        description: "Adjusted to match subscription price"
      }
    }
  });
}


export async function commitOrderEdit(admin, calcOrderId) {
  await admin.graphql(ORDER_EDIT_COMMIT, {
    variables: { id: calcOrderId, notifyCustomer: true, staffNote: "Subscription replaced automatically via webhook" }
  });
}
