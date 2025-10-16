// @ts-nocheck
import React from 'react';
import Checkbox from '../ui/Checkbox';
import Thumbnail from '../ui/Thumbnail';
import VariantRow from './VariantRow';

function ProductItem({ product, selectedItems, onToggleProduct, onToggleVariant }) {
  const variantIds = product.variants.map(v => v.id);
  const selectedVariantIds = variantIds.filter(id => selectedItems.has(id));
  const allSelected = selectedVariantIds.length === variantIds.length && variantIds.length > 0;
  const isIndeterminate = selectedVariantIds.length > 0 && selectedVariantIds.length < variantIds.length;
  
  const handleToggle = () => {
    onToggleProduct(variantIds, allSelected);
  };

  return (
    <div className="border border-gray-200 rounded-lg mb-4 last:mb-0">
      {/* Product Header (Select All) */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center space-x-4">
        <Checkbox 
          checked={allSelected} 
          indeterminate={isIndeterminate} 
          label={product.title} 
          onChange={handleToggle}
        />
        <Thumbnail source={product.image} alt={product.title} />
      </div>
      
      {/* Variants List */}
      <div className="divide-y divide-gray-100">
        {product.variants.map(variant => (
          <VariantRow 
            key={variant.id} 
            variant={variant} 
            isSelected={selectedItems.has(variant.id)}
            onToggle={onToggleVariant}
          />
        ))}
      </div>
    </div>
  );
}

export default ProductItem;