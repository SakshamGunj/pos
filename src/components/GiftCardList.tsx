import React from 'react';
import { GiftCard, GiftCardStatus } from '../types'; // Assuming GiftCardStatus might be used for display
import { PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface GiftCardListProps {
  giftCards: GiftCard[];
  onEdit: (giftCard: GiftCard) => void;
  onToggleActive: (giftCard: GiftCard) => void;
  // onDelete: (giftCardId: string) => void; // Optional: if hard delete is needed
}

const GiftCardList: React.FC<GiftCardListProps> = ({ giftCards, onEdit, onToggleActive }) => {
  if (!giftCards || giftCards.length === 0) {
    return <p className="text-center text-gray-500 py-4">No gift cards found. Create one to get started!</p>;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
      <ul role="list" className="divide-y divide-gray-200">
        {giftCards.map((card) => (
          <li key={card.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="truncate">
                <p className="text-sm font-medium text-purple-600 truncate">Code: {card.code}</p>
                <p className="text-xs text-gray-500 truncate">
                  Balance: <span className="font-semibold text-gray-700">${card.currentBalance.toFixed(2)}</span> (Initial: ${card.initialBalance.toFixed(2)})
                </p>
              </div>
              <div className="ml-2 flex-shrink-0 flex space-x-2 items-center">
                <span 
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${card.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {card.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="mt-2 sm:flex sm:justify-between">
              <div className="sm:flex">
                <p className="flex items-center text-xs text-gray-500">
                  Issued to: {card.issuedTo || 'N/A'}
                </p>
                <p className="mt-1 flex items-center text-xs text-gray-500 sm:mt-0 sm:ml-4">
                  Universal: {card.isUniversal ? 'Yes' : 'No'}
                </p>
                <p className="mt-1 flex items-center text-xs text-gray-500 sm:mt-0 sm:ml-4">
                  Valid From: {formatDate(card.validFrom)}
                </p>
                <p className="mt-1 flex items-center text-xs text-gray-500 sm:mt-0 sm:ml-4">
                  Expires At: {formatDate(card.expiresAt)}
                </p>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 space-x-2">
                <button
                  onClick={() => onEdit(card)}
                  className="text-purple-600 hover:text-purple-900 p-1 rounded-md hover:bg-purple-100 transition-colors"
                  title="Edit Gift Card"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onToggleActive(card)}
                  className={`${card.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} p-1 rounded-md ${card.isActive ? 'hover:bg-yellow-100' : 'hover:bg-green-100'} transition-colors`}
                  title={card.isActive ? 'Deactivate Gift Card' : 'Activate Gift Card'}
                >
                  {card.isActive ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
                {/* <button
                  onClick={() => onDelete(card.id)}
                  className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-100 transition-colors"
                  title="Delete Gift Card"
                >
                  <TrashIcon className="h-5 w-5" />
                </button> */}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GiftCardList;
