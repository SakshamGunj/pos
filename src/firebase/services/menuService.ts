import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config';
import { MenuItem, MenuCategory, VariantGroup, AddOnGroup, ComboMeal } from '../../types';

// Collection names
const MENU_ITEMS = 'menuItems';
const CATEGORIES = 'categories';
const VARIANT_GROUPS = 'variantGroups';
const ADDON_GROUPS = 'addonGroups';
const COMBO_MEALS = 'comboMeals';

// Menu Items
export const getMenuItems = async () => {
  const menuItemsCollection = collection(db, MENU_ITEMS);
  const menuItemsSnapshot = await getDocs(menuItemsCollection);
  return menuItemsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MenuItem[];
};

export const getActiveMenuItems = async () => {
  const menuItemsCollection = collection(db, MENU_ITEMS);
  const q = query(menuItemsCollection, where('status', '==', 'active'));
  const menuItemsSnapshot = await getDocs(q);
  return menuItemsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MenuItem[];
};

export const getMenuItemsByCategory = async (categoryId: string) => {
  const menuItemsCollection = collection(db, MENU_ITEMS);
  const q = query(menuItemsCollection, where('category', '==', categoryId));
  const menuItemsSnapshot = await getDocs(q);
  return menuItemsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MenuItem[];
};

export const getMenuItemsByTag = async (tag: string) => {
  const menuItemsCollection = collection(db, MENU_ITEMS);
  const q = query(menuItemsCollection, where('tags', 'array-contains', tag));
  const menuItemsSnapshot = await getDocs(q);
  return menuItemsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MenuItem[];
};

// Bulk add menu items from CSV/Excel upload
export const bulkAddMenuItems = async (menuItems: Partial<MenuItem>[]) => {
  const batch = writeBatch(db);
  const menuItemsCollection = collection(db, MENU_ITEMS);
  
  for (const item of menuItems) {
    // Create a new document reference
    const newDocRef = doc(menuItemsCollection);
    
    // Set default values for any missing fields
    const menuItem = {
      name: item.name || '',
      description: item.description || '',
      price: item.price || 0,
      category: item.category || '',
      tags: item.tags || [],
      imageUrl: item.imageUrl || '',
      status: 'active' as const,
      hasInventoryTracking: item.inventoryAvailable || false,
      inventoryAvailable: item.inventoryAvailable || false,
      inventoryUnit: item.inventoryUnit || 'piece',
      startingInventoryQuantity: item.startingInventoryQuantity || 0,
      decrementPerOrder: item.decrementPerOrder || 1,
      costPrice: item.costPrice || 0,
      preparationTime: 5, // Default preparation time
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to batch
    batch.set(newDocRef, menuItem);
  }
  
  // Commit the batch
  await batch.commit();
  
  return true;
};

export const addMenuItem = async (menuItem: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => {
  // Handle inventory-related fields
  const hasInventory = menuItem.hasInventoryTracking;
  const inventoryAvailable = hasInventory ? (menuItem.inventoryAvailable ?? true) : undefined;
  const inventoryUnit = hasInventory ? (menuItem.inventoryUnit ?? 'piece') : undefined;
  const startingInventoryQuantity = hasInventory ? (menuItem.startingInventoryQuantity ?? 0) : undefined;
  const decrementPerOrder = hasInventory ? (menuItem.decrementPerOrder ?? 1) : undefined;
  
  // Convert Date objects to Firestore timestamps
  const firestoreMenuItem = {
    ...menuItem,
    inventoryAvailable,
    inventoryUnit,
    startingInventoryQuantity,
    decrementPerOrder,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const docRef = await addDoc(collection(db, MENU_ITEMS), firestoreMenuItem);
  
  // Create initial inventory record if tracking is enabled
  if (hasInventory && startingInventoryQuantity !== undefined && startingInventoryQuantity > 0) {
    try {
      // Import is done here to avoid circular dependencies
      const { recordInventoryTransaction } = require('./inventoryService');
      
      // Record the initial inventory as a transaction
      await recordInventoryTransaction(
        `menu_item_${docRef.id}`,
        startingInventoryQuantity, // Positive value for initial stock
        `Initial inventory for ${menuItem.name}`,
        undefined // No order ID for initial inventory
      );
    } catch (error) {
      console.error('Error recording initial inventory:', error);
      // Continue even if recording initial inventory fails
    }
  }
  
  return {
    id: docRef.id,
    ...firestoreMenuItem
  } as MenuItem;
};

export const updateMenuItem = async (id: string, menuItem: Partial<MenuItem>) => {
  const menuItemRef = doc(db, MENU_ITEMS, id);
  
  // Get the current menu item to compare inventory changes
  const menuItemSnap = await getDoc(menuItemRef);
  const currentMenuItem = menuItemSnap.exists() ? menuItemSnap.data() as MenuItem : null;
  
  // Handle inventory-related fields
  const hasInventory = menuItem.hasInventoryTracking !== undefined ? menuItem.hasInventoryTracking : currentMenuItem?.hasInventoryTracking;
  
  // Prepare the update object
  const updatedMenuItem = {
    ...menuItem,
    updatedAt: new Date()
  };
  
  // Update the document
  await updateDoc(menuItemRef, updatedMenuItem);
  
  // Handle inventory quantity changes if needed
  if (hasInventory && 
      menuItem.startingInventoryQuantity !== undefined && 
      currentMenuItem?.startingInventoryQuantity !== undefined && 
      menuItem.startingInventoryQuantity !== currentMenuItem.startingInventoryQuantity) {
    try {
      // Import is done here to avoid circular dependencies
      const { recordInventoryTransaction } = require('./inventoryService');
      
      // Calculate the change in inventory
      const quantityChange = menuItem.startingInventoryQuantity - currentMenuItem.startingInventoryQuantity;
      
      if (quantityChange !== 0) {
        // Record the inventory adjustment as a transaction
        await recordInventoryTransaction(
          `menu_item_${id}`,
          quantityChange,
          `Manual inventory adjustment for ${currentMenuItem.name}`,
          undefined // No order ID for manual adjustment
        );
      }
    } catch (error) {
      console.error('Error recording inventory adjustment:', error);
      // Continue even if recording inventory adjustment fails
    }
  }
  
  return {
    id,
    ...menuItem
  };
};

export const deleteMenuItem = async (id: string) => {
  // Soft delete - update status to 'deleted'
  const menuItemRef = doc(db, MENU_ITEMS, id);
  await updateDoc(menuItemRef, {
    status: 'deleted',
    deletedAt: new Date(),
    updatedAt: new Date()
  });
};

export const permanentlyDeleteMenuItem = async (id: string) => {
  // Hard delete - remove from database
  const menuItemRef = doc(db, MENU_ITEMS, id);
  
  // Get the menu item to check if it has an image
  const menuItemSnap = await getDoc(menuItemRef);
  const menuItem = menuItemSnap.data() as MenuItem;
  
  // If there's an image, delete it from storage
  if (menuItem.imageUrl) {
    try {
      const imageRef = ref(storage, menuItem.imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      // Continue with deletion even if image deletion fails
    }
  }
  
  await deleteDoc(menuItemRef);
};

// Upload menu item image
export const uploadMenuItemImage = async (file: File, itemId: string) => {
  const storageRef = ref(storage, `menu-items/${itemId}/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

// Categories
export const getCategories = async () => {
  const categoriesCollection = collection(db, CATEGORIES);
  const q = query(categoriesCollection, orderBy('displayOrder'));
  const categoriesSnapshot = await getDocs(q);
  return categoriesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MenuCategory[];
};

export const addCategory = async (category: Omit<MenuCategory, 'id' | 'createdAt' | 'updatedAt'>) => {
  const firestoreCategory = {
    ...category,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const docRef = await addDoc(collection(db, CATEGORIES), firestoreCategory);
  return {
    id: docRef.id,
    ...category
  } as MenuCategory;
};

export const updateCategory = async (id: string, category: Partial<MenuCategory>) => {
  const categoryRef = doc(db, CATEGORIES, id);
  
  const updatedCategory = {
    ...category,
    updatedAt: new Date()
  };
  
  await updateDoc(categoryRef, updatedCategory);
  return {
    id,
    ...category
  };
};

export const deleteCategory = async (id: string) => {
  const categoryRef = doc(db, CATEGORIES, id);
  await deleteDoc(categoryRef);
};

// Upload category image
export const uploadCategoryImage = async (file: File, categoryId: string) => {
  const storageRef = ref(storage, `categories/${categoryId}/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

// Variant Groups
export const getVariantGroups = async () => {
  const variantGroupsCollection = collection(db, VARIANT_GROUPS);
  const variantGroupsSnapshot = await getDocs(variantGroupsCollection);
  return variantGroupsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as VariantGroup[];
};

export const addVariantGroup = async (variantGroup: Omit<VariantGroup, 'id'>) => {
  const docRef = await addDoc(collection(db, VARIANT_GROUPS), variantGroup);
  return {
    id: docRef.id,
    ...variantGroup
  } as VariantGroup;
};

export const updateVariantGroup = async (id: string, variantGroup: Partial<VariantGroup>) => {
  const variantGroupRef = doc(db, VARIANT_GROUPS, id);
  await updateDoc(variantGroupRef, variantGroup);
  return {
    id,
    ...variantGroup
  };
};

export const deleteVariantGroup = async (id: string) => {
  const variantGroupRef = doc(db, VARIANT_GROUPS, id);
  await deleteDoc(variantGroupRef);
};

// Add-on Groups
export const getAddOnGroups = async () => {
  const addOnGroupsCollection = collection(db, ADDON_GROUPS);
  const addOnGroupsSnapshot = await getDocs(addOnGroupsCollection);
  return addOnGroupsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as AddOnGroup[];
};

export const addAddOnGroup = async (addOnGroup: Omit<AddOnGroup, 'id'>) => {
  const docRef = await addDoc(collection(db, ADDON_GROUPS), addOnGroup);
  return {
    id: docRef.id,
    ...addOnGroup
  } as AddOnGroup;
};

export const updateAddOnGroup = async (id: string, addOnGroup: Partial<AddOnGroup>) => {
  const addOnGroupRef = doc(db, ADDON_GROUPS, id);
  await updateDoc(addOnGroupRef, addOnGroup);
  return {
    id,
    ...addOnGroup
  };
};

export const deleteAddOnGroup = async (id: string) => {
  const addOnGroupRef = doc(db, ADDON_GROUPS, id);
  await deleteDoc(addOnGroupRef);
};

// Combo Meals
export const getComboMeals = async () => {
  const comboMealsCollection = collection(db, COMBO_MEALS);
  const q = query(comboMealsCollection, orderBy('displayPriority'));
  const comboMealsSnapshot = await getDocs(q);
  return comboMealsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ComboMeal[];
};

export const getActiveComboMeals = async () => {
  const comboMealsCollection = collection(db, COMBO_MEALS);
  const q = query(comboMealsCollection, 
    where('status', '==', 'active'),
    orderBy('displayPriority')
  );
  const comboMealsSnapshot = await getDocs(q);
  return comboMealsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ComboMeal[];
};

export const addComboMeal = async (comboMeal: Omit<ComboMeal, 'id' | 'createdAt' | 'updatedAt'>) => {
  const firestoreComboMeal = {
    ...comboMeal,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const docRef = await addDoc(collection(db, COMBO_MEALS), firestoreComboMeal);
  return {
    id: docRef.id,
    ...comboMeal
  } as ComboMeal;
};

export const updateComboMeal = async (id: string, comboMeal: Partial<ComboMeal>) => {
  const comboMealRef = doc(db, COMBO_MEALS, id);
  
  const updatedComboMeal = {
    ...comboMeal,
    updatedAt: new Date()
  };
  
  await updateDoc(comboMealRef, updatedComboMeal);
  return {
    id,
    ...comboMeal
  };
};

export const deleteComboMeal = async (id: string) => {
  // Soft delete - update status to 'deleted'
  const comboMealRef = doc(db, COMBO_MEALS, id);
  await updateDoc(comboMealRef, {
    status: 'deleted',
    deletedAt: new Date(),
    updatedAt: new Date()
  });
};

export const permanentlyDeleteComboMeal = async (id: string) => {
  // Hard delete - remove from database
  const comboMealRef = doc(db, COMBO_MEALS, id);
  
  // Get the combo meal to check if it has an image
  const comboMealSnap = await getDoc(comboMealRef);
  const comboMeal = comboMealSnap.data() as ComboMeal;
  
  // If there's an image, delete it from storage
  if (comboMeal.imageUrl) {
    try {
      const imageRef = ref(storage, comboMeal.imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      // Continue with deletion even if image deletion fails
    }
  }
  
  await deleteDoc(comboMealRef);
};

// Upload combo meal image
export const uploadComboMealImage = async (file: File, comboId: string) => {
  const storageRef = ref(storage, `combo-meals/${comboId}/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};
