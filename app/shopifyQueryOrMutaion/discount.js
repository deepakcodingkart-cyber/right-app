export const apply_discount_add_varient = `
    mutation addDiscount($id: ID!, $lineItemId: ID!, $discount: OrderEditAppliedDiscountInput!) {
      orderEditAddLineItemDiscount(id: $id, lineItemId: $lineItemId, discount: $discount) {
        calculatedOrder { id }
        userErrors { message field }
      }
    }
  `;