

export function calculateDiscount(lineItemPrice, replacementPrice) {
  console.log("lineItemPrice", lineItemPrice);
  console.log("replacementPrice", replacementPrice);
  const discountAmount = replacementPrice - lineItemPrice;
  const discountPercentage = (discountAmount / replacementPrice) * 100;
  return discountPercentage > 0 ? discountPercentage : 0;
}
