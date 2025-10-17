// app/utils/fetchCustomers.server.js
import { callShopifyGraphQL } from './shopifyGraphQL.js';
import { getCustomersQuery } from '../lib/graphql/customer.js'; // new file for queries

export async function fetchCustomersFromAPI(shop, accessToken, first = 10, after = null) {
  // Get the query from another function
  const query = getCustomersQuery();

  const result = await callShopifyGraphQL(shop, accessToken, query, { first, after });
  console.log(result.data.customers.edges.map(edge => edge.node));
  return result.data.customers.edges.map(edge => edge.node);
}
