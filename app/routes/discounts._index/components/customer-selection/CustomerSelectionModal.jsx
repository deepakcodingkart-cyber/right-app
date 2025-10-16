// @ts-nocheck
import React, { useState, useCallback, useMemo } from 'react';
import Modal from '../ui/Modal';
import CustomerRow from './CustomerRow';

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

        <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2 divide-y divide-gray-100">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => (
              <CustomerRow
                key={customer.id}
                customer={{
                  ...customer,
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

export default CustomerSelectionModal;