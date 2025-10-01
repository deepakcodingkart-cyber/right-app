// export const GET_ORDERS_QUERY = `
//   query getOrders($first: Int!) {
//     orders(first: $first, reverse: true) {
//       edges {
//         node {
//           id
//           name
//           email
//           createdAt
//           displayFinancialStatus
//           displayFulfillmentStatus
//           currentSubtotalPriceSet {
//             shopMoney {
//               amount
//               currencyCode
//             }
//           }
//         }
//       }
//     }
//   }
// `;

export const CREATE_ORDER_MUTATION = `
  mutation createDraftOrder($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        name
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_ORDER_MUTATION = `
  mutation updateDraftOrder($input: DraftOrderInput!) {
    draftOrderUpdate(input: $input) {
      draftOrder {
        id
        name
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// export const DELETE_ORDER_MUTATION = `
//   mutation deleteDraftOrder($id: ID!) {
//     draftOrderDelete(input: {id: $id}) {
//       deletedId
//       userErrors {
//         field
//         message
//       }
//     }
//   }
// `;


// ================== ORDERS ==================
export const GET_ORDERS_QUERY = `
  query GetOrders($first: Int!) {
    orders(first: $first, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          name
          email
          createdAt
          displayFinancialStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          customer {
            id
            firstName
            lastName
            email
          }
        }
      }
    }
  }
`;

// ================== PRODUCTS ==================
export const GET_PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          variants(first: 5) {
            edges {
              node {
                id
                title
                price
              }
            }
          }
        }
      }
    }
  }
`;

// ================== CUSTOMERS ==================
export const GET_CUSTOMERS_QUERY = `
  query GetCustomers($first: Int!) {
    customers(first: $first) {
      edges {
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

// ================== CREATE DRAFT ORDER ==================
export const CREATE_DRAFT_ORDER_MUTATION = `
  mutation CreateDraftOrder($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        name
        invoiceUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ================== COMPLETE DRAFT ORDER ==================
export const COMPLETE_DRAFT_ORDER_MUTATION = `
  mutation CompleteDraftOrder($id: ID!, $paymentPending: Boolean) {
    draftOrderComplete(id: $id, paymentPending: $paymentPending) {
      draftOrder {
        id
        name
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ================== DELETE ORDER ==================
export const DELETE_ORDER_MUTATION = `
  mutation DeleteOrder($input: OrderDeleteInput!) {
    orderDelete(input: $input) {
      deletedOrderId
      userErrors {
        field
        message
      }
    }
  }
`;


// app/lib/graphql/orders.js

// --- Query: Get Products + Customers ---
export const GET_PRODUCTS_AND_CUSTOMERS = `
  {
    products(first: 10) {
      edges {
        node {
          id
          title
          variants(first: 5) {
            edges {
              node {
                id
                title
              }
            }
          }
        }
      }
    }
    customers(first: 10) {
      edges {
        node {
          id
          displayName
          email
        }
      }
    }
  }
`;

// --- Mutation: Create Draft Order ---
export const CREATE_DRAFT_ORDER = `
  mutation CreateDraftOrder($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        name
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;
