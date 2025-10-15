// app/utils/fetchProduct.server.js
import { callShopifyGraphQL } from './shopifyGraphQL.js';

export async function fetchProductsFromAPI(shop, accessToken, first = 5, after = null) {
  const query = `
    query GetProductsWithVariants($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          hasPreviousPage
          endCursor
          startCursor
        }
        edges {
          cursor
          node {
            id
            title
            description
            featuredImage {
              url
              altText
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  inventoryQuantity
                  price
                  compareAtPrice
                }
              }
            }
          }
        }
      }
    }
  `;

  const result = await callShopifyGraphQL(shop, accessToken, query, { first, after });
  return transformProductsData(result.data.products);
}

function transformProductsData(productsData) {
  return productsData.edges.map(edge => {
    const product = edge.node;
    return {
      id: product.id,
      title: product.title,
      image: product.featuredImage?.url || 'https://placehold.co/40x40/CCCCCC/ffffff?text=No+Image',
      variants: product.variants.edges.map(variantEdge => {
        const variant = variantEdge.node;
        return {
          id: variant.id,
          title: variant.title,
          available: variant.inventoryQuantity || 0,
          price: `₹${parseFloat(variant.price).toFixed(2)} INR`
        };
      })
    };
  });
}