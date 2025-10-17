// @ts-nocheck
import React from 'react';

function CustomerRow({ customer, isSelected, onToggle }) {
  return (
    <div 
      className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
      onClick={() => onToggle(customer.id)}
    >
      <div className="flex items-center space-x-3">
        <input 
          type="checkbox" 
          checked={isSelected}
          readOnly
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <div>
          <p className="text-sm font-medium text-gray-900">{customer?.firstName}</p>
          <p className="text-xs text-gray-500">{customer.email}</p>
        </div>
      </div>
    </div>
  );
}

export default CustomerRow;