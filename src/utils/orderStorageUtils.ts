/**
 * Utilities for managing order data in localStorage
 */

import { Order, OrderItem } from '../types';

// Keys for localStorage
const ORDER_STORAGE_PREFIX = 'pos_order_';

/**
 * Save an order to localStorage
 * @param tableId - The ID of the table associated with the order
 * @param order - The order object to save
 */
export const saveOrderToLocalStorage = (tableId: string, order: Order): void => {
  const storageKey = `${ORDER_STORAGE_PREFIX}${tableId}`;
  localStorage.setItem(storageKey, JSON.stringify(order));
};

/**
 * Get an order from localStorage
 * @param tableId - The ID of the table associated with the order
 * @returns The order object or null if not found
 */
export const getOrderFromLocalStorage = (tableId: string): Order | null => {
  const storageKey = `${ORDER_STORAGE_PREFIX}${tableId}`;
  const orderData = localStorage.getItem(storageKey);
  
  if (!orderData) return null;
  
  try {
    const order = JSON.parse(orderData) as Order;
    
    // Convert string dates back to Date objects
    if (typeof order.orderDate === 'string') {
      order.orderDate = new Date(order.orderDate);
    }
    
    return order;
  } catch (error) {
    console.error('Error parsing order from localStorage:', error);
    return null;
  }
};

/**
 * Remove an order from localStorage
 * @param tableId - The ID of the table associated with the order
 */
export const removeOrderFromLocalStorage = (tableId: string): void => {
  const storageKey = `${ORDER_STORAGE_PREFIX}${tableId}`;
  localStorage.removeItem(storageKey);
};

/**
 * Check if a table has an active order in localStorage
 * @param tableId - The ID of the table to check
 * @returns True if the table has an active order, false otherwise
 */
export const hasActiveOrder = (tableId: string): boolean => {
  return getOrderFromLocalStorage(tableId) !== null;
};

/**
 * Get all active orders from localStorage
 * @returns An array of orders with their associated table IDs
 */
export const getAllActiveOrders = (): { tableId: string; order: Order }[] => {
  const activeOrders: { tableId: string; order: Order }[] = [];
  
  // Iterate through all localStorage items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    
    if (key && key.startsWith(ORDER_STORAGE_PREFIX)) {
      const tableId = key.replace(ORDER_STORAGE_PREFIX, '');
      const order = getOrderFromLocalStorage(tableId);
      
      if (order) {
        activeOrders.push({ tableId, order });
      }
    }
  }
  
  return activeOrders;
};
