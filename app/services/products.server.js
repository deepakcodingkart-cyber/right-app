import { authenticate } from "../shopify.server";
import { json, redirect } from "@remix-run/node";

// const API_VERSION = "2025-07";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  // Read page_info from query params
  const urlObj = new URL(request.url);
  const cursor = urlObj.searchParams.get("cursor");
  const limit = 5;

  // GraphQL query for products with pagination
  const GET_PRODUCTS = `
    query getProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        edges {
          cursor
          node {
            id
            title
            handle
            status
            productType
            vendor
            totalVariants
            featuredImage {
              url
              altText
            }
            variants(first: 10) {
              edges {
                node {
                  inventoryQuantity
                  price
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `;


  try {
    const response = await admin.graphql(GET_PRODUCTS, {
      variables: {
        first: limit,
        after: cursor || null
      }
    });

    const data = await response.json();

    if (data.errors) {
      throw new Response("Failed to fetch products", { status: 400 });
    }

    const products = data.data.products.edges.map(edge => ({
      id: edge.node.id.replace('gid://shopify/Product/', ''),
      title: edge.node.title,
      handle: edge.node.handle,
      status: edge.node.status,
      product_type: edge.node.productType,
      vendor: edge.node.vendor,
      image: edge.node.featuredImage ? {
        src: edge.node.featuredImage.url,
        alt: edge.node.featuredImage.altText
      } : null,
      variants: edge.node.variants.edges.map(variantEdge => ({
        inventory_quantity: variantEdge.node.inventoryQuantity,
        price: variantEdge.node.price
      }))
    }));

    return json({
      products,
      pageInfo: data.data.products.pageInfo
    });

  } catch (error) {
    throw new Response("Failed to fetch products", { status: 500 });
  }
};

// export async function action({ request }) {
//   const { admin } = await authenticate.admin(request);
//   const formData = await request.formData();

//   // Delete action
//   if (formData.get("_action") === "delete") {
//     const ids = formData.getAll("deleteIds");
    
//     for (const id of ids) {
//       const DELETE_PRODUCT = `
//         mutation productDelete($input: ProductDeleteInput!) {
//           productDelete(input: $input) {
//             deletedProductId
//             userErrors {
//               field
//               message
//             }
//           }
//         }
//       `;

//       try {
//         await admin.graphql(DELETE_PRODUCT, {
//           variables: {
//             input: {
//               id: `gid://shopify/Product/${id}`
//             }
//           }
//         });
//       } catch (error) {
//         console.error(`Failed to delete product ${id}:`, error);
//       }
//     }
    
//     return redirect("/products");
//   }

//   // Create product action (if you uncomment the modal later)
//   if (formData.get("_action") === "create") {
//     const title = formData.get("title");
//     const vendor = formData.get("vendor");
//     const price = formData.get("price");
//     const productType = formData.get("product_type");
//     const optionName = formData.get("option_name");
//     const optionValues = formData.get("option_values")?.split(',').map(v => v.trim()).filter(v => v);

//     const CREATE_PRODUCT = `
//       mutation productCreate($input: ProductInput!) {
//         productCreate(input: $input) {
//           product {
//             id
//             title
//           }
//           userErrors {
//             field
//             message
//           }
//         }
//       }
//     `;

//     const productInput = {
//       title: title,
//       vendor: vendor,
//       productType: productType,
//       status: 'ACTIVE',
//       descriptionHtml: "<strong>Created from Remix app</strong>",
//     };

//     // Add variants based on options
//     if (optionName && optionValues && optionValues.length > 0) {
//       productInput.options = [optionName];
//       productInput.variants = optionValues.map((value) => ({
//         price: price || "0.00",
//         selectedOptions: [
//           {
//             name: optionName,
//             value: value
//           }
//         ],
//         inventoryQuantities: [
//           {
//             availableQuantity: 0,
//             locationId: "gid://shopify/Location/1"
//           }
//         ]
//       }));
//     } else if (price) {
//       // Simple variant without options
//       productInput.variants = [
//         {
//           price: price,
//           inventoryQuantities: [
//             {
//               availableQuantity: 0,
//               locationId: "gid://shopify/Location/1"
//             }
//           ]
//         }
//       ];
//     }

//     try {
//       const response = await admin.graphql(CREATE_PRODUCT, {
//         variables: {
//           input: productInput
//         }
//       });

//       const result = await response.json();

//       if (result.data.productCreate.userErrors.length > 0) {
//         throw new Response(
//           `Failed to create product: ${result.data.productCreate.userErrors[0].message}`,
//           { status: 400 }
//         );
//       }

//       return redirect("/products");

//     } catch (error) {
//       throw new Response("Failed to create product", { status: 500 });
//     }
//   }

//   return json({ error: "Unknown action" }, { status: 400 });
// }



export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  if (formData.get("_action") !== "create") {
    return json({ error: "Unknown action" }, { status: 400 });
  }

  const title = formData.get("title") || "Untitled Product";
  const vendor = formData.get("vendor") || "Default Vendor";
  const price = formData.get("price") || "0.00";
  const productType = formData.get("product_type") || "Default Type";

  // Support multiple options separated by commas
  const optionNames = formData.get("option_name")
    ?.split(",")
    .map((v) => v.trim())
    .filter((v) => v) || [];

  // Option values: multiple options separated by ';', values separated by ','
  const optionValuesRaw = formData.get("option_values")?.split(";") || [];
  const optionValues = optionValuesRaw.map((v) =>
    v.split(",").map((val) => val.trim()).filter((v) => v)
  );

  // 1️⃣ Create base product
  const CREATE_PRODUCT = `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product { id title }
        userErrors { field message }
      }
    }
  `;

  const productInput = {
    title,
    vendor,
    productType,
    status: "ACTIVE",
    descriptionHtml: "<strong>Created from Remix app</strong>",
  };

  try {
    const productResponse = await admin.graphql(CREATE_PRODUCT, {
      variables: { input: productInput },
    });

    if (productResponse.productCreate.userErrors.length > 0) {
      return json(
        { error: productResponse.productCreate.userErrors[0].message },
        { status: 400 }
      );
    }

    const productId = productResponse.productCreate.product.id;

    // 2️⃣ Generate variants dynamically
    const variants = [];
    if (optionNames.length && optionValues.length) {
      const generateVariants = (options, values, current = {}, depth = 0) => {
        if (depth === options.length) {
          variants.push({
            price,
            selectedOptions: Object.keys(current).map((key) => ({
              name: key,
              value: current[key],
            })),
          });
          return;
        }
        for (const val of values[depth]) {
          current[options[depth]] = val;
          generateVariants(options, values, current, depth + 1);
        }
      };
      generateVariants(optionNames, optionValues);
    } else {
      variants.push({ price }); // single variant
    }

    // 3️⃣ Add product options
    const optionsArray = optionNames.map((name, idx) => ({
      name,
      values: optionValues[idx] || [],
    }));

    // Update product to add options
    if (optionsArray.length) {
      const UPDATE_PRODUCT_OPTIONS = `
        mutation productUpdate($id: ID!, $options: [ProductOptionInput!]!) {
          productUpdate(input: {id: $id, options: $options}) {
            product { id title options { name values } }
            userErrors { field message }
          }
        }
      `;
      const updateResponse = await admin.graphql(UPDATE_PRODUCT_OPTIONS, {
        variables: { id: productId, options: optionsArray },
      });

      if (updateResponse.productUpdate.userErrors.length > 0) {
        return json(
          { error: updateResponse.productUpdate.userErrors[0].message },
          { status: 400 }
        );
      }
    }

    // 4️⃣ Add variants using bulk create
    if (variants.length) {
      const ADD_VARIANTS = `
        mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantInput!]!) {
          productVariantsBulkCreate(productId: $productId, variants: $variants) {
            productVariants { id title price selectedOptions { name value } }
            userErrors { field message }
          }
        }
      `;
      const variantResponse = await admin.graphql(ADD_VARIANTS, {
        variables: { productId, variants },
      });

      if (variantResponse.productVariantsBulkCreate.userErrors.length > 0) {
        return json(
          { error: variantResponse.productVariantsBulkCreate.userErrors[0].message },
          { status: 400 }
        );
      }
    }

    return redirect("/products");
  } catch (err) {
    return json({ error: err.message }, { status: 500 });
  }
}
