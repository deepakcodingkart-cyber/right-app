// @ts-nocheck
export const getAllVariants = (products) => 
  products.flatMap(p => p.variants.map(v => ({ 
    ...v, 
    productTitle: p.title, 
    productImage: p.image 
  })));


const baseUrl = 'https://jokes-tribune-disc-hist.trycloudflare.com/api/';

export async function loader() {

  try {
    // 1. Prepare fetch requests for both APIs
    const customersPromise = fetch(baseUrl + 'customers');
    const productsPromise = fetch(baseUrl + 'products'); 

    // 2. Wait for both promises to resolve (concurrently)
    const [customersResponse, productsResponse] = await Promise.all([
      customersPromise,
      productsPromise,
    ]);

    // 3. Check for successful responses before parsing JSON
    if (!customersResponse.ok) {
      throw new Error(`Customers API failed with status: ${customersResponse.status}`);
    }
    if (!productsResponse.ok) {
      throw new Error(`Products API failed with status: ${productsResponse.status}`);
    }

    // 4. Parse the JSON data
    const customersData = await customersResponse.json();
    const productsData = await productsResponse.json();

    // 5. Return an object containing both datasets
    return {
      customers: customersData,
      products: productsData,
    };
  } catch (error) {
    console.error('Error loading data:', error);
    // Return a structured object with empty arrays on failure
    return {
      customers: [],
      products: [],
    };
  }
}

// @ts-nocheck

/**
 * Create an individual discount through our Remix API
 * @param {Object} discountData - full discount data from UI
 * @returns {Promise<Object>} - API response JSON
 */
export async function action(discountData) {

  try {
    const response = await fetch(baseUrl + 'discount/create', {
      method: 'POST', // ✅ you must include this
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discountData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ API Error:", data);
      throw new Error(data.message || "Failed to create discount");
    }

    return data;
  } catch (error) {
    console.error("❌ Network Error:", error);
    throw error;
  }
}

