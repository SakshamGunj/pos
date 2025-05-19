/**
 * Utility functions for printing KOT (Kitchen Order Tickets) and bills
 */

import { OrderItem } from '../types';
import { formatCurrency } from './formatUtils';

/**
 * Print a Kitchen Order Ticket (KOT)
 * @param order - The order object
 * @param onlyNewItems - Whether to print only items that haven't been printed before
 */
export const printKOT = (order: { orderItems: OrderItem[], tableId: string, orderNote?: string, id: string }, onlyNewItems: boolean = false) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to print KOT');
    return;
  }

  // Current date and time
  const now = new Date();
  const dateTimeString = `${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN')}`;

  // Extract values from the order object
  const { tableId, orderItems, orderNote = '', id } = order;
  
  // Filter items based on the onlyNewItems flag
  const itemsToPrint = onlyNewItems
    ? orderItems.filter(item => !item.kotPrinted)
    : orderItems;
  
  // If there are no items to print, show a notification and return
  if (itemsToPrint.length === 0) {
    alert('No new items to print on KOT');
    return;
  }

  // Generate KOT HTML content
  const kotContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kitchen Order Ticket</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          width: 80mm; /* Standard thermal receipt width */
          margin: 0;
          padding: 10px;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .kot-info {
          display: flex;
          justify-content: space-between;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 5px 0;
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          text-align: left;
          padding: 5px 0;
        }
        .item-qty {
          text-align: center;
          font-weight: bold;
        }
        .notes {
          margin-top: 10px;
          border-top: 1px dashed #000;
          padding-top: 5px;
          font-style: italic;
        }
        @media print {
          body { width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>KITCHEN ORDER TICKET</div>
        <div>Order #${id.slice(-6)}</div>
      </div>
      <div class="kot-info">
        <div>Table: ${tableId}</div>
        <div>${dateTimeString}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Qty</th>
            <th>Item</th>
          </tr>
        </thead>
        <tbody>
          ${itemsToPrint.map(item => `
            <tr>
              <td class="item-qty">${item.quantity}x</td>
              <td>${item.menuItem.name}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${orderNote ? `<div class="notes">Notes: ${orderNote}</div>` : ''}
    </body>
    </html>
  `;

  // Write the content to the new window and print
  printWindow.document.open();
  printWindow.document.write(kotContent);
  printWindow.document.close();

  // Wait for content to load before printing
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
  
  // Return the items that were printed, so they can be marked as printed
  return itemsToPrint;
};

/**
 * Print a bill/receipt
 * @param order - The order object
 */
export const printBill = (order: { orderItems: OrderItem[], tableId: string, orderNote?: string, id: string, subtotal: number, taxAmount: number, totalAmount: number }) => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to print bill');
    return;
  }

  // Extract values from the order object
  const { tableId, orderItems, orderNote = '', id, subtotal, taxAmount, totalAmount } = order;

  // Current date and time
  const now = new Date();
  const dateTimeString = `${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN')}`;
  const invoiceNumber = `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  // Generate bill HTML content
  const billContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          width: 80mm; /* Standard thermal receipt width */
          margin: 0;
          padding: 10px;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .restaurant-name {
          font-size: 1.2em;
          font-weight: bold;
        }
        .bill-info {
          display: flex;
          justify-content: space-between;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 5px 0;
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          text-align: left;
          padding: 3px 0;
        }
        .amount {
          text-align: right;
        }
        .total-line {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 10px;
          font-size: 0.8em;
        }
        .notes {
          margin-top: 10px;
          font-style: italic;
          font-size: 0.9em;
        }
        @media print {
          body { width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="restaurant-name">ARIES POS RESTAURANT</div>
        <div>123 Main Street, City</div>
        <div>Tel: (123) 456-7890</div>
      </div>
      <div class="bill-info">
        <div>Table: ${tableId}</div>
        <div>Invoice: ${invoiceNumber}</div>
      </div>
      <div class="bill-info">
        <div>Date: ${dateTimeString}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th class="amount">Price</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${orderItems.map(item => `
            <tr>
              <td>${item.menuItem.name}</td>
              <td>${item.quantity}</td>
              <td class="amount">${formatCurrency(item.priceAtAddition)}</td>
              <td class="amount">${formatCurrency(item.priceAtAddition * item.quantity)}</td>
            </tr>
          `).join('')}
          <tr class="total-line">
            <td colspan="3">Subtotal</td>
            <td class="amount">${formatCurrency(subtotal)}</td>
          </tr>
          <tr>
            <td colspan="3">Tax (5%)</td>
            <td class="amount">${formatCurrency(taxAmount)}</td>
          </tr>
          <tr class="total-line">
            <td colspan="3">TOTAL</td>
            <td class="amount">${formatCurrency(totalAmount)}</td>
          </tr>
        </tbody>
      </table>
      ${orderNote ? `<div class="notes">Notes: ${orderNote}</div>` : ''}
      <div class="footer">
        <p>Thank you for dining with us!</p>
        <p>Please come again</p>
      </div>
    </body>
    </html>
  `;

  // Write the content to the new window and print
  printWindow.document.open();
  printWindow.document.write(billContent);
  printWindow.document.close();

  // Wait for content to load before printing
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};
