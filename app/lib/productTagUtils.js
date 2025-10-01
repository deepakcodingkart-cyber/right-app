import { 
  GET_PRODUCT_TAGS_QUERY, 
  UPDATE_PRODUCT_TAGS_MUTATION 
} from "./graphql/productTags";

/**
 * Adds a tag to a product if it doesn't already exist
 * @param {Object} admin - Shopify admin API instance
 * @param {string} productId - The product ID (GID format)
 * @param {string} tagToAdd - The tag to add
 * @returns {Promise<boolean>} - Returns true if tag was added, false if already exists
 */
export async function addTagToProduct(admin, productId, tagToAdd) {
  try {
    // Get current product data
    const productResponse = await admin.graphql(GET_PRODUCT_TAGS_QUERY, {
      variables: { id: productId }
    });
    
    const productData = await productResponse.json();
    const product = productData.data.product;

    if (!product) {
      console.log(`Product ${productId} not found`);
      return false;
    }

    // Check if tag already exists
    const currentTags = product.tags || [];
    if (currentTags.includes(tagToAdd)) {
      console.log(`Product ${product.title} already has "${tagToAdd}" tag`);
      return false;
    }

    // Add tag to existing tags
    const updatedTags = [...currentTags, tagToAdd];

    // Update the product with new tags
    const updateResponse = await admin.graphql(UPDATE_PRODUCT_TAGS_MUTATION, {
      variables: {
        input: {
          id: productId,
          tags: updatedTags
        }
      }
    });

    const updateData = await updateResponse.json();
    
    if (updateData.data.productUpdate.userErrors.length > 0) {
      console.error("Error updating product tags:", updateData.data.productUpdate.userErrors);
      return false;
    } else {
      console.log(`Successfully added "${tagToAdd}" tag to product: ${product.title}`);
      return true;
    }

  } catch (error) {
    console.error(`Error adding tag "${tagToAdd}" to product ${productId}:`, error);
    return false;
  }
}

/**
 * Removes a tag from a product if it exists
 * @param {Object} admin - Shopify admin API instance
 * @param {string} productId - The product ID (GID format)
 * @param {string} tagToRemove - The tag to remove
 * @returns {Promise<boolean>} - Returns true if tag was removed, false if didn't exist
 */
export async function removeTagFromProduct(admin, productId, tagToRemove) {
  try {
    // Get current product data
    const productResponse = await admin.graphql(GET_PRODUCT_TAGS_QUERY, {
      variables: { id: productId }
    });
    
    const productData = await productResponse.json();
    const product = productData.data.product;

    if (!product) {
      console.log(`Product ${productId} not found`);
      return false;
    }

    // Check if tag exists
    const currentTags = product.tags || [];
    if (!currentTags.includes(tagToRemove)) {
      console.log(`Product ${product.title} doesn't have "${tagToRemove}" tag`);
      return false;
    }

    // Remove tag from existing tags
    const updatedTags = currentTags.filter(tag => tag !== tagToRemove);

    // Update the product with new tags
    const updateResponse = await admin.graphql(UPDATE_PRODUCT_TAGS_MUTATION, {
      variables: {
        input: {
          id: productId,
          tags: updatedTags
        }
      }
    });

    const updateData = await updateResponse.json();
    
    if (updateData.data.productUpdate.userErrors.length > 0) {
      console.error("Error updating product tags:", updateData.data.productUpdate.userErrors);
      return false;
    } else {
      console.log(`Successfully removed "${tagToRemove}" tag from product: ${product.title}`);
      return true;
    }

  } catch (error) {
    console.error(`Error removing tag "${tagToRemove}" from product ${productId}:`, error);
    return false;
  }
}

/**
 * Checks if a product has a specific tag
 * @param {Object} admin - Shopify admin API instance
 * @param {string} productId - The product ID (GID format)
 * @param {string} tag - The tag to check for
 * @returns {Promise<boolean>} - Returns true if product has the tag
 */
export async function productHasTag(admin, productId, tag) {
  try {
    const productResponse = await admin.graphql(GET_PRODUCT_TAGS_QUERY, {
      variables: { id: productId }
    });
    
    const productData = await productResponse.json();
    const product = productData.data.product;

    if (!product) {
      return false;
    }

    const currentTags = product.tags || [];
    return currentTags.includes(tag);

  } catch (error) {
    console.error(`Error checking tag "${tag}" for product ${productId}:`, error);
    return false;
  }
}
