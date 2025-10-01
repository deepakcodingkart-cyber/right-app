// GraphQL queries and mutations for product tag operations

export const GET_PRODUCT_TAGS_QUERY = `
  query getProduct($id: ID!) {
    product(id: $id) {
      id
      title
      tags
    }
  }
`;

export const UPDATE_PRODUCT_TAGS_MUTATION = `
  mutation updateProduct($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const ADD_TAG_TO_PRODUCT_MUTATION = `
  mutation addTagToProduct($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const REMOVE_TAG_FROM_PRODUCT_MUTATION = `
  mutation removeTagFromProduct($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`;
