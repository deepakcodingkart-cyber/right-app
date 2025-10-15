
// Helper function to find a product by variant ID
export function findProductByVariantId(products, variantId) {
  for (const product of products) {
    const variant = product.variants.find(v => v.id === variantId);
    if (variant) {
      return { ...variant, productName: product.title };
    }
  }
  return null;
}

// Helper function to get selected display content
export function getSelectedDisplayContent(selectedVariantIds, productData) {
  const selectedCount = selectedVariantIds.size;
  
  if (selectedCount === 0) {
    return '';
  }
  
  // Get the first selected item's title for display
  const firstSelectedId = Array.from(selectedVariantIds)[0];
  const firstSelectedItem = findProductByVariantId(productData, firstSelectedId);

  if (!firstSelectedItem) {
    return `${selectedCount} items selected`;
  }

  if (selectedCount === 1) {
    return `${firstSelectedItem.productName} (${firstSelectedItem.title})`;
  }

  return `${selectedCount} items selected`;
}