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

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  // Delete action
  if (formData.get("_action") === "delete") {
    const ids = formData.getAll("deleteIds");
    
    for (const id of ids) {
      const DELETE_PRODUCT = `
        mutation productDelete($input: ProductDeleteInput!) {
          productDelete(input: $input) {
            deletedProductId
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        await admin.graphql(DELETE_PRODUCT, {
          variables: {
            input: {
              id: `gid://shopify/Product/${id}`
            }
          }
        });
      } catch (error) {
        console.error(`Failed to delete product ${id}:`, error);
      }
    }
    
    return redirect("/products");
  }

  // Create product action (if you uncomment the modal later)
  if (formData.get("_action") === "create") {
    const title = formData.get("title");
    const vendor = formData.get("vendor");
    const price = formData.get("price");
    const productType = formData.get("product_type");
    const optionName = formData.get("option_name");
    const optionValues = formData.get("option_values")?.split(',').map(v => v.trim()).filter(v => v);

    const CREATE_PRODUCT = `
      mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const productInput = {
      title: title,
      vendor: vendor,
      productType: productType,
      status: 'ACTIVE',
      descriptionHtml: "<strong>Created from Remix app</strong>",
    };

    // Add variants based on options
    if (optionName && optionValues && optionValues.length > 0) {
      productInput.options = [optionName];
      productInput.variants = optionValues.map((value) => ({
        price: price || "0.00",
        selectedOptions: [
          {
            name: optionName,
            value: value
          }
        ],
        inventoryQuantities: [
          {
            availableQuantity: 0,
            locationId: "gid://shopify/Location/1"
          }
        ]
      }));
    } else if (price) {
      // Simple variant without options
      productInput.variants = [
        {
          price: price,
          inventoryQuantities: [
            {
              availableQuantity: 0,
              locationId: "gid://shopify/Location/1"
            }
          ]
        }
      ];
    }

    try {
      const response = await admin.graphql(CREATE_PRODUCT, {
        variables: {
          input: productInput
        }
      });

      const result = await response.json();

      if (result.data.productCreate.userErrors.length > 0) {
        throw new Response(
          `Failed to create product: ${result.data.productCreate.userErrors[0].message}`,
          { status: 400 }
        );
      }

      return redirect("/products");

    } catch (error) {
      throw new Response("Failed to create product", { status: 500 });
    }
  }

  return json({ error: "Unknown action" }, { status: 400 });
}