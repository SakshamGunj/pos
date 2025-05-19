import React, { useState, useEffect } from 'react';
import { Coupon, GiftCard, Customer } from '../../types'; // Assuming Customer type exists
import { XMarkIcon, CheckCircleIcon, TicketIcon, GiftIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface RedemptionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedCustomerId: string, item: Coupon | GiftCard) => void;
  item: Coupon | GiftCard | null;
  // Mock customers for now - replace with actual customer data source
  customers: Pick<Customer, 'id' | 'name'>[]; 
}

// Helper to check if item is a Coupon
const isCoupon = (item: Coupon | GiftCard): item is Coupon => {
  return (item as Coupon).type !== undefined;
};

const RedemptionConfirmationModal: React.FC<RedemptionConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  item,
  customers
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  useEffect(() => {
    // Reset selected customer when modal opens or item changes
    if (isOpen && customers.length > 0) {
      setSelectedCustomerId(customers[0].id); // Default to first customer or handle no customers
    } else if (!isOpen) {
      setSelectedCustomerId('');
    }
  }, [isOpen, customers, item]);

  if (!isOpen || !item) return null;

  const handleConfirm = () => {
    if (!selectedCustomerId && !isCoupon(item) && !(item as GiftCard).isUniversal) {
      alert('Please select a customer for this non-universal gift card.');
      return;
    }
    // For coupons, customer selection might be optional or used for per-user limits
    onConfirm(selectedCustomerId, item);
  };

  const renderItemDetails = () => {
    if (isCoupon(item)) {
      return (
        <div className='space-y-2'>
          <p><strong>Type:</strong> Coupon</p>
          <p><strong>Name:</strong> {item.name}</p>
          <p><strong>Description:</strong> {item.description || 'N/A'}</p>
          <p><strong>Value:</strong> {item.value ? `$${item.value.toFixed(2)}` : `${item.percentage}%`}</p>
          {item.minPurchaseAmount && <p><strong>Min. Purchase:</strong> ${item.minPurchaseAmount.toFixed(2)}</p>}
          {item.validUntil && <p><strong>Expires:</strong> {new Date(item.validUntil).toLocaleDateString()}</p>}
        </div>
      );
    } else {
      return (
        <div className='space-y-2'>
          <p><strong>Type:</strong> Gift Card</p>
          <p><strong>Initial Balance:</strong> ${item.initialBalance.toFixed(2)}</p>
          <p><strong>Current Balance:</strong> ${item.currentBalance.toFixed(2)}</p>
          {item.expiresAt && <p><strong>Expires:</strong> {new Date(item.expiresAt).toLocaleDateString()}</p>}
          <p><strong>Universal:</strong> {item.isUniversal ? 'Yes' : 'No'}</p>
          {!item.isUniversal && <p><strong>Issued To:</strong> {item.issuedTo || 'N/A'}</p>}
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out" style={{ opacity: isOpen ? 1 : 0 }}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg transform transition-all duration-300 ease-in-out" style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            {isCoupon(item) ? <TicketIcon className="h-6 w-6 mr-2 text-purple-600" /> : <GiftIcon className="h-6 w-6 mr-2 text-green-600" />}
            Confirm Redemption
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h4 className="text-md font-medium text-gray-700 mb-2">Details for Code: <span className='font-bold text-indigo-600'>{item.code}</span></h4>
          {renderItemDetails()}
        </div>

        <div className="mb-6">
          <label htmlFor="customerSelect" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <UserCircleIcon className='h-5 w-5 mr-1 text-gray-500' />
            Select Customer for Redemption:
          </label>
          <select 
            id="customerSelect"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            // Disable if coupon doesn't require customer or gift card is universal
            disabled={ (isCoupon(item) && item.assignedTo === 'all_customers') || (!isCoupon(item) && (item as GiftCard).isUniversal) }
          >
            { (isCoupon(item) && item.assignedTo === 'all_customers') || (!isCoupon(item) && (item as GiftCard).isUniversal) ? 
                <option value="">Not Required (Universal / All Customers)</option> 
                : customers.length === 0 ? 
                <option value="">No customers available</option>
                : null
            }
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>{customer.name} (ID: {customer.id})</option>
            ))}
          </select>
          { (!isCoupon(item) && !(item as GiftCard).isUniversal && !selectedCustomerId && customers.length > 0) && 
            <p className='text-xs text-red-500 mt-1'>Customer selection is required for this non-universal gift card.</p> }
        </div>

        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center transition-colors"
            // Disable confirm if customer needed but not selected for non-universal gift card
            disabled={!isCoupon(item) && !(item as GiftCard).isUniversal && !selectedCustomerId && customers.length > 0}
          >
            <CheckCircleIcon className='h-5 w-5 mr-2' />
            Confirm Redemption
          </button>
        </div>
      </div>
    </div>
  );
}

export default RedemptionConfirmationModal;
