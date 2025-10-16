// @ts-nocheck
import React from 'react';

function VariantRow({ variant, isSelected, onToggle }) {
  return (
    <div 
      className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
      onClick={() => onToggle(variant.id)}
    >
      <div className="flex items-center space-x-3">
        <input 
          type="checkbox" 
          checked={isSelected}
          readOnly
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">{variant.title}</span>
      </div>
      <span className="text-sm text-gray-500">{variant.price}</span>
    </div>
  );
}

export default VariantRow;