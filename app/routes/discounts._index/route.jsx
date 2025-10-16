// @ts-nocheck
import React, { useState, useCallback, useMemo } from 'react';
import { useLoaderData } from '@remix-run/react';


// --- UTILITY FUNCTIONS ---
const getAllVariants = (products) => 
  products.flatMap(p => p.variants.map(v => ({ 
    ...v, 
    productTitle: p.title, 
    productImage: p.image 
  })));

// Custom styled Button component
const Button = ({ children, primary, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-4 py-2 rounded-lg font-semibold transition-colors duration-200 shadow-sm
      ${primary
        ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
      }
    `}
  >
    {children}
  </button>
);

// Custom Checkbox component with indeterminate support
const Checkbox = React.forwardRef(({ checked, indeterminate, label, onChange }, ref) => (
  <label className="flex items-center cursor-pointer space-x-2 p-1 rounded-md hover:bg-gray-50" onClick={onChange}>
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate;
        if (typeof ref === 'function') ref(el);
        else if (ref && typeof ref === 'object') {
          // @ts-ignore
          ref.current = el;
        }
      }}
      readOnly
      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
    />
    <span className="text-sm font-medium text-gray-900">{label}</span>
  </label>
));

// Simple Thumbnail component
const Thumbnail = ({ source, alt }) => (
  <img
    src={source}
    alt={alt}
    className="w-8 h-8 rounded-md object-cover border border-gray-200"
  />
);

export async function loader() {
  // Base URL for the APIs
  const baseUrl = 'https://magnet-revisions-proteins-surely.trycloudflare.com/api/';

  try {
    // 1. Prepare fetch requests for both APIs
    const customersPromise = fetch(baseUrl + 'customers');
    const productsPromise = fetch(baseUrl + 'products'); 

    // 2. Wait for both promises to resolve (concurrently)
    const [customersResponse, productsResponse] = await Promise.all([
      customersPromise,
      productsPromise,
    ]);

    // 3. Check for successful responses before parsing JSON
    if (!customersResponse.ok) {
      throw new Error(`Customers API failed with status: ${customersResponse.status}`);
    }
    if (!productsResponse.ok) {
      throw new Error(`Products API failed with status: ${productsResponse.status}`);
    }

    // 4. Parse the JSON data
    const customersData = await customersResponse.json();
    const productsData = await productsResponse.json();

    // 5. Return an object containing both datasets
    return {
      customers: customersData,
      products: productsData,
    };
  } catch (error) {
    console.error('Error loading data:', error);
    // Return a structured object with empty arrays on failure
    return {
      customers: [],
      products: [],
    };
  }
}

// Custom Modal Component
function Modal({ open, onClose, title, large, primaryAction, secondaryActions, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh] ${large ? 'w-[90%] max-w-5xl' : 'w-full max-w-xl'}`}
        onClick={e => e.stopPropagation()} // Prevent closing on content click
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-grow overflow-y-auto">
          {children}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
          {secondaryActions?.map((action, index) => (
            <Button key={index} onClick={action.onAction} disabled={action.disabled}>
              {action.content}
            </Button>
          ))}
          {primaryAction && (
            <Button primary onClick={primaryAction.onAction} disabled={primaryAction.disabled}>
              {primaryAction.content}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Product Selection Components ---

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

function ProductItem({ product, selectedItems, onToggleProduct, onToggleVariant }) {
  const variantIds = product.variants.map(v => v.id);
  const selectedVariantIds = variantIds.filter(id => selectedItems.has(id));
  const allSelected = selectedVariantIds.length === variantIds.length && variantIds.length > 0;
  const isIndeterminate = selectedVariantIds.length > 0 && selectedVariantIds.length < variantIds.length;
  
  // Toggle state: If all are selected -> deselect all. Otherwise -> select all.
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

function ProductSelectionModal({ open, onClose, productData, confirmedIds, onSave }) {
  const [searchText, setSearchText] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState(new Set(confirmedIds));

  React.useEffect(() => {
    // Reset temporary selection when the modal opens/confirmedIds changes
    if(open) {
      setTempSelectedIds(new Set(confirmedIds));
    }
  }, [open, confirmedIds]);

  const handleToggleVariant = useCallback((variantId) => {
    setTempSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variantId)) {
        newSet.delete(variantId);
      } else {
        newSet.add(variantId);
      }
      return newSet;
    });
  }, []);

  const handleToggleProduct = useCallback((variantIds, allSelected) => {
    setTempSelectedIds(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        variantIds.forEach(id => newSet.delete(id));
      } else {
        variantIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }, []);


  const filteredProducts = useMemo(() => {
    return productData.filter(product =>
      product.title.toLowerCase().includes(searchText.toLowerCase()) ||
      product.variants.some(v => v.title.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [productData, searchText]);

  const handleSave = () => {
    onSave(tempSelectedIds);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select products and variants"
      large
      primaryAction={{ content: `Add ${tempSelectedIds.size} item${tempSelectedIds.size !== 1 ? 's' : ''}`, onAction: handleSave, disabled: tempSelectedIds.size === 0 }}
      secondaryActions={[{ content: 'Cancel', onAction: onClose }]}
    >
      <div className="p-4">
        <div className="relative mb-4">
          <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.093l3.376 3.377a.75.75 0 01-1.06 1.06l-3.377-3.376A7 7 0 012 9z" clipRule="evenodd" /></svg>
          <input
            type="text"
            placeholder="Search products"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {filteredProducts.map(product => (
            <ProductItem 
              key={product.id} 
              product={product} 
              selectedItems={tempSelectedIds}
              onToggleProduct={handleToggleProduct}
              onToggleVariant={handleToggleVariant}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div className="text-center py-10 text-gray-500">No products found.</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

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

// --- Customer Selection Components ---

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

function CustomerSelectionModal({ open, onClose, confirmedIds, onSave, allCustomers }) {

  const [searchText, setSearchText] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState(new Set(confirmedIds));

  React.useEffect(() => {
    if (open) {
      setTempSelectedIds(new Set(confirmedIds));
    }
  }, [open, confirmedIds]);

  const handleToggleCustomer = useCallback((customerId) => {
    setTempSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.has(customerId) ? newSet.delete(customerId) : newSet.add(customerId);
      return newSet;
    });
  }, []);

  const filteredCustomers = useMemo(() => {
    const search = searchText.toLowerCase();
    return allCustomers?.filter(customer => {
      const firstName = customer.firstName?.toLowerCase() || '';
      const lastName = customer.lastName?.toLowerCase() || '';
      const email = customer.email?.toLowerCase() || '';
      return (
        firstName.includes(search) ||
        lastName.includes(search) ||
        email.includes(search)
      );
    }) || [];
  }, [searchText, allCustomers]);

  const handleSave = () => {
    onSave(tempSelectedIds);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select customers"
      large={false}
      primaryAction={{
        content: `Add ${tempSelectedIds.size} customer${tempSelectedIds.size !== 1 ? 's' : ''}`,
        onAction: handleSave,
        disabled: tempSelectedIds.size === 0
      }}
      secondaryActions={[{ content: 'Cancel', onAction: onClose }]}
    >
      <div className="p-4">
        {/* 🔍 Search bar */}
        <div className="relative mb-4">
          <svg
            className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.093l3.376 3.377a.75.75 0 01-1.06 1.06l-3.377-3.376A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search customers"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* 👥 Customer list */}
        <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2 divide-y divide-gray-100">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => (
              <CustomerRow
                key={customer.id}
                customer={{
                  ...customer,
                  // fallback for null names
                  firstName: customer.firstName || '',
                  lastName: customer.lastName || '',
                  email: customer.email || 'No email provided',
                }}
                isSelected={tempSelectedIds.has(customer.id)}
                onToggle={handleToggleCustomer}
              />
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">No customers found.</div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// --- Discount Settings Card Component ---
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
            <button
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${discountState.method === 'Automatic discount' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              onClick={() => handleChange('method', 'Automatic discount')}
            >
              Automatic discount
            </button>
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
      <section>
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
      </section>

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

export default function DiscountProductSelector() {
  const loaderData = (useLoaderData());
  const allCustomers = loaderData?.customers?.customers;
  const initialProducts = loaderData?.products?.products || [];

  const allVariants = getAllVariants(initialProducts);
  const [productData] = useState(initialProducts);

  // --- Product Selection State & Handlers ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [confirmedVariantIds, setConfirmedVariantIds] = useState(new Set());
  const [tempSelectedVariantIds, setTempSelectedVariantIds] = useState(new Set());

  // Open the product modal and initialize temporary selection
  const handleOpenProductModal = useCallback(() => {
    setIsProductModalOpen(true);
    // Initialize temp selection from confirmed set when opening
    setTempSelectedVariantIds(new Set(confirmedVariantIds)); 
  }, [confirmedVariantIds]);

  // Close Product modal
  const handleCloseProductModal = useCallback(() => { 
    setIsProductModalOpen(false); 
    // Optionally reset search text here if you had a dedicated state for it
  }, []);

  // Confirm product selection
  const handleConfirmProductSelection = useCallback((newIds) => { 
    setConfirmedVariantIds(newIds);
    setIsProductModalOpen(false);
  }, []);

  // Remove a single variant from the main list
  const handleRemoveVariant = useCallback((variantId) => {
    setConfirmedVariantIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(variantId);
      return newSet;
    });
  }, []);

  // Display Logic for Confirmed Products
  const confirmedVariantCount = confirmedVariantIds.size;
  const confirmedVariantsData = useMemo(() => {
    // Filter all variants to get only the confirmed ones
    return allVariants.filter(v => confirmedVariantIds.has(v.id));
  }, [confirmedVariantIds]);
  
  const productDisplayContent = useMemo(() => {
    if (confirmedVariantCount === 0) return 'Select products and variants';
    if (confirmedVariantCount === 1) return confirmedVariantsData[0].productTitle + ' (' + confirmedVariantsData[0].title + ')';
    return `${confirmedVariantCount} variants selected`;
  }, [confirmedVariantCount, confirmedVariantsData]);


  // --- Customer Selection State & Handlers ---
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [confirmedCustomerIds, setConfirmedCustomerIds] = useState(new Set());
  
  // Open Customer modal
  const handleOpenCustomerModal = useCallback(() => { 
    setIsCustomerModalOpen(true); 
  }, []);
  
  // Close Customer modal
  const handleCloseCustomerModal = useCallback(() => { 
    setIsCustomerModalOpen(false); 
  }, []);

  // Confirm customer selection
  const handleConfirmCustomerSelection = useCallback((newIds) => { 
    setConfirmedCustomerIds(newIds);
  }, []);

  // Remove a single customer from the main list
  const handleRemoveCustomer = useCallback((customerId) => { 
    setConfirmedCustomerIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(customerId);
      return newSet;
    });
  }, []);

  // Display Logic for Confirmed Customers
  const confirmedCustomerCount = confirmedCustomerIds.size;
  const confirmedCustomersData = useMemo(() => {
    // Filter all customers to get only the confirmed ones
    return allCustomers.filter(c => confirmedCustomerIds.has(c.id));
  }, [confirmedCustomerIds]);

  const customerDisplayContent = useMemo(() => { 
    if (confirmedCustomerCount === 0) return 'Select customers';
    if (confirmedCustomerCount === 1) return confirmedCustomersData[0].firstName;
    return `${confirmedCustomerCount} customers selected`;
  }, [confirmedCustomerCount, confirmedCustomersData]);


  // --- Discount Settings State ---
  const [discountState, setDiscountState] = useState({
    method: 'Discount code',
    code: 'SUMMER20',
    valueType: 'Percentage',
    value: 20,
    minimumRequirement: {
      type: 'none', // 'none', 'amount', 'quantity'
      value: '', 
    },
    maxUses: {
      limitTotal: false,
      totalCount: 100,
      limitPerCustomer: false,
    },
    combinations: {
      product: false,
      order: false,
      shipping: false,
    },
    activeDates: {
      startDate: '2025-10-16',
      startTime: '01:45',
      setEndDate: false,
      endDate: '',
      endTime: '',
    },
  });


  // --- Main Render ---
  return (
    <div className="p-6 bg-gray-100 min-h-screen font-sans">
      {/* Tailwind CSS import for standalone use */}
      <script src="https://cdn.tailwindcss.com"></script>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Create Discount</h1>
      
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* === Discount Settings Card (from images) === */}
        <DiscountSettingsCard 
          discountState={discountState} 
          setDiscountState={setDiscountState} 
        />

        <hr className="border-gray-300" />

        {/* === CARD 1: PRODUCT SELECTION === */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Products to apply discount to</h2>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-medium mb-3">Products</h3>
            <div className="flex items-center space-x-3">
              <div className="relative flex-grow">
                <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.093l3.376 3.377a.75.75 0 01-1.06 1.06l-3.377-3.376A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Select products and variants" 
                  value={productDisplayContent} 
                  readOnly 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-50 cursor-pointer"
                  onClick={handleOpenProductModal}
                />
              </div>
              <Button onClick={handleOpenProductModal} primary>Browse Products</Button>
            </div>
            {confirmedVariantCount > 0 && (
              <div className="mt-4 max-h-72 overflow-y-auto border border-gray-200 rounded-lg bg-white p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Selected Variants ({confirmedVariantCount})</h4>
                    <div className="divide-y divide-gray-100">
                        {confirmedVariantsData.map(variant => (<SelectedVariantRow key={variant.id} variant={variant} onRemove={handleRemoveVariant} />))}
                    </div>
              </div>
            )}
          </div>
        </div>


        {/* === CARD 2: CUSTOMER SELECTION === */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Customers to apply discount to</h2>
          </div>
          <div className="p-5">
            <h3 className="text-lg font-medium mb-3">Customers</h3>
            <div className="flex items-center space-x-3">
              <div className="relative flex-grow">
                <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Select customers" 
                  value={customerDisplayContent} 
                  readOnly 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-blue-500 focus:ring-opacity-50 cursor-pointer" 
                  onClick={handleOpenCustomerModal}
                />
              </div>
              <Button onClick={handleOpenCustomerModal} primary>Browse Customers</Button>
            </div>
            {confirmedCustomerCount > 0 && (
                <div className="mt-4 max-h-72 overflow-y-auto border border-gray-200 rounded-lg bg-white p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Selected Customers ({confirmedCustomerCount})</h4>
                    <div className="divide-y divide-gray-100">
                        {confirmedCustomersData.map(customer => (<SelectedCustomerRow key={customer.id} customer={customer} onRemove={handleRemoveCustomer} />))}
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals (Product and Customer) */}
      <ProductSelectionModal
        open={isProductModalOpen}
        onClose={handleCloseProductModal}
        productData={productData}
        confirmedIds={confirmedVariantIds}
        onSave={handleConfirmProductSelection}
      />

      <CustomerSelectionModal
        open={isCustomerModalOpen}
        onClose={handleCloseCustomerModal}
        confirmedIds={confirmedCustomerIds}
        onSave={handleConfirmCustomerSelection}
        allCustomers={allCustomers}
      />
    </div>
  );
}