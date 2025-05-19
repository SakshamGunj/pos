import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../config';
import { Order, OrderItem, Table } from '../../types';

// Collection names
const ORDERS = 'orders';
const TABLES = 'tables';

// Orders
export const getOrders = async () => {
  const ordersCollection = collection(db, ORDERS);
  const q = query(ordersCollection, orderBy('orderDate', 'desc'));
  const ordersSnapshot = await getDocs(q);
  return ordersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Order[];
};

export const getActiveOrders = async () => {
  const ordersCollection = collection(db, ORDERS);
  const q = query(
    ordersCollection, 
    where('status', 'in', ['draft', 'pending', 'preparing', 'ready']),
    orderBy('orderDate', 'desc')
  );
  const ordersSnapshot = await getDocs(q);
  return ordersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Order[];
};

export const getConfirmedUnpaidOrders = async () => {
  const ordersCollection = collection(db, ORDERS);
  // Simplified query that doesn't require a composite index
  const q = query(
    ordersCollection, 
    where('status', '==', 'confirmed')
  );
  const ordersSnapshot = await getDocs(q);
  
  // Sort the results in memory instead of in the query
  const orders = ordersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Order[];
  
  // Sort by orderDate in descending order
  return orders.sort((a, b) => {
    const dateA = a.orderDate instanceof Date ? a.orderDate : new Date(a.orderDate);
    const dateB = b.orderDate instanceof Date ? b.orderDate : new Date(b.orderDate);
    return dateB.getTime() - dateA.getTime();
  });
};

export const getOrdersByStatus = async (status: Order['status']) => {
  const ordersCollection = collection(db, ORDERS);
  const q = query(
    ordersCollection, 
    where('status', '==', status),
    orderBy('orderDate', 'desc')
  );
  const ordersSnapshot = await getDocs(q);
  return ordersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Order[];
};

export const getOrdersByTable = async (tableId: string) => {
  const ordersCollection = collection(db, ORDERS);
  const q = query(
    ordersCollection, 
    where('tableId', '==', tableId),
    orderBy('orderDate', 'desc')
  );
  const ordersSnapshot = await getDocs(q);
  return ordersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Order[];
};

export const getOrderById = async (id: string) => {
  const orderRef = doc(db, ORDERS, id);
  const orderSnap = await getDoc(orderRef);
  
  if (orderSnap.exists()) {
    return {
      id: orderSnap.id,
      ...orderSnap.data()
    } as Order;
  }
  
  return null;
};

export const createOrder = async (order: Omit<Order, 'id'>, sessionId?: string) => {
  const firestoreOrder = {
    ...order,
    orderDate: new Date(),
    sessionId: sessionId || null // Associate order with current session if provided
  };
  
  const docRef = await addDoc(collection(db, ORDERS), firestoreOrder);
  
  // If this order is associated with a table, update the table's currentOrderId
  if (order.tableId) {
    const tableRef = doc(db, TABLES, order.tableId);
    await updateDoc(tableRef, {
      currentOrderId: docRef.id,
      status: 'Occupied'
    });
  }
  
  return {
    id: docRef.id,
    ...order,
    sessionId
  } as Order;
};

export const updateOrder = async (id: string, updates: Partial<Order>) => {
  const orderRef = doc(db, ORDERS, id);
  await updateDoc(orderRef, updates);
  
  // If status is changing to 'paid', update the table status
  if (updates.status === 'paid') {
    const orderSnap = await getDoc(orderRef);
    const order = orderSnap.data() as Order;
    
    if (order.tableId) {
      const tableRef = doc(db, TABLES, order.tableId);
      await updateDoc(tableRef, {
        currentOrderId: null,
        status: 'Cleaning'
      });
    }
  }
  
  return {
    id,
    ...updates
  };
};

export const deleteOrder = async (id: string) => {
  // Get the order to check if it has a table
  const orderRef = doc(db, ORDERS, id);
  const orderSnap = await getDoc(orderRef);
  
  if (orderSnap.exists()) {
    const order = orderSnap.data() as Order;
    
    // If this order is associated with a table, update the table's currentOrderId
    if (order.tableId) {
      const tableRef = doc(db, TABLES, order.tableId);
      await updateDoc(tableRef, {
        currentOrderId: null,
        status: 'Available'
      });
    }
  }
  
  await deleteDoc(orderRef);
};

// Get orders by session ID
export const getOrdersBySession = async (sessionId: string) => {
  const ordersCollection = collection(db, ORDERS);
  // Use a simpler query that doesn't require a composite index
  const q = query(
    ordersCollection, 
    where('sessionId', '==', sessionId)
  );
  const ordersSnapshot = await getDocs(q);
  
  // Sort the results in memory
  const orders = ordersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Order[];
  
  // Sort by orderDate in descending order
  return orders.sort((a, b) => {
    const dateA = a.orderDate instanceof Date ? a.orderDate : new Date(a.orderDate);
    const dateB = b.orderDate instanceof Date ? b.orderDate : new Date(b.orderDate);
    return dateB.getTime() - dateA.getTime();
  });
};

// Get orders by date range
export const getOrdersByDateRange = async (startDate: Date, endDate: Date) => {
  const ordersCollection = collection(db, ORDERS);
  
  // Use a single 'where' clause to avoid requiring a composite index
  // We'll filter the second condition in memory
  const q = query(
    ordersCollection, 
    where('orderDate', '>=', Timestamp.fromDate(startDate))
  );
  const ordersSnapshot = await getDocs(q);
  
  // Filter by end date in memory
  const endTimestamp = Timestamp.fromDate(endDate).toMillis();
  
  // Convert and filter the results
  const orders = ordersSnapshot.docs
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      } as Order;
    })
    .filter(order => {
      // Check if orderDate is less than or equal to endDate
      if (!order.orderDate) return false;
      
      const orderTimestamp = order.orderDate instanceof Timestamp 
        ? order.orderDate.toMillis() 
        : new Date(order.orderDate).getTime();
      return orderTimestamp <= endTimestamp;
    });
  
  // Sort by orderDate in descending order
  return orders.sort((a, b) => {
    const dateA = a.orderDate instanceof Date ? a.orderDate : new Date(a.orderDate);
    const dateB = b.orderDate instanceof Date ? b.orderDate : new Date(b.orderDate);
    return dateB.getTime() - dateA.getTime();
  });
};

// Note: Table-related functions have been moved to tableService.ts
// This reference is kept for the orderService to use when needed
// For table operations, please use the functions from tableService.ts
