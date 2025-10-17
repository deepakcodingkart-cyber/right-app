// @ts-nocheck
import React, { useState, useCallback, useMemo } from 'react';
import { useLoaderData } from '@remix-run/react';
import { getAllVariants, loader, action } from '../../utils/discountCreation';
import Button from './components/ui/Button';
import DiscountSettingsCard from './components/discount-settings/DiscountSettingsCard';
import ProductSelectionModal from './components/product-selection/ProductSelectionModal';
import CustomerSelectionModal from './components/customer-selection/CustomerSelectionModal';
import SelectedVariantRow from './components/product-selection/SelectedVariantRow';
import SelectedCustomerRow from './components/customer-selection/SelectedCustomerRow';

export { loader };

export default function DiscountProductSelector() {
  const loaderData = useLoaderData();
  const allCustomers = loaderData?.customers?.customers || [];
  const initialProducts = loaderData?.products?.products || [];

  const allVariants = getAllVariants(initialProducts);
  const [productData] = useState(initialProducts);

  // --- Product Selection ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [confirmedVariantIds, setConfirmedVariantIds] = useState(new Set());

  const handleOpenProductModal = useCallback(() => setIsProductModalOpen(true), []);
  const handleCloseProductModal = useCallback(() => setIsProductModalOpen(false), []);

  const handleConfirmProductSelection = useCallback((newIds) => {
    setConfirmedVariantIds(newIds);
    setIsProductModalOpen(false);
  }, []);

  const handleRemoveVariant = useCallback((variantId) => {
    setConfirmedVariantIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(variantId);
      return newSet;
    });
  }, []);

  const confirmedVariantsData = useMemo(() => {
    return allVariants.filter(v => confirmedVariantIds.has(v.id));
  }, [confirmedVariantIds, allVariants]);

  const productDisplayContent = useMemo(() => {
    if (confirmedVariantsData.length === 0) return 'Select products and variants';
    if (confirmedVariantsData.length === 1)
      return `${confirmedVariantsData[0].productTitle} (${confirmedVariantsData[0].title})`;
    return `${confirmedVariantsData.length} variants selected`;
  }, [confirmedVariantsData]);

  // --- Customer Selection ---
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [confirmedCustomerIds, setConfirmedCustomerIds] = useState(new Set());

  const handleOpenCustomerModal = useCallback(() => setIsCustomerModalOpen(true), []);
  const handleCloseCustomerModal = useCallback(() => setIsCustomerModalOpen(false), []);

  const handleConfirmCustomerSelection = useCallback((newIds) => {
    setConfirmedCustomerIds(newIds);
    setIsCustomerModalOpen(false);
  }, []);

  const handleRemoveCustomer = useCallback((customerId) => {
    setConfirmedCustomerIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(customerId);
      return newSet;
    });
  }, []);

  const confirmedCustomersData = useMemo(() => {
    return allCustomers.filter(c => confirmedCustomerIds.has(c.id));
  }, [confirmedCustomerIds, allCustomers]);

  const customerDisplayContent = useMemo(() => {
    if (confirmedCustomersData.length === 0) return 'Select customers';
    if (confirmedCustomersData.length === 1) return confirmedCustomersData[0].firstName;
    return `${confirmedCustomersData.length} customers selected`;
  }, [confirmedCustomersData]);

  // --- Discount Settings ---
  const [discountState, setDiscountState] = useState({
    method: 'Discount code',
    code: '',
    valueType: 'Percentage', // "Percentage" or "Fixed"
    value: '',
    minimumRequirement: { type: 'none', value: '' },
    maxUses: { limitTotal: false, totalCount: '', limitPerCustomer: false },
    combinations: { product: false, order: false, shipping: false },
    activeDates: { startDate: '', startTime: '', setEndDate: false, endDate: '', endTime: '' },
  });

  // --- Save Handler ---
  const handleSave = useCallback(async () => {
    if (!discountState.code || !discountState.value) {
      alert('Please enter discount code and value.');
      return;
    }

    if (confirmedVariantsData.length === 0) {
      alert('Please select at least one product variant.');
      return;
    }

    if (confirmedCustomersData.length === 0) {
      alert('Please select at least one customer.');
      return;
    }

    const discountData = {
      discountSettings: {
        ...discountState,
        selectedVariants: Array.from(confirmedVariantIds),
        selectedCustomers: Array.from(confirmedCustomerIds),
      },
      selectedVariantsDetails: confirmedVariantsData.map(v => ({
        id: v.id,
        title: v.title,
        price: v.price,
        productTitle: v.productTitle,
        productImage: v.productImage,
      })),
      selectedCustomersDetails: confirmedCustomersData.map(c => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
      })),
    };

    try {
      const response = await action(discountData);
      console.log('✅ Discount created successfully:', response);
      alert('Discount saved successfully!');
    } catch (err) {
      console.error('❌ Error creating discount:', err);
      alert('Failed to save discount. Check console for details.');
    }
  }, [discountState, confirmedVariantsData, confirmedCustomersData, confirmedVariantIds, confirmedCustomerIds]);

  // --- Cancel / Reset ---
  const handleCancel = useCallback(() => {
    setConfirmedVariantIds(new Set());
    setConfirmedCustomerIds(new Set());
    setDiscountState({
      method: 'Discount code',
      code: '',
      valueType: 'Percentage',
      value: '',
      minimumRequirement: { type: 'none', value: '' },
      maxUses: { limitTotal: false, totalCount: '', limitPerCustomer: false },
      combinations: { product: false, order: false, shipping: false },
      activeDates: { startDate: '', startTime: '', setEndDate: false, endDate: '', endTime: '' },
    });
  }, []);

  const hasFormData = useMemo(() => {
    return (
      confirmedVariantsData.length > 0 ||
      confirmedCustomersData.length > 0 ||
      discountState.code !== '' ||
      discountState.value !== ''
    );
  }, [confirmedVariantsData, confirmedCustomersData, discountState]);

  // --- Main Render ---
  return (
    <div className="p-6 bg-gray-100 min-h-screen font-sans">
      <script src="https://cdn.tailwindcss.com"></script>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Create Discount</h1>

      <div className="max-w-3xl mx-auto space-y-6">
        <DiscountSettingsCard discountState={discountState} setDiscountState={setDiscountState} />
        <hr className="border-gray-300" />

        {/* Product Selection */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Products to apply discount to</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center space-x-3">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Select products and variants"
                  value={productDisplayContent}
                  readOnly
                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer"
                  onClick={handleOpenProductModal}
                />
              </div>
              <Button onClick={handleOpenProductModal} primary>Browse Products</Button>
            </div>

            {confirmedVariantsData.length > 0 && (
              <div className="mt-4 max-h-72 overflow-y-auto border border-gray-200 rounded-lg bg-white p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Selected Variants ({confirmedVariantsData.length})
                </h4>
                <div className="divide-y divide-gray-100">
                  {confirmedVariantsData.map(v => (
                    <SelectedVariantRow key={v.id} variant={v} onRemove={handleRemoveVariant} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Selection */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Customers to apply discount to</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center space-x-3">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Select customers"
                  value={customerDisplayContent}
                  readOnly
                  className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer"
                  onClick={handleOpenCustomerModal}
                />
              </div>
              <Button onClick={handleOpenCustomerModal} primary>Browse Customers</Button>
            </div>

            {confirmedCustomersData.length > 0 && (
              <div className="mt-4 max-h-72 overflow-y-auto border border-gray-200 rounded-lg bg-white p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Selected Customers ({confirmedCustomersData.length})
                </h4>
                <div className="divide-y divide-gray-100">
                  {confirmedCustomersData.map(c => (
                    <SelectedCustomerRow key={c.id} customer={c} onRemove={handleRemoveCustomer} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save / Cancel */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex justify-end space-x-4">
          <Button onClick={handleCancel} disabled={!hasFormData}>Cancel</Button>
          <Button primary onClick={handleSave} disabled={!hasFormData}>Save Discount</Button>
        </div>
      </div>

      {/* Modals */}
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
