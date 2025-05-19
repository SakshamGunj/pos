import React, { useState, useEffect } from 'react';
import { GiftCard, GiftCardStatus } from '../../types'; // Assuming GiftCardStatus might be 'Active', 'Used', 'Expired'
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreateGiftCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (giftCard: GiftCard) => void;
  existingGiftCard?: GiftCard | null;
}

const CreateGiftCardModal: React.FC<CreateGiftCardModalProps> = ({ isOpen, onClose, onSave, existingGiftCard }) => {
  const [initialBalance, setInitialBalance] = useState<number | string>('');
  const [code, setCode] = useState('');
  const [issuedTo, setIssuedTo] = useState('');
  const [isUniversal, setIsUniversal] = useState(true);
  const [validFrom, setValidFrom] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Function to generate a random gift card code (example)
  const generateGiftCardCode = () => {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `GC-${randomPart}`;
  };

  useEffect(() => {
    if (existingGiftCard) {
      setInitialBalance(existingGiftCard.initialBalance);
      setCode(existingGiftCard.code);
      setIssuedTo(existingGiftCard.issuedTo || '');
      setIsUniversal(existingGiftCard.isUniversal === undefined ? true : existingGiftCard.isUniversal);
      setValidFrom(existingGiftCard.validFrom ? new Date(existingGiftCard.validFrom).toISOString().split('T')[0] : '');
      setExpiresAt(existingGiftCard.expiresAt ? new Date(existingGiftCard.expiresAt).toISOString().split('T')[0] : '');
      setIsActive(existingGiftCard.isActive);
    } else {
      // Reset form for new gift card
      setInitialBalance('');
      setCode(generateGiftCardCode()); // Auto-generate code for new cards
      setIssuedTo('');
      setIsUniversal(true);
      setValidFrom('');
      setExpiresAt('');
      setIsActive(true);
    }
  }, [isOpen, existingGiftCard]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newGiftCard: GiftCard = {
      id: existingGiftCard?.id || `gc_${new Date().getTime()}`,
      code,
      initialBalance: Number(initialBalance),
      currentBalance: existingGiftCard?.currentBalance !== undefined ? existingGiftCard.currentBalance : Number(initialBalance),
      issuedTo: issuedTo || undefined,
      isUniversal: isUniversal,
      validFrom: validFrom || undefined,
      expiresAt: expiresAt || undefined,
      isActive: isActive,
      redemptionHistory: existingGiftCard?.redemptionHistory || [],
      createdAt: existingGiftCard?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(newGiftCard);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{existingGiftCard ? 'Edit Gift Card' : 'Create Gift Card'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="initialBalance" className="block text-sm font-medium text-gray-700">Initial Balance *</label>
            <input type="number" id="initialBalance" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} required min="0.01" step="0.01"
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-grow">
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">Gift Card Code *</label>
                <input type="text" id="code" value={code} onChange={(e) => setCode(e.target.value)} required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-gray-50" />
            </div>
            <button type="button" onClick={() => setCode(generateGiftCardCode())} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-500 hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 h-10">
                Generate
            </button>
          </div>

          <div>
            <label htmlFor="issuedTo" className="block text-sm font-medium text-gray-700">Issued To (Customer ID/Name - Optional)</label>
            <input type="text" id="issuedTo" value={issuedTo} onChange={(e) => setIssuedTo(e.target.value)}
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700">Valid From (Optional)</label>
              <input type="date" id="validFrom" value={validFrom} onChange={(e) => setValidFrom(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700">Expires At (Optional)</label>
              <input type="date" id="expiresAt" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
            </div>
          </div>

          {/* Is Universal Toggle */}
          <div className="flex items-center justify-between mt-4 py-3 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Usable by Anyone (Universal)</span>
            <button
              type="button"
              onClick={() => setIsUniversal(!isUniversal)}
              className={`${isUniversal ? 'bg-purple-600' : 'bg-gray-300'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
            >
              <span className={`${isUniversal ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
            </button>
          </div>
          
          {/* Is Active Toggle */}
          <div className="flex items-center justify-between mt-4 py-3 border-t border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Gift Card Active</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`${isActive ? 'bg-purple-600' : 'bg-gray-300'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
            >
              <span className={`${isActive ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
            </button>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              {existingGiftCard ? 'Save Changes' : 'Create Gift Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGiftCardModal;
