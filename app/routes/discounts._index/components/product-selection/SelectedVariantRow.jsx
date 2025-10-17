// @ts-nocheck
import React from 'react';
import Thumbnail from '../ui/Thumbnail';

function SelectedVariantRow({ variant, onRemove }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3">
        <Thumbnail source={variant.productImage} alt={variant.productTitle} />
        <div>
          <p className="text-sm font-medium text-gray-900">{variant.productTitle}</p>
          <p className="text-xs text-gray-500">Variant: {variant.title}</p>
        </div>
      </div>
      <button 
        className="text-gray-400 hover:text-red-500"
        onClick={() => onRemove(variant.id)}
        aria-label={`Remove ${variant.title}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
  );
}

export default SelectedVariantRow;