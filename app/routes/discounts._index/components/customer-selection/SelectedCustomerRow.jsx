// @ts-nocheck
import React from 'react';

function SelectedCustomerRow({ customer, onRemove }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
          {customer.firstName[0]}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{customer.firstName}</p>
          <p className="text-xs text-gray-500">{customer.email}</p>
        </div>
      </div>
      <button 
        className="text-gray-400 hover:text-red-500"
        onClick={() => onRemove(customer.id)}
        aria-label={`Remove ${customer.firstName}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
  );
}

export default SelectedCustomerRow;