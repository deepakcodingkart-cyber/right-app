export const GET_PRODUCTS = `
  query ProductsByTag($query: String!) {
    products(first: 10, query: $query) {
      nodes {
        id
        title
        tags
        variants(first: 50) {
          nodes {
            id
            title
            sku
            price 
            availableForSale
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  }
`;