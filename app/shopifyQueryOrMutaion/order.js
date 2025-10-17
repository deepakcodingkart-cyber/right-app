// 🔹 GraphQL Queries
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

// 🔹 Order Edit Mutations
export const ORDER_EDIT_BEGIN = `
  mutation orderEditBegin($id: ID!) {
    orderEditBegin(id: $id) {
      calculatedOrder {
        id
        lineItems(first: 50) {
          nodes {
            id
            title
            quantity
            variant { id }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

export const ORDER_EDIT_SET_QUANTITY = `

  mutation orderEditSetQuantity($id: ID!, $lineItemId: ID!, $quantity: Int!) {
    orderEditSetQuantity(id: $id, lineItemId: $lineItemId, quantity: $quantity) {
      calculatedOrder {
        id
        lineItems(first: 50) {
          nodes {
            id
            title
            quantity
            variant { id }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

export const ORDER_EDIT_ADD_VARIANT = `
  mutation orderEditAddVariant($id: ID!, $variantId: ID!, $quantity: Int!) {
    orderEditAddVariant(id: $id, variantId: $variantId, quantity: $quantity) {
      calculatedOrder {
        id
        addedLineItems(first: 10) {
          nodes { id title quantity }
        }
      }
      userErrors { field message }
    }
  }
`;

export const ORDER_EDIT_COMMIT = `
  mutation orderEditCommit($id: ID!, $notifyCustomer: Boolean!, $staffNote: String) {
    orderEditCommit(id: $id, notifyCustomer: $notifyCustomer, staffNote: $staffNote) {
      order {
        id
        name
        lineItems(first: 50) {
          nodes {
            id
            title
            quantity
            variant { id }
          }
        }
      }
      userErrors { field message }
    }
  }
`;
