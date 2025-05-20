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
      gstApplicable: item.gstApplicable !== undefined ? !!item.gstApplicable : true, // Default to true if not specified
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
  // Create a mutable copy of the menuItem data to avoid modifying the input object directly
  // and to allow for deletion of optional properties if necessary.
  const dataToSave: any = { ...menuItem };

  dataToSave.createdAt = new Date();
  dataToSave.updatedAt = new Date();

  if (dataToSave.hasInventoryTracking) {
    // If inventory tracking is enabled:
    // - Ensure 'inventoryAvailable' is a boolean. Default to true if not explicitly provided.
    dataToSave.inventoryAvailable = dataToSave.inventoryAvailable ?? true;
    // - Provide defaults for other inventory-related fields if they are not set.
    dataToSave.inventoryUnit = dataToSave.inventoryUnit ?? 'piece';
    dataToSave.startingInventoryQuantity = dataToSave.startingInventoryQuantity ?? 0;
    dataToSave.decrementPerOrder = dataToSave.decrementPerOrder ?? 1;
    // - 'inventoryUsage' should be an array. Default to an empty array if not provided.
    dataToSave.inventoryUsage = dataToSave.inventoryUsage ?? [];
  } else {
    // If inventory tracking is NOT enabled:
    // - The item is considered available by default.
    dataToSave.inventoryAvailable = true;
    // - Remove other inventory-specific fields as they are not relevant.
    //   Assigning 'undefined' would also work if Firestore is configured to ignore undefined fields,
    //   but explicit deletion is cleaner for optional fields.
    delete dataToSave.inventoryUnit;
    delete dataToSave.startingInventoryQuantity;
    delete dataToSave.decrementPerOrder;
    delete dataToSave.inventoryUsage;
  }

  // Fields like description, costPrice, imageUrl, etc., are expected to be handled
  // by the caller (e.g., MenuManagementPage) to be either their respective values or null if empty.
  // This ensures that 'undefined' is not passed for these optional string/number fields.

  const docRef = await addDoc(collection(db, MENU_ITEMS), dataToSave);
  
  // Fetch the newly created document to ensure we return the complete data as stored in Firestore,
  // including any server-generated timestamps or transformations if applicable (though we set them client-side here).
  const newDocSnapshot = await getDoc(docRef);
  const savedData = newDocSnapshot.data();

  return {
    id: docRef.id,
    ...(savedData as Omit<MenuItem, 'id'>), // Cast to ensure type conformity, id is added separately
  } as MenuItem;
};

export const updateMenuItem = async (id: string, menuItemInput: Partial<MenuItem>) => {
  const menuItemRef = doc(db, MENU_ITEMS, id);

  // Create a mutable copy for the data to be updated.
  const dataForUpdate: Partial<MenuItem> = { ...menuItemInput };
  dataForUpdate.updatedAt = new Date();

  // Handle inventoryAvailable and other inventory fields based on hasInventoryTracking status
  if (dataForUpdate.hasInventoryTracking === true) {
    // If tracking is explicitly being enabled or is already enabled and inventory fields are being updated.
    dataForUpdate.inventoryAvailable = dataForUpdate.inventoryAvailable ?? true; // Default to true if undefined
    
    // Provide defaults for other inventory fields if they are explicitly part of the payload and undefined
    if ('inventoryUnit' in dataForUpdate && dataForUpdate.inventoryUnit === undefined) {
        dataForUpdate.inventoryUnit = 'piece';
    }
    if ('startingInventoryQuantity' in dataForUpdate && dataForUpdate.startingInventoryQuantity === undefined) {
        dataForUpdate.startingInventoryQuantity = 0;
    }
    if ('decrementPerOrder' in dataForUpdate && dataForUpdate.decrementPerOrder === undefined) {
        dataForUpdate.decrementPerOrder = 1;
    }
    if ('inventoryUsage' in dataForUpdate && dataForUpdate.inventoryUsage === undefined) {
        dataForUpdate.inventoryUsage = [];
    }
  } else if (dataForUpdate.hasInventoryTracking === false) {
    // If tracking is explicitly being disabled.
    dataForUpdate.inventoryAvailable = true; // Item is considered available if not tracked by inventory.
    // Remove other inventory-specific fields from the update data by deleting them from the object.
    // This prevents them from being sent as 'undefined' to Firestore.
    const D = dataForUpdate as any; // Use 'any' to allow deletion of properties from Partial<MenuItem>
    delete D.inventoryUnit;
    delete D.startingInventoryQuantity;
    delete D.decrementPerOrder;
    delete D.inventoryUsage;
  } else {
    // hasInventoryTracking is NOT in menuItemInput (i.e., not being changed in this update).
    // The item's current hasInventoryTracking status in the DB dictates behavior for related fields.
    // If inventoryAvailable IS in menuItemInput and is undefined, this could be problematic if the item IS tracked.
    if ('inventoryAvailable' in dataForUpdate && dataForUpdate.inventoryAvailable === undefined) {
        // This implies the item is currently tracked (or this field wouldn't be relevant otherwise),
        // and an attempt is made to set inventoryAvailable to undefined. Default to true.
        dataForUpdate.inventoryAvailable = true;
    }
    // Similar logic could be applied to other inventory fields if they are updated independently
    // while hasInventoryTracking itself is not changing and is true.
  }

  // Final safeguard: Remove any top-level properties from dataForUpdate that are still undefined.
  // This ensures that no 'undefined' values are sent to Firestore in the update payload.
  Object.keys(dataForUpdate).forEach(keyStr => {
    const key = keyStr as keyof Partial<MenuItem>;
    if (dataForUpdate[key] === undefined) {
      delete dataForUpdate[key];
    }
  });

  // Fetch the original menu item state *before* the update for inventory transaction logic.
  const menuItemSnapBeforeUpdate = await getDoc(menuItemRef);
  const originalMenuItem = menuItemSnapBeforeUpdate.exists() ? menuItemSnapBeforeUpdate.data() as MenuItem : null;

  await updateDoc(menuItemRef, dataForUpdate);

  // Inventory transaction logic (handles changes in startingInventoryQuantity if item is tracked).
  if (originalMenuItem) {
    // Determine the effective tracking status after this update.
    const effectiveHasInventoryTracking = dataForUpdate.hasInventoryTracking !== undefined 
      ? dataForUpdate.hasInventoryTracking 
      : originalMenuItem.hasInventoryTracking;

    if (effectiveHasInventoryTracking && 
        'startingInventoryQuantity' in dataForUpdate && // Ensure this field was part of the intended update
        dataForUpdate.startingInventoryQuantity !== undefined && // And it's not undefined post-cleanup
        dataForUpdate.startingInventoryQuantity !== (originalMenuItem.startingInventoryQuantity ?? 0)
    ) {
      try {
        const { recordInventoryTransaction } = require('./inventoryService'); // Local require to avoid circular deps
        const quantityChange = (dataForUpdate.startingInventoryQuantity ?? 0) - (originalMenuItem.startingInventoryQuantity ?? 0);
        if (quantityChange !== 0) {
          await recordInventoryTransaction(
            `menu_item_${id}`,
            quantityChange,
            `Manual inventory adjustment for ${originalMenuItem.name || dataForUpdate.name || 'item'}`,
            undefined // No order ID for manual adjustment
          );
        }
      } catch (error) {
        console.error('Error recording inventory adjustment:', error);
      }
    }
  }
  
  // Return the data that was intended for the update, plus the ID.
  // For a more complete return of the updated state, another getDoc would be needed.
  return {
    id,
    ...dataForUpdate
  } as Partial<MenuItem> & { id: string }; // Reflects that dataForUpdate might not be a full MenuItem
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
