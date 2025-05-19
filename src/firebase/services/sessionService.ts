import { collection, addDoc, updateDoc, doc, query, where, getDocs, orderBy, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config';
import { Session, Transaction, PaymentMethod } from '../../types/session';

const SESSIONS = 'sessions';
const TRANSACTIONS = 'transactions';

// Create a new session
export const startSession = async (userId: string): Promise<Session> => {
  try {
    // Check if there's already an active session
    const activeSession = await getActiveSession();
    if (activeSession) {
      throw new Error('There is already an active session. Please close it before starting a new one.');
    }

    // Create a new session
    const newSession: Omit<Session, 'id'> = {
      startTime: new Date(),
      isActive: true,
      cashTotal: 0,
      upiTotal: 0,
      bankTotal: 0,
      totalRevenue: 0,
      transactions: [],
      userId
    };

    const docRef = await addDoc(collection(db, SESSIONS), {
      ...newSession,
      startTime: Timestamp.fromDate(new Date())
    });

    return {
      ...newSession,
      id: docRef.id
    } as Session;
  } catch (error) {
    console.error('Error starting session:', error);
    throw error;
  }
};

// End the active session
export const endSession = async (notes?: string): Promise<Session | null> => {
  try {
    const activeSession = await getActiveSession();
    if (!activeSession) {
      throw new Error('No active session found.');
    }

    const sessionRef = doc(db, SESSIONS, activeSession.id);
    const endTime = new Date();
    
    await updateDoc(sessionRef, {
      endTime: Timestamp.fromDate(endTime),
      isActive: false,
      notes: notes || ''
    });

    return {
      ...activeSession,
      endTime,
      isActive: false,
      notes: notes || ''
    };
  } catch (error) {
    console.error('Error ending session:', error);
    throw error;
  }
};

// Get the currently active session
export const getActiveSession = async (): Promise<Session | null> => {
  try {
    const sessionsCollection = collection(db, SESSIONS);
    const q = query(sessionsCollection, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const sessionDoc = querySnapshot.docs[0];
    const sessionData = sessionDoc.data();

    return {
      id: sessionDoc.id,
      ...sessionData,
      startTime: sessionData.startTime?.toDate() || new Date(),
      endTime: sessionData.endTime?.toDate() || undefined
    } as Session;
  } catch (error) {
    console.error('Error getting active session:', error);
    throw error;
  }
};

// Get all sessions
export const getAllSessions = async (): Promise<Session[]> => {
  try {
    const sessionsCollection = collection(db, SESSIONS);
    const q = query(sessionsCollection, orderBy('startTime', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || undefined
      } as Session;
    });
  } catch (error) {
    console.error('Error getting all sessions:', error);
    throw error;
  }
};

// Add a transaction to the active session
export const addTransaction = async (
  orderId: string,
  amount: number,
  paymentMethod: PaymentMethod
): Promise<Transaction> => {
  try {
    const activeSession = await getActiveSession();
    if (!activeSession) {
      throw new Error('No active session found. Please start a session before processing payments.');
    }

    // Create transaction
    const newTransaction: Omit<Transaction, 'id'> = {
      orderId,
      amount,
      paymentMethod,
      timestamp: new Date(),
      status: 'completed'
    };

    const transactionRef = await addDoc(collection(db, TRANSACTIONS), {
      ...newTransaction,
      sessionId: activeSession.id,
      timestamp: Timestamp.fromDate(new Date())
    });

    const transaction = {
      ...newTransaction,
      id: transactionRef.id
    } as Transaction;

    // Update session totals
    const sessionRef = doc(db, SESSIONS, activeSession.id);
    const sessionDoc = await getDoc(sessionRef);
    const sessionData = sessionDoc.data() as Omit<Session, 'id'>;

    let cashTotal = sessionData.cashTotal || 0;
    let upiTotal = sessionData.upiTotal || 0;
    let bankTotal = sessionData.bankTotal || 0;

    // Update the appropriate payment method total
    switch (paymentMethod) {
      case 'CASH':
        cashTotal += amount;
        break;
      case 'UPI':
        upiTotal += amount;
        break;
      case 'BANK':
        bankTotal += amount;
        break;
    }

    const totalRevenue = cashTotal + upiTotal + bankTotal;

    await updateDoc(sessionRef, {
      cashTotal,
      upiTotal,
      bankTotal,
      totalRevenue
    });

    // Process inventory for the order
    try {
      // Import the necessary functions
      const { getOrderById } = require('./orderService');
      const { processInventoryForOrder } = require('./inventoryService');
      
      // Get the order details
      const order = await getOrderById(orderId);
      
      if (order) {
        // Process inventory deduction for the order
        await processInventoryForOrder(order.orderItems, orderId);
      }
    } catch (inventoryError) {
      console.error('Error processing inventory for order:', inventoryError);
      // Continue with the transaction even if inventory processing fails
      // This ensures the payment is still recorded
    }

    return transaction;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

// Get a specific session by ID
export const getSessionById = async (sessionId: string): Promise<Session | null> => {
  try {
    const sessionRef = doc(db, SESSIONS, sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      return null;
    }
    
    const sessionData = sessionDoc.data();
    return {
      id: sessionDoc.id,
      ...sessionData,
      startTime: sessionData.startTime?.toDate() || new Date(),
      endTime: sessionData.endTime?.toDate() || undefined
    } as Session;
  } catch (error) {
    console.error('Error getting session by ID:', error);
    throw error;
  }
};

// Get transactions for a specific session
export const getSessionTransactions = async (sessionId: string): Promise<Transaction[]> => {
  try {
    const transactionsCollection = collection(db, TRANSACTIONS);
    // Remove the orderBy clause to avoid requiring a composite index
    const q = query(
      transactionsCollection, 
      where('sessionId', '==', sessionId)
    );
    const querySnapshot = await getDocs(q);

    // Convert and sort the results in memory instead
    const transactions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date()
      } as Transaction;
    });
    
    // Sort by timestamp in descending order (newest first)
    transactions.sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return timeB.getTime() - timeA.getTime();
    });
    
    return transactions;
  } catch (error) {
    console.error('Error getting session transactions:', error);
    throw error;
  }
};
