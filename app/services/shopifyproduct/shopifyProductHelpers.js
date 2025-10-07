/**
 * Helper functions for Shopify product operations
 * Contains reusable utility functions for product processing
 */

/**
 * Filter products by specific criteria
 * @param {Array} products - Array of products
 * @param {Object} criteria - Filter criteria
 * @returns {Array} Filtered products
 */
export function filterProducts(products, criteria) {
  try {
    if (!products || !products.length) {
      return [];
    }

    return products.filter(product => {
      // Add your filtering logic here
      return true;
    });

  } catch (error) {
    console.error("❌ Error filtering products:", error.message);
    return [];
  }
}

/**
 * Extract variants from products
 * @param {Array} products - Array of products
 * @returns {Array} Array of all variants
 */
export function extractVariants(products) {
  try {
    if (!products || !products.length) {
      return [];
    }

    const variants = [];

    products.forEach(product => {
      if (product.variants?.nodes) {
        variants.push(...product.variants.nodes);
      }
    });

    return variants;

  } catch (error) {
    console.error("❌ Error extracting variants:", error.message);
    return [];
  }
}

/**
 * Check if product is a subscription product
 * @param {Object} product - Product object
 * @returns {Boolean} True if subscription product
 */
export function isSubscriptionProduct(product) {
  try {
    if (!product) return false;

    const title = (product.title || "").toLowerCase();
    return title.includes("subscription");

  } catch (error) {
    console.error("❌ Error checking subscription product:", error.message);
    return false;
  }
}

/**
 * Check if variant is a subscription variant
 * @param {Object} variant - Variant object
 * @param {Object} product - Parent product object
 * @returns {Boolean} True if subscription variant
 */
export function isSubscriptionVariant(variant, product = null) {
  try {
    if (!variant) return false;

    const variantTitle = (variant.title || "").toLowerCase();
    const productTitle = product ? (product.title || "").toLowerCase() : "";

    return (
      variantTitle.includes("subscription") ||
      productTitle.includes("subscription")
    );

  } catch (error) {
    console.error("❌ Error checking subscription variant:", error.message);
    return false;
  }
}
