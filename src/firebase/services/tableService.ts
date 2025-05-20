import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config';
import { Table, TableArea, TableStatus } from '../../types';

// Collection name
const TABLES = 'tables';

// Get all tables
export const getAllTables = async () => {
  const tablesCollection = collection(db, TABLES);
  const tablesSnapshot = await getDocs(tablesCollection);
  return tablesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Table[];
};

// Get tables by area
export const getTablesByArea = async (area: TableArea) => {
  const tablesCollection = collection(db, TABLES);
  const q = query(tablesCollection, where('area', '==', area));
  const tablesSnapshot = await getDocs(q);
  return tablesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Table[];
};

// Get tables by status
export const getTablesByStatus = async (status: TableStatus) => {
  const tablesCollection = collection(db, TABLES);
  const q = query(tablesCollection, where('status', '==', status));
  const tablesSnapshot = await getDocs(q);
  return tablesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Table[];
};

// Get table by ID
export const getTableById = async (id: string) => {
  const tableRef = doc(db, TABLES, id);
  const tableSnap = await getDoc(tableRef);
  
  if (tableSnap.exists()) {
    return {
      id: tableSnap.id,
      ...tableSnap.data()
    } as Table;
  }
  
  return null;
};

// Create a new table
export const createTable = async (table: Omit<Table, 'id'>) => {
  const docRef = await addDoc(collection(db, TABLES), table);
  return {
    id: docRef.id,
    ...table
  } as Table;
};

// Update a table
export const updateTable = async (id: string, updates: Partial<Table>) => {
  const tableRef = doc(db, TABLES, id);
  await updateDoc(tableRef, updates);
  return {
    id,
    ...updates
  };
};

// Delete a table
export const deleteTable = async (id: string) => {
  const tableRef = doc(db, TABLES, id);
  await deleteDoc(tableRef);
};

// Function to update all tables with old statuses to the new simplified statuses
export const updateAllTableStatuses = async () => {
  const tablesCollection = collection(db, TABLES);
  const tablesSnapshot = await getDocs(tablesCollection);
  
  const updatePromises = tablesSnapshot.docs.map(doc => {
    const tableData = doc.data();
    // Convert any status that's not 'Available' or 'Occupied' to 'Available'
    if (tableData.status !== 'Available' && tableData.status !== 'Occupied') {
      console.log(`Updating table ${doc.id} from status ${tableData.status} to Available`);
      return updateDoc(doc.ref, { 
        status: 'Available',
        currentOrderId: null // Clear any existing order ID
      });
    }
    return Promise.resolve(); // No update needed
  });
  
  await Promise.all(updatePromises);
  console.log('All table statuses updated to simplified values');
  return true;
};

// Update table status
export const updateTableStatus = async (id: string, status: TableStatus, currentOrderId?: string) => {
  const tableRef = doc(db, TABLES, id);
  
  // Explicitly type updates to include null for currentOrderId
  const updates: Partial<Table> = { status };
  
  // If status is Occupied, we need the currentOrderId
  if (status === 'Occupied' && currentOrderId) {
    updates.currentOrderId = currentOrderId;
  }
  
  // If status is not Occupied, remove the currentOrderId
  if (status !== 'Occupied') {
    // Use Firebase FieldValue.delete() to remove the field instead of setting to undefined
    updates.currentOrderId = null;  // Using null instead of undefined
  }
  
  // Special case: If we're trying to set a table to Available, always allow it
  // This ensures tables can be made available even if order items are removed
  if (status === 'Available') {
    updates.status = 'Available';
    updates.currentOrderId = null;
  }
  
  await updateDoc(tableRef, updates);
  
  return {
    id,
    ...updates
  };
};

// Check if tables collection exists
export const checkTablesCollection = async () => {
  const tablesCollection = collection(db, TABLES);
  const tablesSnapshot = await getDocs(tablesCollection);
  return !tablesSnapshot.empty;
};
