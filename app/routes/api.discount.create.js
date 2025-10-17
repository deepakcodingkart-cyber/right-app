// @ts-nocheck
import { json } from "@remix-run/node";
import { createDiscountOnShopify } from "../utils/discountMutation";

/**
 * Remix API route to create a discount
 * Expects POST body: {
 *   selectedCustomersDetails: [{ id: "123" }],
 *   selectedVariantsDetails: [{ id: "456" }],
 *   discountSettings: {
 *     code: "JDVARIANT20",
 *     value: 20,
 *     valueType: "FixedAmount" | "Percentage",
 *     title?: "Exclusive $20 Off",
 *   }
 * }
 */
export async function action({ request }) {
  try {
    const body = await request.json();
    const shop = process.env.SHOP_NAME;
    const accessToken = "shpua_196fbc0bed343fe225e65d2416b4a2b8";

    const result = await createDiscountOnShopify(shop, accessToken, body);

    // Extract useful info
    const responseData = result?.data?.discountCodeBasicCreate;
    const userErrors = responseData?.userErrors || [];

    if (userErrors.length > 0) {
      return json(
        { success: false, message: "Shopify validation failed", userErrors },
        { status: 400 }
      );
    }

    const createdDiscount =
      responseData?.codeDiscountNode?.codeDiscount || null;

    return json(
      {
        success: true,
        message: "Discount created successfully",
        data: createdDiscount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error creating discount:", error);
    return json(
      {
        success: false,
        message: error.message || "Unknown error while creating discount",
      },
      { status: 500 }
    );
  }
}
