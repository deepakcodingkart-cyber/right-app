// app/utils/shopifyQueries.js

export function getCustomersQuery() {
  return `
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
}
