import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MenuItem, OrderItem, Order, MenuCategory, TableStatus } from '../types';
import { PaymentMethod } from '../types/session';
import {
  PlusCircleIcon, MinusCircleIcon, TrashIcon, ShoppingCartIcon, 
  ChevronLeftIcon, MagnifyingGlassIcon, XMarkIcon, CheckCircleIcon, CreditCardIcon, PrinterIcon,
  DocumentDuplicateIcon, ReceiptRefundIcon
} from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import MobileOrderSummaryToggle from '../components/MobileOrderSummaryToggle';
import PaymentMethodModal from '../components/modals/PaymentMethodModal';
import { getActiveMenuItems, getCategories } from '../firebase/services/menuService';
import { createOrder, updateOrder, getOrderById } from '../firebase/services/orderService';
import { updateTableStatus, getTableById } from '../firebase/services/tableService';
import { processInventoryForOrder, checkMenuItemInventoryAvailability } from '../firebase/services/inventoryService';
import { saveOrderToLocalStorage, getOrderFromLocalStorage, removeOrderFromLocalStorage } from '../utils/orderStorageUtils';
import { useNotification } from '../contexts/NotificationContext';
import { useSession } from '../contexts/SessionContext';
import { formatCurrency } from '../utils/formatUtils';

const mockCustomers = [
  { id: 'C1', name: 'Alice Johnson', phone: '555-1234', email: 'alice@example.com' },
  { id: 'C2', name: 'Bob Smith', phone: '555-5678', email: 'bob@example.com' },
  { id: 'C3', name: 'Charlie Lee', phone: '555-8765', email: 'charlie@example.com' },
  { id: 'C4', name: 'David Wang', phone: '555-4321', email: 'david@example.com' },
  { id: 'C5', name: 'Eve Brown', phone: '555-8765', email: 'eve@example.com' },
];

const generateBillHtml = (orderData: Order): string => {
  // Logic to generate bill HTML string with inline styles
  // This will incorporate the CSS previously in PrintDialog.tsx
  const styles = `
    body { font-family: 'Arial', sans-serif; font-size: 9pt; margin: 0; padding: 3mm; color: #000; }
    .bill-header { text-align: center; margin-bottom: 5mm; }
    .bill-header h3 { font-size: 14pt; font-weight: bold; margin: 0; }
    .bill-header p { font-size: 8pt; margin: 1mm 0; }
    .bill-items table { width: 100%; border-collapse: collapse; margin-bottom: 3mm; font-size: 8pt; }
    .bill-items th, .bill-items td { padding: 1mm; text-align: left; }
    .bill-items th.qty, .bill-items td.qty { text-align: center; }
    .bill-items th.price, .bill-items td.price { text-align: right; }
    .bill-items th.total, .bill-items td.total { text-align: right; }
    .bill-summary { margin-top: 3mm; font-size: 8pt; }
    .bill-summary .summary-row { display: flex; justify-content: space-between; padding: 0.5mm 0; }
    .bill-summary .grand-total { font-weight: bold; font-size: 10pt; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 1mm 0; }
    .bill-footer { text-align: center; margin-top: 5mm; font-size: 8pt; }
    hr.dashed { border: none; border-top: 1px dashed #000; margin: 2mm 0; }
    @media print {
      @page { margin: 3mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  const itemsHtml = orderData.orderItems.map(item => `
    <tr>
      <td>${item.menuItem.name}</td>
      <td class="price">${item.priceAtAddition.toFixed(2)}</td>
      <td class="qty">${item.quantity}</td>
      <td class="total">${(item.priceAtAddition * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <title>Bill Receipt - ${orderData.id}</title>
        <style>
          ${styles}
          .action-buttons {
            display: flex;
            justify-content: center;
            margin-top: 20px;
            gap: 10px;
          }
          .action-buttons button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
          }
          .print-btn {
            background-color: #4f46e5;
            color: white;
          }
          .cancel-btn {
            background-color: #ef4444;
            color: white;
          }
          @media print {
            .action-buttons {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="bill-header">
          <h3>Aries Restro and Pub</h3>
          <p>Gangtok, Sikkim</p>
          <hr class="dashed" />
          <h4>TAX INVOICE</h4>
          <p>Invoice ID: ${orderData.id}</p>
          <p>Date: ${new Date(orderData.orderDate).toLocaleString()}</p>
          ${orderData.tableId ? `<p>Table: ${orderData.tableId}</p>` : ''}
        </div>
        <div class="bill-items">
          <table>
            <thead><tr><th>Item</th><th class="price">Price</th><th class="qty">Qty</th><th class="total">Total</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
        </div>
        <hr class="dashed" />
        <div class="bill-summary">
          <div class="summary-row"><span>Subtotal:</span><span>₹${orderData.subtotal.toFixed(2)}</span></div>
          ${orderData.taxAmount > 0 ? `
            <div class="summary-row"><span>Tax (18%):</span><span>₹${orderData.taxAmount.toFixed(2)}</span></div>
          ` : ''}
          <div class="summary-row grand-total"><span>GRAND TOTAL:</span><span>₹${orderData.totalAmount.toFixed(2)}</span></div>
        </div>
        <hr class="dashed" />
        <div class="bill-footer">
          <p>Thank you for your visit!</p>
          <p>FSSAI: 22324001000445</p>
          <p>GSTIN: 11FYPS5496A1ZT</p>
          <p>Powered by Aries POS</p>
        </div>
        
        <div class="action-buttons">
          <button class="print-btn" onclick="printAndClose()">Print Bill</button>
          <button class="cancel-btn" onclick="cancelAndReturn()">Cancel</button>
        </div>
        
        <script>
          // Function to handle printing and auto-close
          function printAndClose() {
            window.print();
            // Close the window after printing (with a slight delay)
            setTimeout(function() {
              window.close();
            }, 500);
          }
          
          // Function to handle cancel and return to dashboard
          function cancelAndReturn() {
            // Close this window and return to main app
            window.close();
            // If window doesn't close (due to browser security), redirect opener if possible
            if (window.opener && !window.opener.closed) {
              window.opener.location.href = '/dashboard';
            }
          }
          
          // Auto-print when the page loads (browser print dialog)
          window.onload = function() {
            // Uncomment to auto-print on load
            // window.print();
          }
          
          // Also handle the case when user completes printing via browser dialog
          window.addEventListener('afterprint', function() {
            // Close the window after printing is complete
            setTimeout(function() {
              window.close();
            }, 500);
          });
        </script>
      </body>
    </html>
  `;
};

const generateKotHtml = (kotData: { itemsToPrint: OrderItem[]; orderId: string; tableId?: string; orderNote?: string, restaurantName?: string }): string => {
  // Logic to generate KOT HTML string with inline styles
  const styles = `
    body { font-family: 'Courier New', Courier, monospace; font-size: 12pt; margin: 0; padding: 3mm; color: #000; width: 72mm; box-sizing: border-box; }
    .kot-header { text-align: center; margin-bottom: 3mm; }
    .kot-header h3 { font-size: 16pt; font-weight: bold; margin: 0; }
    .kot-header p { font-size: 10pt; margin: 1mm 0; }
    .kot-items { margin-bottom: 3mm; }
    .kot-item { margin-bottom: 1mm; font-size: 12pt;}
    .kot-item .item-name { font-weight: bold; }
    .kot-item .item-quantity { font-weight: bold; font-size: 14pt; margin-right: 5px; }
    .kot-item .item-note { font-size: 10pt; font-style: italic; margin-left: 15px; }
    .kot-footer { margin-top: 3mm; font-size: 10pt; }
    hr { border: none; border-top: 1px dashed #000; margin: 2mm 0; }
    @media print {
      @page { margin: 2mm; size: 72mm auto; /* Approximate thermal printer width */ }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;
  const itemsHtml = kotData.itemsToPrint.map(item => `
    <div class="kot-item">
      <div><span class="item-quantity">${item.quantity}x</span> <span class="item-name">${item.menuItem.name}</span></div>
      ${(item as any).note ? `<div class="item-note">Note: ${(item as any).note}</div>` : ''}
    </div>
  `).join('');

  return `
    <html>
      <head>
        <title>KOT - ${kotData.orderId}</title>
        <style>
          ${styles}
          .action-buttons {
            display: flex;
            justify-content: center;
            margin-top: 20px;
            gap: 10px;
          }
          .action-buttons button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
          }
          .print-btn {
            background-color: #4f46e5;
            color: white;
          }
          .cancel-btn {
            background-color: #ef4444;
            color: white;
          }
          @media print {
            .action-buttons {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="kot-header">
          ${kotData.restaurantName ? `<h3>${kotData.restaurantName}</h3>` : ''}
          <h3>KITCHEN ORDER TICKET</h3>
          <p>Order ID: ${kotData.orderId}</p>
          ${kotData.tableId ? `<p>Table: ${kotData.tableId}</p>` : ''}
          <p>Date: ${new Date().toLocaleString()}</p>
        </div>
        <hr />
        <div class="kot-items">${itemsHtml}</div>
        ${kotData.orderNote ? `<hr /><div class="kot-footer">Order Note: ${kotData.orderNote}</div>` : ''}
        
        <div class="action-buttons">
          <button class="print-btn" onclick="printAndClose()">Print KOT</button>
          <button class="cancel-btn" onclick="cancelAndReturn()">Cancel</button>
        </div>
        
        <script>
          // Function to handle printing and auto-close
          function printAndClose() {
            window.print();
            // Close the window after printing (with a slight delay)
            setTimeout(function() {
              window.close();
            }, 500);
          }
          
          // Function to handle cancel and return to dashboard
          function cancelAndReturn() {
            // Close this window and return to main app
            window.close();
            // If window doesn't close (due to browser security), redirect opener if possible
            if (window.opener && !window.opener.closed) {
              window.opener.location.href = '/dashboard';
            }
          }
          
          // Auto-print when the page loads (browser print dialog)
          window.onload = function() {
            // Uncomment to auto-print on load
            // window.print();
          }
          
          // Also handle the case when user completes printing via browser dialog
          window.addEventListener('afterprint', function() {
            // Close the window after printing is complete
            setTimeout(function() {
              window.close();
            }, 500);
          });
        </script>
      </body>
    </html>
  `;
};

const OrderPage: React.FC = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Order state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderStatus, setOrderStatus] = useState<Order['status']>('draft');
  const [orderNote, setOrderNote] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const { processPayment } = useSession();

  const handlePaymentMethodSelected = useCallback(async (paymentMethod: PaymentMethod) => {
    if (paymentProcessing) return; // Prevent multiple submissions

    // Validate tableId before proceeding
    if (!tableId) {
      console.error("Table ID is missing. Cannot process payment.");
      // Optionally, set an error state here to inform the user
      // e.g., setToast({ open: true, message: "Error: Table ID is missing.", type: "error" });
      return;
    }

    setPaymentProcessing(true);
    try {
      // Construct finalOrder with 'paid' status
      const subtotal = orderItems.reduce((total, item) => total + (item.priceAtAddition * item.quantity), 0);
      const taxAmount = subtotal * 0.18;
      const totalAmount = subtotal + taxAmount;

      const finalOrder: Order = {
        id: orderId || uuidv4(),
        tableId: tableId!, // tableId is validated to be non-null/undefined before this point
        orderItems,
        status: 'paid',
        orderDate: new Date(),
        orderNote,
        subtotal: subtotal,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod, // The paymentMethod used for this order
      };

      // 1. CRITICAL OPERATIONS - These must complete for the payment to be considered successful
      console.log('Saving order with paid status to database...');
      await updateOrder(finalOrder.id, finalOrder);
      console.log('Order saved successfully with status: paid');

      console.log('Processing payment transaction...');
      await processPayment(finalOrder.id, finalOrder.totalAmount, paymentMethod);
      console.log('Payment processed successfully');
      
      console.log('Updating table status...');
      if (tableId) {
        await updateTableStatus(tableId, 'available' as TableStatus);
        console.log(`Table ${tableId} status set to available after payment`);
      }

      // 2. CLEAR ORDER STATE - This happens regardless of print success
      console.log('Clearing order state...');
      setOrderItems([]);
      setOrderNote('');
      setSelectedCustomer(null);
      setOrderId(null);
      setOrderStatus('draft');
      if (tableId) {
        removeOrderFromLocalStorage(tableId);
        console.log(`Cleared local storage for table ${tableId}`);
      }
      // Note: We don't clear tableId here because it's from the URL params
      // and we're still on the same table's page

      // 3. CLOSE PAYMENT MODAL AND SHOW SUCCESS
      setShowPaymentModal(false);
      showNotification('success', 'Payment completed and order saved!');
      
      // 4. ATTEMPT TO PRINT - This is optional and doesn't affect payment completion
      console.log('Attempting to open print window...');
      try {
        const billHtml = generateBillHtml(finalOrder);
        // Open in a new tab in the same browser window
        // The third parameter (features) is intentionally left empty to open as a tab, not a window
        const printWindow = window.open('about:blank', '_blank');
        if (printWindow) {
          printWindow.document.write(billHtml);
          printWindow.document.close();
          // Focus the window to bring it to front
          printWindow.focus();
          console.log('Print window opened successfully');
        } else {
          console.warn('Print window could not be opened - likely blocked by browser');
          showNotification("info", "Print window couldn't be opened. Check pop-up settings. Payment is still complete.");
        }
      } catch (printError) {
        console.error('Error during print attempt:', printError);
        showNotification("info", "Could not open print window, but payment is complete.");
      } 

    } catch (err) {
      console.error("Error processing payment or order: ", err);
      // Refactored error handling
      let errorMessage = "An unexpected error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      showNotification('error', `Payment failed: ${errorMessage}`);
    } finally {
      setPaymentProcessing(false);
    }
  }, [orderId, orderItems, orderNote, processPayment, showNotification, tableId]);

  const handlePrintKOT = useCallback(async () => {
    if (!orderId || orderItems.length === 0) {
      showNotification("info", "No items to print KOT for.");
      return;
    }

    const newItemsForKOT = orderItems.filter(item => !item.kotPrinted);
    if (newItemsForKOT.length === 0) {
      showNotification("info", "All items have already been sent to the kitchen.");
      return;
    }

    const kotDataForPrint = {
      itemsToPrint: newItemsForKOT,
      orderId: orderId,
      tableId: tableId,
      orderNote: orderNote,
      restaurantName: 'Your Restaurant'
    };

    // Generate HTML and print KOT in new tab
    const kotHtml = generateKotHtml(kotDataForPrint);
    // Open in a new tab in the same browser window by using '_blank' without window features
    // The third parameter (features) is intentionally left empty to open as a tab, not a window
    const printWindow = window.open('about:blank', '_blank');
    if (printWindow) {
      printWindow.document.write(kotHtml);
      printWindow.document.close();
      // Focus the window to bring it to front
      printWindow.focus();
      // Printing is handled by onload script in the HTML
    } else {
      showNotification("error", "Failed to open KOT print window. Please check pop-up blocker settings.");
    }

    // Mark items as KOT printed in the main order state
    const updatedOrderItems = orderItems.map(item => 
      newItemsForKOT.find(newItem => newItem.id === item.id) ? { ...item, kotPrinted: true } : item
    );
    setOrderItems(updatedOrderItems);
    showNotification("success", "KOT sent to kitchen.");

    // Persist changes to KOT printed status (optional, if order is already saved as draft)
    // This assumes orderId exists and you want to update the draft order in DB
    // If order is only saved on payment, this might not be necessary here
    // Or, you might save the order as 'confirmed' here
    if (orderStatus === 'draft' || orderStatus === 'confirmed') {
        const currentOrderData = await getOrderById(orderId); // Fetch current order
        if (currentOrderData) {
            await updateOrder(orderId, { ...currentOrderData, orderItems: updatedOrderItems, status: 'confirmed' });
        }
    }    

  }, [orderId, orderItems, orderNote, showNotification, tableId, orderStatus]);

  // Load menu items, categories, and existing order from Firebase/localStorage
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch menu data
        const [menuItemsData, categoriesData] = await Promise.all([
          getActiveMenuItems(),
          getCategories()
        ]);
        
        setMenuItems(menuItemsData);
        setCategories(categoriesData);
        
        // Check if there's an existing order for this table in localStorage
        if (tableId) {
          const existingOrder = getOrderFromLocalStorage(tableId);
          
          if (existingOrder) {
            // Load the existing order
            setOrderItems(existingOrder.orderItems);
            setOrderStatus(existingOrder.status);
            setOrderNote(existingOrder.orderNote || '');
            setOrderId(existingOrder.id);
            console.log('Loaded existing order from localStorage:', existingOrder);
          } else {
            // Check if there's an order in Firebase for this table
            try {
              const tableData = await getTableById(tableId);
              if (tableData && tableData.currentOrderId) {
                const orderData = await getOrderById(tableData.currentOrderId);
                if (orderData) {
                  // Load the order from Firebase
                  setOrderItems(orderData.orderItems);
                  setOrderStatus(orderData.status);
                  setOrderNote(orderData.orderNote || '');
                  setOrderId(orderData.id);
                  console.log('Loaded existing order from Firebase:', orderData);
                  
                  // Save to localStorage for future reference
                  saveOrderToLocalStorage(tableId, orderData);
                }
              }
            } catch (error) {
              console.error('Error fetching order data from Firebase:', error);
            }
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [tableId]);
  
  // Filter menu items based on search term
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const searchTermMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return searchTermMatch;
    });
  }, [menuItems, searchTerm]);
  
  // Handle adding item to order
  const handleAddItemToOrder = useCallback(async (menuItem: MenuItem) => {
    // Check inventory availability if the item tracks inventory
    if (menuItem.hasInventoryTracking) {
      try {
        // First check if adding one more would exceed inventory
        const existingQuantity = orderItems.find(item => item.menuItem.id === menuItem.id)?.quantity || 0;
        const availability = await checkMenuItemInventoryAvailability(menuItem, existingQuantity + 1);
        
        if (!availability.available) {
          // Show which items are out of stock
          const itemsList = availability.unavailableItems?.map(item => 
            `${item.name} (Available: ${item.currentStock}, Required: ${item.required})`
          ).join(', ');
          
          showNotification('error', `Cannot add item due to insufficient inventory: ${itemsList}`);
          return;
        }
      } catch (error) {
        console.error('Error checking inventory:', error);
        // Continue anyway to not block the order process completely
      }
    }
    
    // Add item to the order
    setOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.menuItem.id === menuItem.id);
      if (existingItemIndex > -1) {
        // Item already exists, don't change quantity here
        // We'll just return the existing items unchanged
        return prevItems;
      } else {
        // Add new item with quantity 1
        return [...prevItems, { 
          id: uuidv4(), 
          menuItem, 
          quantity: 1, 
          priceAtAddition: menuItem.price,
          kotPrinted: false
        }];
      }
    });
    
    // Show notification that item was added
    showNotification('success', `Added ${menuItem.name} to order`);
    
    // If order was already placed, set back to draft
    if (orderStatus === 'placed' || orderStatus === 'confirmed') {
      setOrderStatus('draft'); // Revert to draft if order is modified after being placed or confirmed
    }
  }, [orderStatus, orderItems, showNotification]);
  
  // Handle incrementing item quantity
  const handleIncrementItemQuantity = useCallback((itemId: string) => {
    // First check if we already have this item in the state to prevent double updates
    let currentItem = null;
    let currentQuantity = 0;
    
    orderItems.forEach(item => {
      if (item.id === itemId) {
        currentItem = item;
        currentQuantity = item.quantity;
      }
    });
    
    // Only proceed if we found the item
    if (currentItem) {
      setOrderItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item => item.id === itemId);
        if (existingItemIndex > -1) {
          const updatedItems = [...prevItems];
          // Set the quantity directly instead of incrementing to avoid double increments
          updatedItems[existingItemIndex].quantity = currentQuantity + 1;
          
          // Show notification that item quantity was increased
          const itemName = updatedItems[existingItemIndex].menuItem.name;
          const newQuantity = updatedItems[existingItemIndex].quantity;
          showNotification('info', `Updated: ${itemName} × ${newQuantity}`);
          
          return updatedItems;
        }
        return prevItems;
      });
    }
    
    // If order was already placed, set back to draft
    if (orderStatus === 'placed') {
      setOrderStatus('draft'); // Revert to draft if order is modified after being placed
    }
  }, [orderStatus, showNotification]);

  // Handle removing item from order
  const handleRemoveItemFromOrder = useCallback((itemId: string) => {
    setOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === itemId);
      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        const itemName = updatedItems[existingItemIndex].menuItem.name;
        const currentQuantity = updatedItems[existingItemIndex].quantity;
        
        if (currentQuantity > 1) {
          // Explicitly set the new quantity to current - 1 to avoid any double decrementing
          const newQuantity = currentQuantity - 1;
          updatedItems[existingItemIndex].quantity = newQuantity;
          
          // Show notification that item quantity was decreased
          showNotification('info', `Updated: ${itemName} × ${newQuantity}`);
          return updatedItems;
        } else {
          // Show notification that item was removed
          showNotification('info', `Removed ${itemName} from order`);
          
          // Check if this is the last item in the order
          if (prevItems.length === 1) {
            // Update table status to Available
            if (tableId) {
              updateTableStatus(tableId, 'Available' as TableStatus)
                .then(() => {
                  console.log('Table status updated to Available');
                })
                .catch(error => {
                  console.error('Error updating table status:', error);
                });
            }
          }
          
          return prevItems.filter(item => item.id !== itemId);
        }
      }
      return prevItems;
    });
    
    // If order was already placed, set back to draft
    if (orderStatus === 'placed') {
      setOrderStatus('draft'); // Revert to draft if order is modified after being placed
    }
  }, [orderStatus, showNotification, tableId]);
  
  // Handle deleting item from order
  const handleDeleteItemFromOrder = useCallback((itemId: string) => {
    setOrderItems(prevItems => {
      const itemToDelete = prevItems.find(item => item.id === itemId);
      if (itemToDelete) {
        showNotification('info', `Removed ${itemToDelete.menuItem.name} from order`);
      }
      
      const updatedItems = prevItems.filter(item => item.id !== itemId);
      
      // If this was the last item, set table to Available
      if (updatedItems.length === 0) {
        // Update table status to Available
        if (tableId) {
          updateTableStatus(tableId, 'Available')
            .then(() => {
              console.log('Table status updated to Available');
            })
            .catch(error => {
              console.error('Error updating table status:', error);
            });
        }
      }
      
      return updatedItems;
    });
    
    // If order was already placed, set back to draft
    if (orderStatus === 'placed') {
      setOrderStatus('draft'); // Revert to draft if order is modified after being placed
    }
  }, [orderStatus, showNotification, tableId]);
  
  // Calculate order totals
  const orderTotal = useMemo(() => {
    return orderItems.reduce((total, item) => {
      return total + (item.priceAtAddition * item.quantity);
    }, 0);
  }, [orderItems]);
  
  // Handle order placement
  const handlePlaceOrder = useCallback(async () => {
    if (orderItems.length === 0) {
      showNotification('error', 'Please add items to the order before placing it.');
      return;
    }
    
    try {
      // Calculate order totals
      const subtotal = orderItems.reduce((total, item) => total + (item.priceAtAddition * item.quantity), 0);
      const taxAmount = subtotal * 0.18; // 18% tax rate
      const totalAmount = subtotal + taxAmount;
      
      // Create order object
      const newOrder: Omit<Order, 'id'> = {
        tableId: tableId || '',
        orderItems,
        subtotal,
        taxAmount,
        totalAmount,
        status: 'placed',
        orderDate: new Date(),
        orderNote
      };
      
      // Save to Firebase
      const createdOrder = await createOrder(newOrder);
      
      // Set the order ID in state
      setOrderId(createdOrder.id);
      
      // Update table status to Occupied
      await updateTableStatus(tableId || '', 'Occupied', createdOrder.id);
      
      // Process inventory for order
      if (orderItems.some(item => item.menuItem.hasInventoryTracking)) {
        await processInventoryForOrder(orderItems, createdOrder.id);
      }
      
      // Save order to localStorage for persistence
      saveOrderToLocalStorage(tableId || '', createdOrder);
      
      // Update local state
      setOrderStatus('placed');
      
      // Show success notification
      showNotification('success', 'Order placed successfully! Click on Print KOT button to print the kitchen order ticket.', 3000);
    } catch (error) {
      console.error('Error placing order:', error);
      showNotification('error', 'Failed to place order. Please try again.');
    }
  }, [tableId, orderItems, orderNote, showNotification]);
  
  // We're simplifying the order flow to just 'placed' and 'payment done'
  // This function is kept for backward compatibility but is no longer needed
  const handleConfirmOrder = useCallback(async () => {
    try {
      // Get the order from localStorage
      if (!tableId) {
        showNotification('error', 'Table ID is missing.');
        return;
      }
      
      const existingOrder = getOrderFromLocalStorage(tableId);
      if (!existingOrder || !existingOrder.id) {
        showNotification('error', 'Cannot find the order.');
        return;
      }
      
      // Just show a notification that we're skipping this step
      showNotification('info', 'Order flow simplified - proceeding to payment.');
    } catch (error) {
      console.error('Error with order:', error);
      showNotification('error', 'An error occurred. Please try again.');
    }
  }, [tableId, showNotification]);
  
  // Handle order completion
  const handleCompleteOrder = useCallback(async () => {
    try {
      if (!tableId) {
        showNotification('error', 'Table ID is missing.');
        return;
      }
      
      const existingOrder = getOrderFromLocalStorage(tableId);
      if (!existingOrder || !existingOrder.id) {
        alert('Cannot find the order to complete.');
        return;
      }
      
      // Update the order status in Firebase
      await updateOrder(existingOrder.id, { status: 'paid' as Order['status'] });
      
      // Update the table status to Available
      await updateTableStatus(tableId, 'Available');
      
      // Update local state
      setOrderStatus('completed');
      
      // Remove from localStorage since the order is completed
      removeOrderFromLocalStorage(tableId);
      
      alert('Order completed!');
      
      // Navigate back to table selection
      navigate('/');
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Failed to complete order. Please try again.');
    }
  }, [navigate, tableId]);
  
  // Handle order cancellation
  const handleCancelOrder = useCallback(async () => {
    try {
      if (!tableId) {
        alert('Table ID is missing.');
        return;
      }
      
      const existingOrder = getOrderFromLocalStorage(tableId);
      
      if (existingOrder && existingOrder.id) {
        // Update the order status in Firebase
        await updateOrder(existingOrder.id, { status: 'cancelled' as Order['status'] });
        
        // Update the table status to Available
        await updateTableStatus(tableId, 'Available');
      }
      
      // Update local state
      setOrderStatus('cancelled');
      
      // Remove from localStorage since the order is cancelled
      removeOrderFromLocalStorage(tableId);
      
      alert('Order cancelled!');
      
      // Navigate back to table selection
      navigate('/');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
    }
  }, [navigate, tableId]);
  
  // Render category buttons
  // Removed category buttons
  
  // Render menu items
  const renderMenuItems = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      );
    }
    
    if (filteredMenuItems.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">No menu items found. Try a different search.</div>
        </div>
      );
    }
    
    return filteredMenuItems.map(item => (
      <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
            <span className="text-lg font-medium text-primary">{formatCurrency(item.price)}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{item.description}</p>
          <div className="mt-2 flex items-center">
            {item.tags && item.tags.map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                {tag}
              </span>
            ))}
          </div>
          <button
            className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={() => handleAddItemToOrder(item)}
          >
            <PlusCircleIcon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
            Add to Order
          </button>
        </div>
      </div>
    ));
  };
  
  // Render order items
  const renderOrderItems = () => {
    if (orderItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <ShoppingCartIcon className="h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">Your order is empty</p>
        </div>
      );
    }
    
    return orderItems.map(item => (
      <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-200">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{item.menuItem.name}</h4>
          <p className="text-sm text-gray-500">{formatCurrency(item.priceAtAddition)} each</p>
        </div>
        <div className="flex items-center">
          <button
            className="p-1 rounded-full text-gray-400 hover:text-gray-500"
            onClick={() => handleRemoveItemFromOrder(item.id)}
          >
            <MinusCircleIcon className="h-5 w-5" />
          </button>
          <span className="mx-2 text-gray-700">{item.quantity}</span>
          <button
            className="p-1 rounded-full text-gray-400 hover:text-gray-500"
            onClick={() => handleIncrementItemQuantity(item.id)}
          >
            <PlusCircleIcon className="h-5 w-5" />
          </button>
          <button
            className="ml-2 p-1 rounded-full text-gray-400 hover:text-red-500"
            onClick={() => handleDeleteItemFromOrder(item.id)}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    ));
  };
  
  // Render order summary
  const renderOrderSummary = () => {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
          <p className="text-sm text-gray-500">Table {tableId}</p>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          {renderOrderItems()}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between">
            <span className="text-base font-medium text-gray-900">Total</span>
            <span className="text-base font-medium text-gray-900">{formatCurrency(orderTotal)}</span>
          </div>
          
          <div className="mt-4">
            <label htmlFor="orderNote" className="block text-sm font-medium text-gray-700">Order Notes</label>
            <textarea
              id="orderNote"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              rows={2}
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="Special instructions or notes..."
            />
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            {orderStatus === 'draft' && (
              <button
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                onClick={handlePlaceOrder}
              >
                Place Order
              </button>
            )}
            
            {orderStatus === 'placed' && (
              <button
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCardIcon className="-ml-1 mr-2 h-5 w-5" />
                Payment
              </button>
            )}
            
            {/* KOT Printing Button - Only visible after order is placed */}
            {orderStatus === 'placed' && (
              <button
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                onClick={handlePrintKOT}
              >
                <DocumentDuplicateIcon className="-ml-1 mr-2 h-5 w-5" />
                Print KOT (New Items)
              </button>
            )}
            
            {orderStatus !== 'completed' && orderStatus !== 'cancelled' && (
              <button
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                onClick={() => handleCancelOrder()}
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/tables" className="mr-4 text-gray-500 hover:text-gray-700">
              <ChevronLeftIcon className="h-6 w-6" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Table {tableId} - Order</h1>
          </div>
          <MobileOrderSummaryToggle 
            showOrderSummary={showOrderSummary} 
            setShowOrderSummary={setShowOrderSummary} 
            itemCount={orderItems.length} 
            total={orderTotal}
          />
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Menu section */}
          <div className="lg:col-span-2">
            {/* Search */}
            <div className="mb-6">
              <div className="relative rounded-md shadow-sm mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500"
                      onClick={() => setSearchTerm('')}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Menu items grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 overflow-y-auto max-h-[60vh]">
              {renderMenuItems()}
            </div>
          </div>
          
          {/* Order summary section - desktop */}
          <div className="hidden lg:block">
            {renderOrderSummary()}
          </div>
          
          {/* Order summary section - mobile */}
          {/* <AnimatePresence>
            {showOrderSummary && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-40 lg:hidden"
              >
                <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowOrderSummary(false)}></div>
                <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-xl max-h-[80vh] overflow-y-auto">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900">Your Order</h2>
                      <button
                        className="text-gray-400 hover:text-gray-500"
                        onClick={() => setShowOrderSummary(false)}
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    {renderOrderSummary()}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence> */}
          
          {/* Payment Method Modal */}
          <PaymentMethodModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onPaymentComplete={handlePaymentMethodSelected}
            orderTotal={orderTotal}
          />
        </div>
      </main>
    </div>
  );
};

export default OrderPage;
