import { callShopifyGraphQL } from "../../utils/shopifyGraphQL.js";
import { GET_PRODUCTS } from "../../shopifyQueryOrMutaion/product.js";

class ShopifyProductService {
  constructor() {
    this.defaultProductTag = "currect_coffe";
  }

  /**
   * Fetch products by tag
   * @param {string} shop - Shopify store domain
   * @param {string} accessToken - Shopify access token
   * @param {string|null} tag - Product tag (optional)
   * @returns {Promise<Array>} Array of products
   */
  async fetchProductsByTag(shop, accessToken, tag = null) {
    try {
      const searchTag = tag || this.defaultProductTag;
      console.log(`🔍 Fetching products with tag: ${searchTag}`);

      const productResp = await callShopifyGraphQL(shop, accessToken, GET_PRODUCTS, {
        query: `tag:${searchTag}`,
      });

      if (productResp.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(productResp.errors)}`);
      }

      const products = productResp.data?.products?.nodes || [];
      console.log(`✅ Found ${products.length} product(s) with tag: ${searchTag}`);

      return products;
    } catch (error) {
      console.error("❌ Error fetching products by tag:", error.message);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  /**
   * Fetch replacement products for subscription items
   * @param {string} shop - Shopify store domain
   * @param {string} accessToken - Shopify access token
   * @returns {Promise<Array>} Array of replacement products
   */
  async fetchReplacementProducts(shop, accessToken) {
    try {
      console.log("🛍️ Fetching replacement products for subscription");

      const products = await this.fetchProductsByTag(shop, accessToken);

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
   * Get product by ID (optional, placeholder)
   * @param {string} shop
   * @param {string} accessToken
   * @param {string} productId
   */
  async getProductById(shop, accessToken, productId) {
    try {
      console.log(`🔍 Fetching product with ID: ${productId}`);
      throw new Error("getProductById not implemented yet");
    } catch (error) {
      console.error("❌ Error fetching product by ID:", error.message);
      throw error;
    }
  }
}

export default ShopifyProductService;
