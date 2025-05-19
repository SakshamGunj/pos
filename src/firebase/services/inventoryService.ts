import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config';
import { InventoryItem, InventoryUnit, MenuItem, OrderItem } from '../../types';

// Collection name
const INVENTORY_ITEMS = 'inventoryItems';
const INVENTORY_TRANSACTIONS = 'inventoryTransactions';

// Get all inventory items
export const getAllInventoryItems = async () => {
  const inventoryCollection = collection(db, INVENTORY_ITEMS);
  const inventorySnapshot = await getDocs(inventoryCollection);
  return inventorySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as InventoryItem[];
};

// Get inventory item by ID
export const getInventoryItemById = async (id: string) => {
  const inventoryRef = doc(db, INVENTORY_ITEMS, id);
  const inventorySnap = await getDoc(inventoryRef);
  
  if (inventorySnap.exists()) {
    return {
      id: inventorySnap.id,
      ...inventorySnap.data()
    } as InventoryItem;
  }
  
  return null;
};

// Create a new inventory item
export const createInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
  const firestoreItem = {
    ...item,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const docRef = await addDoc(collection(db, INVENTORY_ITEMS), firestoreItem);
  
  return {
    id: docRef.id,
    ...item
  } as InventoryItem;
};

// Update an inventory item
export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
  const inventoryRef = doc(db, INVENTORY_ITEMS, id);
  
  const updatedItem = {
    ...updates,
    updatedAt: new Date()
  };
  
  await updateDoc(inventoryRef, updatedItem);
  
  return {
    id,
    ...updatedItem
  };
};

// Delete an inventory item
export const deleteInventoryItem = async (id: string) => {
  const inventoryRef = doc(db, INVENTORY_ITEMS, id);
  await deleteDoc(inventoryRef);
  return { id };
};

// Update inventory stock level
export const updateInventoryStock = async (id: string, quantityChange: number) => {
  // Check if this is a menu item inventory ID (starts with menu_item_)
  if (id.startsWith('menu_item_')) {
    // This is a menu item's own inventory, not a separate inventory item
    const menuItemId = id.replace('menu_item_', '');
    const menuItemRef = doc(db, 'menuItems', menuItemId);
    const menuItemSnap = await getDoc(menuItemRef);
    
    if (!menuItemSnap.exists()) {
      throw new Error(`Menu item with ID ${menuItemId} not found`);
    }
    
    const menuItem = menuItemSnap.data() as MenuItem;
    
    // If startingInventoryQuantity is not set, initialize it
    const currentStock = menuItem.startingInventoryQuantity ?? 0;
    const newStock = currentStock + quantityChange;
    
    if (newStock < 0) {
      throw new Error(`Cannot reduce stock below 0. Current stock: ${currentStock}, Attempted change: ${quantityChange}`);
    }
    
    await updateDoc(menuItemRef, {
      startingInventoryQuantity: newStock,
      updatedAt: new Date()
    });
    
    return {
      id: menuItemId,
      currentStock: newStock
    };
  } else {
    // This is a regular inventory item
    const inventoryRef = doc(db, INVENTORY_ITEMS, id);
    const inventorySnap = await getDoc(inventoryRef);
    
    if (!inventorySnap.exists()) {
      throw new Error(`Inventory item with ID ${id} not found`);
    }
    
    const currentItem = inventorySnap.data() as InventoryItem;
    const newStock = currentItem.currentStock + quantityChange;
    
    if (newStock < 0) {
      throw new Error(`Cannot reduce stock below 0. Current stock: ${currentItem.currentStock}, Attempted change: ${quantityChange}`);
    }
    
    await updateDoc(inventoryRef, {
      currentStock: newStock,
      updatedAt: new Date()
    });
    
    return {
      id,
      currentStock: newStock
    };
  }
};

// Get low stock items (below minimum stock level)
export const getLowStockItems = async () => {
  const inventoryCollection = collection(db, INVENTORY_ITEMS);
  const q = query(inventoryCollection, where('currentStock', '<', 'minStockLevel'));
  const inventorySnapshot = await getDocs(q);
  
  return inventorySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as InventoryItem[];
};

// Record inventory transaction
export const recordInventoryTransaction = async (
  inventoryItemId: string,
  quantityChange: number,
  reason: string,
  orderId?: string
) => {
  // Check if this is a menu item inventory ID
  const isMenuItemInventory = inventoryItemId.startsWith('menu_item_');
  const actualItemId = isMenuItemInventory ? inventoryItemId.replace('menu_item_', '') : inventoryItemId;
  
  // Create transaction object, ensuring orderId is never undefined
  const transaction = {
    inventoryItemId: actualItemId,
    isMenuItemInventory,
    quantityChange,
    reason,
    orderId: orderId || null, // Use null instead of undefined for Firestore
    timestamp: new Date()
  };
  
  const docRef = await addDoc(collection(db, INVENTORY_TRANSACTIONS), transaction);
  
  return {
    id: docRef.id,
    ...transaction
  };
};

// Process inventory deduction for order items
// Track processed items to prevent double decrement
const processedItems = new Set();

export const processInventoryForOrder = async (orderItems: OrderItem[], orderId: string) => {
  // Get all menu items with inventory tracking
  const menuItemsWithInventory = orderItems.filter(item => item.menuItem.hasInventoryTracking);
  
  if (menuItemsWithInventory.length === 0) {
    return; // No inventory tracking needed
  }
  
  // Process each menu item
  for (const orderItem of menuItemsWithInventory) {
    const { menuItem, quantity } = orderItem;
    
    // Check if inventory is available for this item
    if (menuItem.inventoryAvailable === false) {
      console.log(`Menu item ${menuItem.name} is marked as not available in inventory, skipping`);
      continue;
    }
    
    // Handle direct inventory deduction if decrementPerOrder is set
    // Check if this item has already been processed to prevent double decrement
    const itemKey = `${menuItem.id}_${orderId}`;
    if (menuItem.decrementPerOrder && menuItem.decrementPerOrder > 0 && !processedItems.has(itemKey)) {
      // Mark this item as processed
      processedItems.add(itemKey);
      try {
        // Create a dummy inventory item ID based on the menu item ID if needed
        const inventoryItemId = `menu_item_${menuItem.id}`;
        
        // Calculate total quantity to deduct using the decrementPerOrder value
        const totalDeduction = -(menuItem.decrementPerOrder * quantity); // Negative for deduction
        
        // Update inventory stock
        await updateInventoryStock(inventoryItemId, totalDeduction);
        
        // Record the transaction
        await recordInventoryTransaction(
          inventoryItemId,
          totalDeduction,
          `Order ${orderId}: ${quantity}x ${menuItem.name}`,
          orderId
        );
      } catch (error) {
        console.error(`Error updating direct inventory for menu item ${menuItem.id}:`, error);
        // Continue processing other items even if one fails
      }
    }
    
    // Process inventory usage items if defined
    if (menuItem.inventoryUsage && menuItem.inventoryUsage.length > 0) {
      // Process each inventory item used by this menu item
      for (const usage of menuItem.inventoryUsage) {
        const { inventoryItemId, quantityUsedPerMenuItem } = usage;
        
        // Calculate total quantity to deduct
        const totalDeduction = -(quantityUsedPerMenuItem * quantity); // Negative for deduction
        
        try {
          // Update inventory stock
          await updateInventoryStock(inventoryItemId, totalDeduction);
          
          // Record the transaction
          await recordInventoryTransaction(
            inventoryItemId,
            totalDeduction,
            `Order ${orderId}: ${quantity}x ${menuItem.name}`,
            orderId
          );
        } catch (error) {
          console.error(`Error updating inventory for item ${inventoryItemId}:`, error);
          // Continue processing other items even if one fails
        }
      }
    }
  }
};

// Check if all inventory items for a menu item are in stock
export const checkMenuItemInventoryAvailability = async (menuItem: MenuItem, quantity: number = 1) => {
  // If menu item doesn't track inventory, it's always available
  if (!menuItem.hasInventoryTracking) {
    return { available: true };
  }
  
  // If menu item is explicitly marked as not available in inventory
  if (menuItem.inventoryAvailable === false) {
    return { 
      available: false,
      reason: 'Item is marked as unavailable in inventory'
    };
  }
  
  const unavailableItems: { itemId: string; name: string; currentStock: number; required: number }[] = [];
  
  // Check direct inventory tracking first (using decrementPerOrder)
  if (menuItem.decrementPerOrder && menuItem.decrementPerOrder > 0) {
    const requiredQuantity = menuItem.decrementPerOrder * quantity;
    const currentStock = menuItem.startingInventoryQuantity ?? 0;
    
    if (currentStock < requiredQuantity) {
      unavailableItems.push({
        itemId: menuItem.id,
        name: menuItem.name,
        currentStock: currentStock,
        required: requiredQuantity
      });
    }
  }
  
  // Check each inventory item used by this menu item (if any)
  if (menuItem.inventoryUsage && menuItem.inventoryUsage.length > 0) {
    for (const usage of menuItem.inventoryUsage) {
      const { inventoryItemId, quantityUsedPerMenuItem } = usage;
      const requiredQuantity = quantityUsedPerMenuItem * quantity;
      
      // Get current inventory item
      const inventoryItem = await getInventoryItemById(inventoryItemId);
      
      if (!inventoryItem) {
        unavailableItems.push({
          itemId: inventoryItemId,
          name: 'Unknown Item',
          currentStock: 0,
          required: requiredQuantity
        });
        continue;
      }
      
      // Check if enough stock is available
      if (inventoryItem.currentStock < requiredQuantity) {
        unavailableItems.push({
          itemId: inventoryItemId,
          name: inventoryItem.name,
          currentStock: inventoryItem.currentStock,
          required: requiredQuantity
        });
      }
    }
  }
  
  return {
    available: unavailableItems.length === 0,
    unavailableItems: unavailableItems.length > 0 ? unavailableItems : undefined
  };
};
