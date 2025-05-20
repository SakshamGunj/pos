import React, { useRef, useEffect } from 'react';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
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
    <>
      {/* Standard style tag for print CSS */}
      <style>
        {`
          @media print {
            /* --- RESTORING PRINT CSS --- */

            body * {
              visibility: hidden !important; /* Hide everything on the page */
            }

            .printable-area,
            .printable-area * {
              visibility: visible !important; /* Make the printable area and its children visible */
            }

            .printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%; /* For screen preview, will be constrained by thermal printer width in reality */
              /* For thermal printers, width is usually fixed, e.g., 72mm or 58mm. */
              /* This CSS will be for general printing; actual thermal output depends on printer driver. */
              /* We can simulate a narrow width for the preview if desired later. */
              background-color: white !important;
              padding: 3mm; /* Minimal padding for thermal */
              box-sizing: border-box;
              font-family: 'Arial', sans-serif; /* Common font */
              font-size: 9pt; /* Typical for thermal receipts */
              color: #000 !important;
              /* Remove red border, it was for testing */
            }

            .no-print {
              display: none !important;
            }

            .print-content {
              width: 100%;
              color: #000 !important;
            }

            .print-content h3, 
            .print-content h4, 
            .print-content p, 
            .print-content span, 
            .print-content div,
            .print-content table,
            .print-content th,
            .print-content td {
              color: #000 !important;
              background-color: transparent !important; /* Ensure no unwanted backgrounds */
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            
            /* Specific styles for bill elements - can be expanded */
            .bill-header {
              text-align: center;
              margin-bottom: 5mm;
            }
            .bill-header h3 {
              font-size: 14pt;
              font-weight: bold;
              margin: 0;
            }
            .bill-header p {
              font-size: 8pt;
              margin: 1mm 0;
            }

            .bill-items table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 3mm;
            }
            .bill-items th, .bill-items td {
              padding: 1mm;
              text-align: left;
              font-size: 8pt;
            }
            .bill-items th.qty, .bill-items td.qty { text-align: center; }
            .bill-items th.price, .bill-items td.price { text-align: right; }
            .bill-items th.total, .bill-items td.total { text-align: right; }

            .bill-summary {
              margin-top: 3mm;
              font-size: 8pt;
            }
            .bill-summary .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 0.5mm 0;
            }
            .bill-summary .grand-total {
              font-weight: bold;
              font-size: 10pt;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 1mm 0;
            }

            .bill-footer {
              text-align: center;
              margin-top: 5mm;
              font-size: 8pt;
            }

            hr.dashed {
                border: none;
                border-top: 1px dashed #000;
                margin: 2mm 0;
            }

            /* Commented out original rules, will re-evaluate if needed */
            /*
            .printable-area .bill-content-wrapper,
            .printable-area .bill-content-wrapper * {
                visibility: visible !important;
                color: #000 !important; 
                background-color: transparent !important; 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
            }
            .print-test-element {
                color: #000 !important;
                visibility: visible !important;
                font-weight: bold;
                margin-top: 10px;
                border: 1px dashed #000;
                padding: 5px;
            }
            */
          }
        `}
      </style>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 no-print">
        {/* Removed 'no-print' from this div to allow its children to be controlled by print visibility rules */}
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="flex justify-between items-center p-4 border-b no-print">
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
            <div className="border rounded-lg p-1 mb-4 bg-gray-50 overflow-auto max-h-96">
              <div ref={internalPrintRef} id="printable-content-wrapper" className="printable-area p-4 bg-white min-h-[280px]">  
                {/* KOT Template */}
                {type === 'KOT' && (
                  <div className="print-content">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold">Aries Restro and Pub</h3>
                      <h4 className="text-md font-bold">KITCHEN ORDER TICKET</h4>
                      <p className="text-xs">Order ID: {orderData?.id || 'N/A'}</p>
                      <p className="text-xs">Table: {orderData?.tableId || 'N/A'}</p>
                      <p className="text-xs">Date: {new Date(orderData?.orderDate).toLocaleString()}</p>
                    </div>
                    <hr className="my-2 border-dashed" />
                    <div className="font-semibold mb-1">Items:</div>
                    {(itemsToRender || orderData?.orderItems)?.map((item: OrderItem, index: number) => (
                      <div key={index} className="flex justify-between py-0.5 text-xs">
                        <span>{item.menuItem.name}</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    ))}
                    {orderData?.orderNote && (
                        <>
                            <hr className="my-2 border-dashed" />
                            <p className="text-xs font-semibold">Note: {orderData.orderNote}</p>
                        </>
                    )}
                  </div>
                )}

                {/* Bill Template */}
                {type === 'BILL' && (
                  <>
                    {(() => {
                      if (!orderData) {
                        // This case should ideally not happen if UI prevents printing without data
                        return <p style={{ color: 'red' }}>Error: No order data available for printing.</p>;
                      }
                      // Log only if orderData is present
                      console.log('Bill PrintDialog - orderData:', JSON.stringify(orderData, null, 2));
                      return null; // console.log is a side-effect
                    })()}

                    {orderData && (
                      <div className="print-content bill-content-wrapper">
                        <div className="bill-header">
                          <h3>Aries Restro and Pub</h3>
                          <p>New Baner, Pune</p>
                          <p>Phone: (555) 123-4567</p>
                          <hr className="dashed" />
                          <h4>TAX INVOICE</h4>
                          <p>Invoice ID: {orderData.id || 'N/A'}</p>
                          <p>Date: {new Date(orderData.orderDate).toLocaleString()}</p>
                          {orderData.tableId && <p>Table: {orderData.tableId}</p>}
                        </div>
                        
                        <div className="bill-items">
                          <table>
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th className="price">Price</th>
                                <th className="qty">Qty</th>
                                <th className="total">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderData?.orderItems?.map((item: any, index: number) => (
                                <tr key={index}>
                                  <td>{item.menuItem.name}</td>
                                  <td className="price">{item.priceAtAddition.toFixed(2)}</td>
                                  <td className="qty">{item.quantity}</td>
                                  <td className="total">{(item.priceAtAddition * item.quantity).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <hr className="dashed" />
                        <div className="bill-summary">
                          <div className="summary-row">
                            <span>Subtotal:</span>
                            <span>₹{orderData?.subtotal?.toFixed(2) || '0.00'}</span>
                          </div>
                          {orderData.taxAmount > 0 && (
                            <>
                              <div className="summary-row">
                                <span>CGST:</span> 
                                <span>₹{(orderData.taxAmount / 2).toFixed(2)}</span>
                              </div>
                              <div className="summary-row">
                                <span>SGST:</span>
                                <span>₹{(orderData.taxAmount / 2).toFixed(2)}</span>
                              </div>
                            </>
                          )}
                          <div className="summary-row grand-total">
                            <span>GRAND TOTAL:</span>
                            <span>₹{orderData?.totalAmount?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                        
                        <hr className="dashed" />
                        <div className="bill-footer">
                          <p>Thank you for your visit!</p>
                          <p>FSSAI: 22324001000445</p>
                          <p>GSTIN: 11FYPS5496A1ZT</p>
                          <p>Powered by Aries POS</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4 p-4 border-t no-print">
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
    </>
  );
};

export default PrintDialog;
