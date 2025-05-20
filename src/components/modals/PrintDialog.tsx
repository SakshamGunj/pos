import React, { useRef, useState, useEffect } from 'react';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import { OrderItem, Order } from '../../types';

interface PrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'KOT' | 'BILL';
  orderData: Order;
  itemsToRender?: OrderItem[];
  onPrintComplete?: () => void;
}

const PrintDialog: React.FC<PrintDialogProps> = ({ 
  isOpen, 
  onClose, 
  type, 
  orderData,
  itemsToRender, 
  onPrintComplete
}) => {
  const internalPrintRef = useRef<HTMLDivElement>(null);
  const printButtonRef = useRef<HTMLButtonElement>(null);

  const handleNativePrint = () => {
    window.print();
    if (onPrintComplete) {
      onPrintComplete();
    }
  };

  useEffect(() => {
    if (isOpen && printButtonRef.current) {
      printButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {type === 'KOT' ? 'Print Kitchen Order Ticket' : 'Print Bill Receipt'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <p className="text-gray-600">
              {type === 'KOT' 
                ? 'Print the kitchen order ticket for the kitchen staff.' 
                : 'Print the bill receipt for the customer.'}
            </p>
          </div>

          {/* Print Preview */}
          <div className="border rounded-lg p-4 mb-4 bg-gray-50 overflow-auto max-h-96">
            <div ref={internalPrintRef} id="printable-kot-content" className="p-4 bg-white min-h-[300px]"> 
              {/* KOT Template */}
              {type === 'KOT' && (
                <div className="print-content">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold">Aries Restro and Pub</h3>
                    <h4 className="text-md font-bold">KITCHEN ORDER TICKET</h4>
                    <p className="text-sm">Order #{orderData?.id?.substring(0, 8)}</p>
                    <p className="text-sm">{new Date().toLocaleString()}</p>
                    {orderData?.tableId && <p className="text-sm font-bold">Table: {orderData.tableId}</p>}
                  </div>
                  
                  <div className="border-t border-b py-2 mb-2">
                    <div className="flex justify-between font-bold">
                      <span>Item</span>
                      <span>Qty</span>
                    </div>
                  </div>
                  
                  <div>
                    {(type === 'KOT' && itemsToRender ? itemsToRender : orderData?.orderItems)?.map((item: OrderItem, index: number) => (
                      <div key={item.id || index} className="flex justify-between py-1">
                        <span>{item.menuItem.name}</span>
                        <span>{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  
                  {orderData?.orderNote && (
                    <div className="mt-4 border-t pt-2">
                      <p className="font-bold">Notes:</p>
                      <p>{orderData.orderNote}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Bill Receipt Template */}
              {type === 'BILL' && (
                <div className="print-content">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold">Aries Restro and Pub</h3>
                    <h4 className="text-md font-bold">BILL RECEIPT</h4>
                    <p className="text-sm">Invoice #{orderData?.id?.substring(0, 8)}</p>
                    <p className="text-sm">{new Date().toLocaleString()}</p>
                    {orderData?.tableId && <p className="text-sm">Table: {orderData.tableId}</p>}
                    <p className="text-sm mt-2">FSSAI: 22324001000445</p>
                    <p className="text-sm">GSTIN: 11FYPS5496A1ZT</p>
                  </div>
                  
                  <div className="border-t border-b py-2 mb-2">
                    <div className="grid grid-cols-12 font-bold">
                      <span className="col-span-6">Item</span>
                      <span className="col-span-2 text-right">Price</span>
                      <span className="col-span-2 text-right">Qty</span>
                      <span className="col-span-2 text-right">Total</span>
                    </div>
                  </div>
                  
                  <div>
                    {orderData?.orderItems?.map((item: any, index: number) => (
                      <div key={index} className="grid grid-cols-12 py-1">
                        <span className="col-span-6">{item.menuItem.name}</span>
                        <span className="col-span-2 text-right">₹{item.priceAtAddition.toFixed(2)}</span>
                        <span className="col-span-2 text-right">{item.quantity}</span>
                        <span className="col-span-2 text-right">₹{(item.priceAtAddition * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t mt-4 pt-2">
                    <div className="flex justify-between py-1">
                      <span>Subtotal:</span>
                      <span>₹{orderData?.subtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>CGST (9%):</span>
                      <span>₹{((orderData?.subtotal || 0) * 0.09).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>SGST (9%):</span>
                      <span>₹{((orderData?.subtotal || 0) * 0.09).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold">
                      <span>Total:</span>
                      <span>₹{orderData?.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  
                  <div className="text-center mt-6 text-sm">
                    <p>Thank you for dining at Aries Restro and Pub!</p>
                    <p>Visit us again soon.</p>
                    <p className="mt-2">Powered by Aries POS</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              id="print-button"
              ref={printButtonRef}
              onClick={handleNativePrint}
              className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
            >
              <PrinterIcon className="h-5 w-5 mr-1" />
              Print {type}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintDialog;
