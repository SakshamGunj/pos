import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, CreditCardIcon, BanknotesIcon, BuildingLibraryIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { PaymentMethod } from '../../types/session';
import { formatCurrency } from '../../utils/formatUtils';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (method: PaymentMethod) => void;
  orderTotal: number;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onPaymentComplete,
  orderTotal
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false); // This will largely be bypassed by the main flow

  const handlePayment = () => {
    if (!selectedMethod) return;
    
    onPaymentComplete(selectedMethod); // Propagate to OrderPage
    onClose(); // Close this modal immediately
    // setPaymentCompleted(true); // We are bypassing this internal state for the main flow
  };

  const resetModal = () => {
    setSelectedMethod(null);
    setPaymentCompleted(false);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={resetModal} // Changed to always call resetModal
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {paymentCompleted ? 'Payment Successful' : 'Select Payment Method'}
              </Dialog.Title>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={resetModal}
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            {!paymentCompleted ? (
              <>
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(orderTotal)}</p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    className={`w-full flex items-center p-4 border rounded-lg ${selectedMethod === 'CASH' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setSelectedMethod('CASH')}
                  >
                    <BanknotesIcon className="h-8 w-8 text-green-500 mr-4" />
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">Cash</h3>
                      <p className="text-sm text-gray-500">Pay with physical cash</p>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    className={`w-full flex items-center p-4 border rounded-lg ${selectedMethod === 'UPI' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setSelectedMethod('UPI')}
                  >
                    <CreditCardIcon className="h-8 w-8 text-blue-500 mr-4" />
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">UPI</h3>
                      <p className="text-sm text-gray-500">Pay using UPI apps like Google Pay, PhonePe, etc.</p>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    className={`w-full flex items-center p-4 border rounded-lg ${selectedMethod === 'BANK' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setSelectedMethod('BANK')}
                  >
                    <BuildingLibraryIcon className="h-8 w-8 text-purple-500 mr-4" />
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">Bank Card</h3>
                      <p className="text-sm text-gray-500">Pay with debit or credit card</p>
                    </div>
                  </button>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-md text-sm font-medium text-white ${selectedMethod ? 'bg-primary hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'}`}
                    onClick={handlePayment}
                    disabled={!selectedMethod}
                  >
                    Complete Payment
                  </button>
                </div>
              </>
            ) : (
              // This section will no longer be displayed as part of the primary payment flow
              // because handlePayment now calls onClose() directly.
              // It's kept here for structural completeness or if any other path might set paymentCompleted.
              <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {formatCurrency(orderTotal)} paid via {selectedMethod}
                </p>
                <button
                  type="button"
                  className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700"
                  onClick={resetModal}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default PaymentMethodModal;
