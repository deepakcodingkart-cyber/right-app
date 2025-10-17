// @ts-nocheck
import React, { useCallback } from 'react';

function DiscountSettingsCard({ discountState, setDiscountState }) {
  
  const handleChange = useCallback((key, value) => {
    setDiscountState(prev => ({
      ...prev,
      [key]: value
    }));
  }, [setDiscountState]);

  const handleDateChange = useCallback((key, value) => {
    setDiscountState(prev => ({
      ...prev,
      activeDates: {
        ...prev.activeDates,
        [key]: value,
      }
    }));
  }, [setDiscountState]);

  const handleCombosChange = useCallback((type) => {
    setDiscountState(prev => ({
      ...prev,
      combinations: {
        ...prev.combinations,
        [type]: !prev.combinations[type],
      }
    }));
  }, [setDiscountState]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 space-y-6">
      
      {/* Section 1: Amount off products */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Amount off products</h2>
        
        {/* Method */}
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Method</h3>
          <div className="inline-flex rounded-lg shadow-sm">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${discountState.method === 'Discount code' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              onClick={() => handleChange('method', 'Discount code')}
            >
              Discount code
            </button>
            {/* <button
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${discountState.method === 'Automatic discount' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              onClick={() => handleChange('method', 'Automatic discount')}
            >
              Automatic discount
            </button> */}
        </div>
        </div>

        {/* Discount Code */}
        {discountState.method === 'Discount code' && (
          <div className="mb-4">
            <label htmlFor="discount-code" className="text-sm font-medium text-gray-700 block mb-1">Discount code</label>
            <div className="relative">
              <input
                id="discount-code"
                type="text"
                value={discountState.code}
                onChange={(e) => handleChange('code', e.target.value)}
                className="w-full pr-32 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., BLACKFRIDAY"
              />
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700"
                onClick={() => handleChange('code', `RANDOM${Math.floor(Math.random() * 900) + 100}`)}
              >
                Generate random code
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Customers must enter this code at checkout.</p>
          </div>
        )}

        {/* Discount Value */}
        <div>
          <label htmlFor="discount-value" className="text-sm font-medium text-gray-700 block mb-1">Discount value</label>
          <div className="flex space-x-2">
            <select
              value={discountState.valueType}
              onChange={(e) => handleChange('valueType', e.target.value)}
              className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Percentage">Percentage</option>
              <option value="Amount">Fixed amount</option>
            </select>
            <input
              type="number"
              value={discountState.value}
              onChange={(e) => handleChange('value', e.target.value)}
              className="w-20 py-2 px-3 border border-gray-300 rounded-l-lg focus:ring-blue-500 focus:border-blue-500 text-right"
              placeholder="0"
            />
            <span className="inline-flex items-center px-3 text-gray-500 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg">
              {discountState.valueType === 'Percentage' ? '%' : '₹'}
            </span>
          </div>
        </div>
      </section>

      <hr className="border-gray-200" />
      
      {/* Section 2: Minimum Purchase Requirements */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Minimum purchase requirements</h2>
        <div className="space-y-2">
          <label className="flex items-center space-x-3">
            <input 
              type="radio" 
              name="min-req" 
              value="none" 
              checked={discountState.minimumRequirement.type === 'none'}
              onChange={() => handleChange('minimumRequirement', { type: 'none', value: '' })}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">No minimum requirements</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input 
              type="radio" 
              name="min-req" 
              value="amount" 
              checked={discountState.minimumRequirement.type === 'amount'}
              onChange={() => handleChange('minimumRequirement', { type: 'amount', value: discountState.minimumRequirement.value || '' })}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Minimum purchase amount (₹)</span>
            {discountState.minimumRequirement.type === 'amount' && (
              <input 
                type="number" 
                value={discountState.minimumRequirement.value}
                onChange={(e) => handleChange('minimumRequirement', { type: 'amount', value: e.target.value })}
                className="w-24 py-1 px-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ml-4"
                placeholder="0.00"
              />
            )}
          </label>

          <label className="flex items-center space-x-3">
            <input 
              type="radio" 
              name="min-req" 
              value="quantity" 
              checked={discountState.minimumRequirement.type === 'quantity'}
              onChange={() => handleChange('minimumRequirement', { type: 'quantity', value: discountState.minimumRequirement.value || '' })}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Minimum quantity of items</span>
            {discountState.minimumRequirement.type === 'quantity' && (
              <input 
                type="number" 
                value={discountState.minimumRequirement.value}
                onChange={(e) => handleChange('minimumRequirement', { type: 'quantity', value: e.target.value })}
                className="w-24 py-1 px-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ml-4"
                placeholder="1"
              />
            )}
          </label>
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Section 3: Maximum Discount Uses */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Maximum discount uses</h2>
        <div className="space-y-2">
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              checked={discountState.maxUses.limitTotal}
              onChange={(e) => handleChange('maxUses', { ...discountState.maxUses, limitTotal: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Limit number of times this discount can be used in total</span>
            {discountState.maxUses.limitTotal && (
              <input 
                type="number" 
                value={discountState.maxUses.totalCount}
                onChange={(e) => handleChange('maxUses', { ...discountState.maxUses, totalCount: e.target.value })}
                className="w-24 py-1 px-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ml-4"
                placeholder="100"
              />
            )}
          </label>
          
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              checked={discountState.maxUses.limitPerCustomer}
              onChange={(e) => handleChange('maxUses', { ...discountState.maxUses, limitPerCustomer: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Limit to one use per customer</span>
          </label>
        </div>
      </section>

      <hr className="border-gray-200" />

      {/* Section 4: Combinations */}
      {/* <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Combinations</h2>
        <p className="text-sm text-gray-600 mb-3">This discount can be combined with:</p>
        <div className="space-y-2">
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              checked={discountState.combinations.product}
              onChange={() => handleCombosChange('product')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Product discounts</span>
          </label>
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              checked={discountState.combinations.order}
              onChange={() => handleCombosChange('order')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Order discounts</span>
          </label>
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              checked={discountState.combinations.shipping}
              onChange={() => handleCombosChange('shipping')}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Shipping discounts</span>
          </label>
        </div>
      </section> */}

      <hr className="border-gray-200" />
      
      {/* Section 5: Active Dates */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Active dates</h2>
        <div className="flex space-x-4">
          {/* Start Date */}
          <div>
            <label htmlFor="start-date" className="text-sm font-medium text-gray-700 block mb-1">Start date</label>
            <input
              id="start-date"
              type="date"
              value={discountState.activeDates.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Start Time */}
          <div>
            <label htmlFor="start-time" className="text-sm font-medium text-gray-700 block mb-1">Start time (EDT)</label>
            <input
              id="start-time"
              type="time"
              value={discountState.activeDates.startTime}
              onChange={(e) => handleDateChange('startTime', e.target.value)}
              className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* End Date Checkbox */}
        <div className="mt-4">
          <label className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              checked={discountState.activeDates.setEndDate}
              onChange={(e) => handleDateChange('setEndDate', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Set end date</span>
          </label>
        </div>

        {/* End Date/Time (Conditional) */}
        {discountState.activeDates.setEndDate && (
          <div className="flex space-x-4 mt-4">
            <div>
              <label htmlFor="end-date" className="text-sm font-medium text-gray-700 block mb-1">End date</label>
              <input
                id="end-date"
                type="date"
                value={discountState.activeDates.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="end-time" className="text-sm font-medium text-gray-700 block mb-1">End time (EDT)</label>
              <input
                id="end-time"
                type="time"
                value={discountState.activeDates.endTime}
                onChange={(e) => handleDateChange('endTime', e.target.value)}
                className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default DiscountSettingsCard;