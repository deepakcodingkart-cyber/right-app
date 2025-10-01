
// // app/routes/api.product.$productId.js
// import { json } from "@remix-run/node";
// import { sessionStorage } from "../shopify.server";
// import { withCors } from "../utils/cors";

// const API_VERSION = "2025-07";
// const SHOP = "shop-with-liquid-dashboard.myshopify.com";

// export const loader = async ({ request, params }) => {
//   try {
//     const productId = params?.variantId;
//     if (!productId) {
//       return withCors(
//         request,
//         json({ success: false, error: "Product ID missing" }, { status: 400 })
//       );
//     }

//     // Get sessions for the shop
//     const sessions = await sessionStorage.findSessionsByShop(SHOP);
//     if (!sessions || sessions.length === 0) {
//       return withCors(
//         request,
//         json({ success: false, error: "No sessions found for this shop" }, { status: 404 })
//       );
//     }

//     const shop = sessions[0].shop;
//     const accessToken = sessions[0].accessToken;

//     // GraphQL query - only basic fields
//     const query = `
//       query getProduct($id: ID!) {
//         product(id: $id) {
//           id
//           title
//           handle
//           productType
//           tags
//         }
//       }
//     `;

//     const productGid = `gid://shopify/Product/${productId}`;

//     const res = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
//       method: "POST",
//       headers: {
//         "X-Shopify-Access-Token": accessToken,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ query, variables: { id: productGid } }),
//     });

//     if (!res.ok) {
//       throw new Error(`Shopify GraphQL API error: ${res.status}`);
//     }

//     const result = await res.json();

//     if (result.errors) {
//       throw new Error(JSON.stringify(result.errors));
//     }
    
//     return withCors(
//       request,
//       json({
//         success: true,
//         product: result.data.product,
//       })
//     );
//   } catch (err) {
//     console.error("💥 Loader error:", err);
//     return withCors(
//       request,
//       json({ success: false, error: err.message }, { status: 500 })
//     );
//   }
// };
