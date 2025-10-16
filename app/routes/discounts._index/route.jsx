// @ts-nocheck
import React, { useState, useCallback, useMemo } from 'react';
import { useLoaderData } from '@remix-run/react';
import { getAllVariants, loader } from '../../utils/discountCreation';
import Button from './components/ui/Button';
import DiscountSettingsCard from './components/discount-settings/DiscountSettingsCard';
import ProductSelectionModal from './components/product-selection/ProductSelectionModal';
import CustomerSelectionModal from './components/customer-selection/CustomerSelectionModal';
import SelectedVariantRow from './components/product-selection/SelectedVariantRow';
import SelectedCustomerRow from './components/customer-selection/SelectedCustomerRow';

export { loader };

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
  }, [confirmedVariantIds, allVariants]);
  
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
  }, [confirmedCustomerIds, allCustomers]);

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

  // --- Save and Cancel Handlers ---
  const handleSave = useCallback(() => {
    // Prepare all data for console
    const discountData = {
      discountSettings: {
        ...discountState,
        // Convert Sets to Arrays for better readability
        selectedVariants: Array.from(confirmedVariantIds),
        selectedCustomers: Array.from(confirmedCustomerIds),
      },
      selectedVariantsDetails: confirmedVariantsData.map(variant => ({
        id: variant.id,
        title: variant.title,
        price: variant.price,
        productTitle: variant.productTitle,
        productImage: variant.productImage
      })),
      selectedCustomersDetails: confirmedCustomersData.map(customer => ({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email
      })),
      summary: {
        totalVariants: confirmedVariantCount,
        totalCustomers: confirmedCustomerCount,
        discountValue: `${discountState.value}${discountState.valueType === 'Percentage' ? '%' : '₹'}`,
        discountMethod: discountState.method,
        discountCode: discountState.method === 'Discount code' ? discountState.code : 'N/A (Automatic)'
      }
    };

    // Console log all the data
    console.log('=== DISCOUNT DATA TO BE SAVED ===');
    console.log('Discount Settings:', discountState);
    console.log('Selected Variant IDs:', Array.from(confirmedVariantIds));
    console.log('Selected Customer IDs:', Array.from(confirmedCustomerIds));
    console.log('Selected Variants Details:', confirmedVariantsData);
    console.log('Selected Customers Details:', confirmedCustomersData);
    console.log('Summary:', discountData.summary);
    console.log('Full Discount Data Object:', discountData);
    console.log('=== END OF DISCOUNT DATA ===');

    // Here you would typically send this data to your backend API
    // Example: 
    // fetch('/api/discounts', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(discountData)
    // })

    // Show success message (you can replace this with a toast notification)
    alert('Discount saved successfully! Check console for all data.');
  }, [discountState, confirmedVariantIds, confirmedCustomerIds, confirmedVariantsData, confirmedCustomersData, confirmedVariantCount, confirmedCustomerCount]);

  const handleCancel = useCallback(() => {
    // Reset all form data
    setConfirmedVariantIds(new Set());
    setConfirmedCustomerIds(new Set());
    setDiscountState({
      method: 'Discount code',
      code: 'SUMMER20',
      valueType: 'Percentage',
      value: 20,
      minimumRequirement: {
        type: 'none',
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
    
    alert('Form has been reset!');
  }, []);

  // Check if form has any data to enable Save button
  const hasFormData = useMemo(() => {
    return confirmedVariantCount > 0 || confirmedCustomerCount > 0 || 
           discountState.value > 0 || discountState.code !== 'SUMMER20';
  }, [confirmedVariantCount, confirmedCustomerCount, discountState.value, discountState.code]);


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

        {/* === SAVE AND CANCEL BUTTONS === */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex justify-end space-x-4">
            <Button 
              onClick={handleCancel}
              disabled={!hasFormData}
            >
              Cancel
            </Button>
            <Button 
              primary 
              onClick={handleSave}
              disabled={!hasFormData}
            >
              Save Discount
            </Button>
          </div>
          {!hasFormData && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Fill in some data to enable Save button
            </p>
          )}
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