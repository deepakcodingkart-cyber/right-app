import { GET_PRODUCTS } from "../../shopifyQueryOrMutaion/product.js";

/**
 * Service class for handling Shopify product operations
 * Contains business logic for product fetching and management
 */
class ShopifyProductService {
  constructor() {
    this.defaultProductTag = "currect_coffe";
  }

  /**
   * Fetch products by tag
   * @param {Object} admin - Shopify admin GraphQL client
   * @param {String} tag - Product tag to filter by (optional)
   * @returns {Promise<Array>} Array of products
   */
  async fetchProductsByTag(admin, tag = null) {
    try {
      const searchTag = tag || this.defaultProductTag;
      
      console.log(`🔍 Fetching products with tag: ${searchTag}`);

      const productResp = await admin.graphql(GET_PRODUCTS, {
        variables: { query: `tag:${searchTag}` }
      });

      const productData = await productResp.json();

      if (productData.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(productData.errors)}`);
      }

      const products = productData.data?.products?.nodes || [];

      console.log(`✅ Found ${products.length} product(s) with tag: ${searchTag}`);

      return products;

    } catch (error) {
      console.error("❌ Error fetching products by tag:", error.message);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  /**
   * Fetch replacement products for subscription items
   * @param {Object} admin - Shopify admin GraphQL client
   * @returns {Promise<Array>} Array of replacement products
   */
  async fetchReplacementProducts(admin) {
    try {
      console.log("🛍️ Fetching replacement products for subscription");

      const products = await this.fetchProductsByTag(admin);

      if (!products || products.length === 0) {
        throw new Error("No replacement products found");
      }

      return products;

    } catch (error) {
      console.error("❌ Error fetching replacement products:", error.message);
      throw error;
    }
  }

  /**
   * Get product by ID
   * @param {Object} admin - Shopify admin GraphQL client
   * @param {String} productId - Product ID
   * @returns {Promise<Object>} Product object
   */
  async getProductById(admin, productId) {
    try {
      console.log(`🔍 Fetching product with ID: ${productId}`);

      // You can add GET_PRODUCT_BY_ID query here if needed
      // For now, this is a placeholder

      throw new Error("getProductById not implemented yet");

    } catch (error) {
      console.error("❌ Error fetching product by ID:", error.message);
      throw error;
    }
  }
}

export default ShopifyProductService;
