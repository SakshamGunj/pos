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
        status: 'Available'
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
  try {
    if (!sessionId) {
      console.error('Invalid sessionId provided to getOrdersBySession:', sessionId);
      return [];
    }
    
    console.log('Fetching orders for session ID:', sessionId);
    
    // For better reliability, we'll fetch all orders and filter them in memory
    const ordersCollection = collection(db, ORDERS);
    const ordersSnapshot = await getDocs(ordersCollection);
    
    // Filter orders by sessionId
    const orders = ordersSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
    const filteredOrders = orders.filter(order => order.sessionId === sessionId);
    
    console.log(`Found ${filteredOrders.length} orders for session ID: ${sessionId}`);
    
    // Sort by orderDate in descending order
    return filteredOrders.sort((a, b) => {
      try {
        let dateAMillis: number = 0;
        let dateBMillis: number = 0;
        
        // Handle different date formats for sorting
        if (a.orderDate instanceof Timestamp) {
          dateAMillis = a.orderDate.toMillis();
        } else if (a.orderDate instanceof Date) {
          dateAMillis = a.orderDate.getTime();
        } else if (typeof a.orderDate === 'string') {
          dateAMillis = new Date(a.orderDate).getTime();
        } else if (typeof a.orderDate === 'object' && a.orderDate !== null && 'seconds' in a.orderDate) {
          dateAMillis = new Date((a.orderDate as {seconds: number}).seconds * 1000).getTime();
        }
        
        if (b.orderDate instanceof Timestamp) {
          dateBMillis = b.orderDate.toMillis();
        } else if (b.orderDate instanceof Date) {
          dateBMillis = b.orderDate.getTime();
        } else if (typeof b.orderDate === 'string') {
          dateBMillis = new Date(b.orderDate).getTime();
        } else if (typeof b.orderDate === 'object' && b.orderDate !== null && 'seconds' in b.orderDate) {
          dateBMillis = new Date((b.orderDate as {seconds: number}).seconds * 1000).getTime();
        }
        
        return dateBMillis - dateAMillis;
      } catch (error) {
        console.error('Error sorting orders by date:', error);
        return 0;
      }
    });
  } catch (error) {
    console.error('Error in getOrdersBySession:', error);
    return [];
  }
};

// Get orders by date range
export const getOrdersByDateRange = async (startDate: Date, endDate: Date) => {
  try {
    if (!startDate || !endDate) {
      console.error('Invalid date range provided:', { startDate, endDate });
      return [];
    }
    
    console.log('Fetching orders for date range:', startDate, 'to', endDate);
    
    // For better reliability, we'll fetch all orders and filter them in memory
    const ordersCollection = collection(db, ORDERS);
    const ordersSnapshot = await getDocs(ordersCollection);
    
    // Convert date range to milliseconds for comparison
    const startMillis = startDate.getTime();
    const endMillis = endDate.getTime();
    
    console.log(`Date range in milliseconds: ${startMillis} to ${endMillis}`);
    
    // Convert and filter the results
    const orders = ordersSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as Order;
      });
      
    const filteredOrders = orders.filter(order => {
      if (!order.orderDate) {
        console.log(`Order ${order.id} has no orderDate`);
        return false;
      }
      
      let orderMillis: number = 0;
      
      try {
        // Handle different date formats
        if (order.orderDate instanceof Timestamp) {
          orderMillis = order.orderDate.toMillis();
        } else if (order.orderDate instanceof Date) {
          orderMillis = order.orderDate.getTime();
        } else if (typeof order.orderDate === 'string') {
          orderMillis = new Date(order.orderDate).getTime();
        } else if (typeof order.orderDate === 'object' && order.orderDate !== null && 'seconds' in order.orderDate) {
          orderMillis = new Date((order.orderDate as {seconds: number}).seconds * 1000).getTime();
        } else {
          console.log(`Unknown orderDate format for order ${order.id}:`, order.orderDate);
          return false;
        }
        
        // Check if the order date is within the range
        const isInRange = orderMillis >= startMillis && orderMillis <= endMillis;
        return isInRange;
        
      } catch (error) {
        console.error(`Error processing date for order ${order.id}:`, error);
        return false;
      }
    });
    
    console.log(`Found ${filteredOrders.length} orders for date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Sort by orderDate in descending order
    return filteredOrders.sort((a, b) => {
      try {
        let dateAMillis: number = 0;
        let dateBMillis: number = 0;
        
        // Handle different date formats for sorting
        if (a.orderDate instanceof Timestamp) {
          dateAMillis = a.orderDate.toMillis();
        } else if (a.orderDate instanceof Date) {
          dateAMillis = a.orderDate.getTime();
        } else if (typeof a.orderDate === 'string') {
          dateAMillis = new Date(a.orderDate).getTime();
        } else if (typeof a.orderDate === 'object' && a.orderDate !== null && 'seconds' in a.orderDate) {
          dateAMillis = new Date((a.orderDate as {seconds: number}).seconds * 1000).getTime();
        }
        
        if (b.orderDate instanceof Timestamp) {
          dateBMillis = b.orderDate.toMillis();
        } else if (b.orderDate instanceof Date) {
          dateBMillis = b.orderDate.getTime();
        } else if (typeof b.orderDate === 'string') {
          dateBMillis = new Date(b.orderDate).getTime();
        } else if (typeof b.orderDate === 'object' && b.orderDate !== null && 'seconds' in b.orderDate) {
          dateBMillis = new Date((b.orderDate as {seconds: number}).seconds * 1000).getTime();
        }
        
        return dateBMillis - dateAMillis;
      } catch (error) {
        console.error('Error sorting orders by date:', error);
        return 0;
      }
    });
  } catch (error) {
    console.error('Error in getOrdersByDateRange:', error);
    return [];
  }
};

// Note: Table-related functions have been moved to tableService.ts
// This reference is kept for the orderService to use when needed
// For table operations, please use the functions from tableService.ts
