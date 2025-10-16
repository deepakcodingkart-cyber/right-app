// @ts-nocheck
export const getAllVariants = (products) => 
  products.flatMap(p => p.variants.map(v => ({ 
    ...v, 
    productTitle: p.title, 
    productImage: p.image 
  })));

export async function loader() {
  // Base URL for the APIs
  const baseUrl = 'https://mitsubishi-dryer-challenging-debian.trycloudflare.com/api/';

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