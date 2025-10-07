// import ShopifyProductService from "../../services/shopifyproduct/index.js";

// /**
//  * Controller for handling Shopify product operations
//  * Manages the flow between routes and services
//  */
// class ShopifyProductController {
//   constructor() {
//     this.productService = new ShopifyProductService();
//   }

//   /**
//    * Fetch products by tag
//    * @param {Object} admin - Authenticated admin GraphQL client
//    * @param {String} tag - Product tag to filter by
//    * @returns {Promise<Object>} Result with products
//    */
//   async fetchProductsByTag(admin, tag) {
//     try {
//       console.log("🎯 Controller: Fetching products by tag");

//       if (!admin) {
//         throw new Error("Admin client is required");
//       }

//       const products = await this.productService.fetchProductsByTag(admin, tag);

//       return {
//         success: true,
//         products,
//         count: products.length
//       };

//     } catch (error) {
//       console.error("❌ Controller error:", error.message);
//       throw error;
//     }
//   }

//   /**
//    * Fetch replacement products
//    * @param {Object} admin - Authenticated admin GraphQL client
//    * @returns {Promise<Array>} Array of replacement products
//    */
//   async fetchReplacementProducts(admin) {
//     try {
//       console.log("🎯 Controller: Fetching replacement products");

//       if (!admin) {
//         throw new Error("Admin client is required");
//       }

//       const products = await this.productService.fetchReplacementProducts(admin);

//       return products;

//     } catch (error) {
//       console.error("❌ Controller error:", error.message);
//       throw error;
//     }
//   }
// }

// export default ShopifyProductController;
