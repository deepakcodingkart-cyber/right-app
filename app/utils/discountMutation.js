import { callShopifyGraphQL } from "./shopifyGraphQL.js";

export async function createDiscountOnShopify(shop, accessToken, discountData) {
  const mutation = `
    mutation CreateIndividualDiscountCode($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              title
              codes(first: 1) {
                nodes { code }
              }
              customerSelection {
                ... on DiscountCustomers { customers { id } }
              }
              customerGets {
                value {
                  ... on DiscountAmount {
                    amount { amount currencyCode }
                    appliesOnEachItem
                  }
                  ... on DiscountPercentage {
                    percentage
                  }
                }
                items {
                  ... on DiscountProducts {
                    productVariants(first: 10) {
                      nodes { id title }
                    }
                  }
                }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `;

  const { selectedCustomersDetails, selectedVariantsDetails, discountSettings } = discountData;
  const customerGIDs = selectedCustomersDetails.map(c => c.id);
  const variantGIDs = selectedVariantsDetails.map(v => v.id);
  const { valueType, value, code, title } = discountSettings;

  const customerGetsValue =
    valueType === "Percentage"
      ? {
          percentage: parseFloat(value) / 100,
        }
      : {
          discountAmount: {
            amount: value.toString(),
            appliesOnEachItem: false,
          },
        };

  const variables = {
    basicCodeDiscount: {
      title: title || `Discount ${code}`,
      code,
      startsAt: new Date().toISOString(),
      appliesOncePerCustomer: true,
      customerSelection: {
        customers: { add: customerGIDs },
      },
      customerGets: {
        value: customerGetsValue,
        items: {
          products: {
            productVariantsToAdd: variantGIDs,
          },
        },
      },
    },
  };


  const result = await callShopifyGraphQL(shop, accessToken, mutation, variables);

  if (result.errors) console.error("❌ GraphQL errors:", result.errors);
  const userErrors = result?.data?.discountCodeBasicCreate?.userErrors || [];
  if (userErrors.length > 0) console.warn("⚠️ User Errors:", userErrors);

  console.log("✅ Shopify Discount Creation Result:", JSON.stringify(result, null, 2));
  return result;
}
