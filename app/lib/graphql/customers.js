export const GET_CUSTOMERS_QUERY = `
  query getCustomers($first: Int!) {
    customers(first: $first) {
      edges {
        node {
          id
          firstName
          lastName
          email
          createdAt
        }
      }
    }
  }
`;

export const GET_CUSTOMER_QUERY = `
  query getCustomer($id: ID!) {
    customer(id: $id) {
      id
      firstName
      lastName
      email
    }
  }
`;

export const CREATE_CUSTOMER_MUTATION = `
  mutation createCustomer($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

export const UPDATE_CUSTOMER_MUTATION = `
  mutation updateCustomer($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

export const DELETE_CUSTOMER_MUTATION = `
  mutation deleteCustomer($input: CustomerDeleteInput!) {
    customerDelete(input: $input) {
      deletedCustomerId
      userErrors { field message }
    }
  }
`;
