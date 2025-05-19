import React from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface MobileOrderSummaryToggleProps {
  itemCount: number;
  total: number;
  showOrderSummary: boolean;
  setShowOrderSummary: React.Dispatch<React.SetStateAction<boolean>>;
  disabled?: boolean;
}

const MobileOrderSummaryToggle: React.FC<MobileOrderSummaryToggleProps> = ({ 
  itemCount,
  total,
  showOrderSummary,
  setShowOrderSummary,
  disabled = false 
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
      <button
        className="flex items-center justify-between w-full py-3 px-4 sm:px-6 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.1)] border-t border-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={() => setShowOrderSummary(true)}
        disabled={disabled}
      >
        <div className="flex items-center">
          <div className="relative">
            <ShoppingCartIcon className="h-6 w-6 text-primary" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
          <span className="ml-3 font-medium text-neutral">
            {itemCount === 0 ? 'No items' : itemCount === 1 ? '1 item' : `${itemCount} items`}
          </span>
        </div>
        <div className="flex items-center">
          <span className="font-bold text-lg sm:text-xl text-primary mr-3">
            ${total.toFixed(2)}
          </span>
          <div className="bg-primary text-white rounded p-1.5 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </div>
        </div>
      </button>
    </div>
  );
};

export default MobileOrderSummaryToggle; 