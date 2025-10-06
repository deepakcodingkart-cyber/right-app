import { authenticate } from "../shopify.server.js";
import { GET_PRODUCTS } from "../shopifyQueryOrMutaion/product.js";
import {
  ORDER_EDIT_BEGIN,
  ORDER_EDIT_SET_QUANTITY,
  ORDER_EDIT_ADD_VARIANT,
  ORDER_EDIT_COMMIT
} from "../shopifyQueryOrMutaion/order.js";


function pickReplacementVariant(subscriptionLineItems, products) {
  if (!subscriptionLineItems?.length || !products?.length) return null;

  const firstItem = subscriptionLineItems[0];

  // Extract size and taste dynamically
  let extractedSize = null;
  let extractedTaste = null;

  if (firstItem.variant_options && firstItem.variant_options.length) {
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

  // Find replacement variant dynamically
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


export const action = async ({ request }) => {
  try {
    console.log("🔄 Order creation webhook received...");

    const { payload, admin } = await authenticate.webhook(request);
    if (!admin) throw new Error("❌ Admin authentication failed");

    console.log("📦 Order ID:", payload?.id, "Name:", payload?.name);
      console.log("📦ayload data sff:", JSON.stringify(payload, null, 2));


    // 1️⃣ Find subscription line items
    const subscriptionLineItems = payload.line_items?.filter(
      li => (li.title || "").toLowerCase().includes("subscription")
    );

    console.log("🔍 Subscription line items found:", subscriptionLineItems);

    if (!subscriptionLineItems?.length) {
      console.log("ℹ️ No subscription line items found — nothing to do.");
      return new Response("ok", { status: 200 });
    }

    console.log("✅ Subscription line items found:", subscriptionLineItems.map(li => li.title));

    // 2️⃣ Fetch replacement products
    const productResp = await admin.graphql(GET_PRODUCTS, { variables: { query: "tag:currect_coffe" } });
    const productData = await productResp.json();
    if (productData.errors) throw new Error(JSON.stringify(productData.errors));

    const products = productData.data?.products?.nodes || [];

    // 3️⃣ Pick replacement variant dynamically
    let replacementVariant = pickReplacementVariant(subscriptionLineItems, products);
    console.log("🔍 Replacement variant selected:", replacementVariant ? `${replacementVariant.id} (${replacementVariant.title})` : "None");

    // 3a️⃣ Fallback
    if (!replacementVariant) {
      const fallbackId = "gid://shopify/ProductVariant/42622519443517";
      replacementVariant = { id: fallbackId, title: "Default Coffee Variant" };
      console.log("⚠️ No dynamic variant found, using fallback:", replacementVariant.id);
    }

    // 4️⃣ Begin order edit
    const beginResp = await admin.graphql(ORDER_EDIT_BEGIN, { variables: { id: payload.admin_graphql_api_id } });
    const beginJson = await beginResp.json();
    const calcOrder = beginJson.data?.orderEditBegin?.calculatedOrder;
    const calcOrderId = calcOrder?.id;

    if (!calcOrderId) throw new Error("Failed to begin order edit");

    // 5️⃣ Remove subscription items
    for (const subItem of subscriptionLineItems) {
      console.log("🔍 Removing subscription:", subItem.title);

      const targetItem = calcOrder.lineItems.nodes.find(li => {
        const numericId = li.variant?.id?.split("/").pop();
        console.log("🗑️ Comparing line item variant ID:", numericId, "with subscription variant ID:", subItem.variant_id);
        return numericId === String(subItem.variant_id);
      });
      // console.log("🗑️ Looking for line item with variant ID:", subItem.variant_id);
      // console.log("Numeric Id ")

      if (!targetItem) {
        console.warn("⚠️ Could not find matching line item:", subItem.title);
        continue;
      }

      console.log("🗑️ Target line item found:", calcOrderId ,targetItem.id, targetItem.title);

      const removeResp = await admin.graphql(ORDER_EDIT_SET_QUANTITY, {
        variables: { id: calcOrderId, lineItemId: targetItem.id, quantity: 0 }
      });
      const removeJson = await removeResp.json();
      console.log("➖ Subscription item removal response:", JSON.stringify(removeJson.data.orderEditSetQuantity, null, 2));

      const lineItems = removeJson?.data?.orderEditSetQuantity?.calculatedOrder?.lineItems?.nodes;
      console.log("📦 Updated line items after removal:", JSON.stringify(lineItems, null, 2));


      if (removeJson?.data?.orderEditSetQuantity?.userErrors?.length) {
        console.error("❌ Error removing item:", removeJson.data.orderEditSetQuantity.userErrors);
      } else {
        console.log("✅ Subscription item removed");
      }
    }

    // 6️⃣ Add replacement
    const addResp = await admin.graphql(ORDER_EDIT_ADD_VARIANT, {
      variables: { id: calcOrderId, variantId: replacementVariant.id, quantity: 1 }
    });
    const addJson = await addResp.json();
    if (addJson?.data?.orderEditAddVariant?.userErrors?.length) throw new Error("Failed to add replacement");

    console.log("➕ Replacement variant added");

    // 7️⃣ Commit edit
    const commitResp = await admin.graphql(ORDER_EDIT_COMMIT, {
      variables: { id: calcOrderId, notifyCustomer: true, staffNote: "Subscription replaced automatically via webhook" }
    });
    const commitJson = await commitResp.json();
    if (commitJson?.data?.orderEditCommit?.userErrors?.length) throw new Error("Failed to commit edit");

    console.log("✅ Order edit committed:", commitJson.data.orderEditCommit.order.id);
    return new Response("ok", { status: 200 });

  } catch (err) {
    console.error("❌ Webhook failed:", err.message);
    return new Response("ok", { status: 200 });
  }
};
