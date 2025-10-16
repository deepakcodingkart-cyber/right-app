// app/utils/fetchCustomers.server.js
import { callShopifyGraphQL } from './shopifyGraphQL.js';

export async function fetchCustomersFromAPI(shop, accessToken, first = 10, after = null) {
  const query = `
    query GetCustomers($first: Int!, $after: String) {
      customers(first: $first, after: $after) {
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
            firstName
            lastName
            email
          }
        }
      }
    }
  `;

  const result = await callShopifyGraphQL(shop, accessToken, query, { first, after });
  console.log(result.data.customers.edges.map(edge => edge.node));
  return result.data.customers.edges.map(edge => edge.node);
}