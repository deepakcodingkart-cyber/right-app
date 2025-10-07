/**
 * Calculate discount percentage between subscription price and replacement price
 * @param {Number|String} lineItemPrice - Original subscription item price
 * @param {Number|String} replacementPrice - Replacement variant price
 * @returns {Number} Discount percentage (0 if no discount needed)
 */
export function calculateDiscount(lineItemPrice, replacementPrice) {
  try {
    // Convert to numbers if strings
    const subPrice = parseFloat(lineItemPrice);
    const repPrice = parseFloat(replacementPrice);

    // Validate inputs
    if (isNaN(subPrice) || isNaN(repPrice)) {
      console.error("❌ Invalid price values:", { lineItemPrice, replacementPrice });
      return 0;
    }

    if (repPrice <= 0) {
      console.error("❌ Replacement price must be greater than 0");
      return 0;
    }

    console.log("💰 Calculating discount:");
    console.log("  - Subscription price:", subPrice);
    console.log("  - Replacement price:", repPrice);

    const discountAmount = repPrice - subPrice;
    const discountPercentage = (discountAmount / repPrice) * 100;

    console.log("  - Discount amount:", discountAmount);
    console.log("  - Discount percentage:", discountPercentage.toFixed(2) + "%");

    return discountPercentage > 0 ? discountPercentage : 0;

  } catch (error) {
    console.error("❌ Error calculating discount:", error.message);
    return 0;
  }
}
