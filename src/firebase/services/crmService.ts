import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config';
import { Customer, LoyaltyTransaction, CustomerCoupon, CustomerGiftCard, OrderSummaryForCustomer } from '../../types';

// Collection names
const CUSTOMERS = 'customers';
const LOYALTY_TRANSACTIONS = 'loyaltyTransactions';

// Customers
export const getCustomers = async () => {
  const customersCollection = collection(db, CUSTOMERS);
  const customersSnapshot = await getDocs(customersCollection);
  return customersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Customer[];
};

export const searchCustomers = async (searchTerm: string) => {
  // Note: Firestore doesn't support native text search, so we're doing simple field matching
  // For production, consider using Algolia or a similar search service
  const customersCollection = collection(db, CUSTOMERS);
  const nameQuery = query(customersCollection, where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'));
  const emailQuery = query(customersCollection, where('email', '>=', searchTerm), where('email', '<=', searchTerm + '\uf8ff'));
  const phoneQuery = query(customersCollection, where('phone', '>=', searchTerm), where('phone', '<=', searchTerm + '\uf8ff'));
  
  const [nameSnapshot, emailSnapshot, phoneSnapshot] = await Promise.all([
    getDocs(nameQuery),
    getDocs(emailQuery),
    getDocs(phoneQuery)
  ]);
  
  // Combine results and remove duplicates
  const results = new Map<string, Customer>();
  
  [...nameSnapshot.docs, ...emailSnapshot.docs, ...phoneSnapshot.docs].forEach(doc => {
    if (!results.has(doc.id)) {
      results.set(doc.id, {
        id: doc.id,
        ...doc.data()
      } as Customer);
    }
  });
  
  return Array.from(results.values());
};

export const getCustomerById = async (id: string) => {
  const customerRef = doc(db, CUSTOMERS, id);
  const customerSnap = await getDoc(customerRef);
  
  if (customerSnap.exists()) {
    return {
      id: customerSnap.id,
      ...customerSnap.data()
    } as Customer;
  }
  
  return null;
};

export const getCustomerByEmail = async (email: string) => {
  const customersCollection = collection(db, CUSTOMERS);
  const q = query(customersCollection, where('email', '==', email));
  const customersSnapshot = await getDocs(q);
  
  if (!customersSnapshot.empty) {
    const doc = customersSnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Customer;
  }
  
  return null;
};

export const getCustomerByPhone = async (phone: string) => {
  const customersCollection = collection(db, CUSTOMERS);
  const q = query(customersCollection, where('phone', '==', phone));
  const customersSnapshot = await getDocs(q);
  
  if (!customersSnapshot.empty) {
    const doc = customersSnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Customer;
  }
  
  return null;
};

export const createCustomer = async (customer: Omit<Customer, 'id' | 'loyaltyPointsBalance' | 'loyaltyPointsHistory' | 'orderHistoryIds' | 'associatedCoupons' | 'associatedGiftCards'>) => {
  // Set default values
  const newCustomer = {
    ...customer,
    loyaltyPointsBalance: 0,
    loyaltyPointsHistory: [],
    orderHistoryIds: [],
    associatedCoupons: [],
    associatedGiftCards: [],
    joinDate: new Date()
  };
  
  const docRef = await addDoc(collection(db, CUSTOMERS), newCustomer);
  return {
    id: docRef.id,
    ...newCustomer
  } as Customer;
};

export const updateCustomer = async (id: string, updates: Partial<Customer>) => {
  const customerRef = doc(db, CUSTOMERS, id);
  await updateDoc(customerRef, updates);
  return {
    id,
    ...updates
  };
};

export const deleteCustomer = async (id: string) => {
  const customerRef = doc(db, CUSTOMERS, id);
  await deleteDoc(customerRef);
};

// Loyalty Points
export const addLoyaltyPoints = async (customerId: string, points: number, description: string, relatedOrderId?: string) => {
  const customerRef = doc(db, CUSTOMERS, customerId);
  const customerSnap = await getDoc(customerRef);
  
  if (customerSnap.exists()) {
    const customer = customerSnap.data() as Customer;
    
    // Create new transaction
    const transaction: LoyaltyTransaction = {
      id: `LT${Date.now()}`,
      date: new Date(),
      type: 'earned',
      points,
      description,
      relatedOrderId
    };
    
    // Update customer
    const newBalance = (customer.loyaltyPointsBalance || 0) + points;
    const loyaltyPointsHistory = [...(customer.loyaltyPointsHistory || []), transaction];
    
    await updateDoc(customerRef, {
      loyaltyPointsBalance: newBalance,
      loyaltyPointsHistory
    });
    
    return {
      transaction,
      newBalance
    };
  }
  
  throw new Error('Customer not found');
};

export const redeemLoyaltyPoints = async (customerId: string, points: number, description: string, relatedOrderId?: string) => {
  const customerRef = doc(db, CUSTOMERS, customerId);
  const customerSnap = await getDoc(customerRef);
  
  if (customerSnap.exists()) {
    const customer = customerSnap.data() as Customer;
    
    // Check if customer has enough points
    if ((customer.loyaltyPointsBalance || 0) < points) {
      throw new Error('Insufficient loyalty points');
    }
    
    // Create new transaction
    const transaction: LoyaltyTransaction = {
      id: `LT${Date.now()}`,
      date: new Date(),
      type: 'redeemed',
      points: -points, // Negative for redemption
      description,
      relatedOrderId
    };
    
    // Update customer
    const newBalance = (customer.loyaltyPointsBalance || 0) - points;
    const loyaltyPointsHistory = [...(customer.loyaltyPointsHistory || []), transaction];
    
    await updateDoc(customerRef, {
      loyaltyPointsBalance: newBalance,
      loyaltyPointsHistory
    });
    
    return {
      transaction,
      newBalance
    };
  }
  
  throw new Error('Customer not found');
};

// Customer Coupons
export const assignCouponToCustomer = async (customerId: string, couponCode: string, description: string, expiryDate?: Date) => {
  const customerRef = doc(db, CUSTOMERS, customerId);
  const customerSnap = await getDoc(customerRef);
  
  if (customerSnap.exists()) {
    const customer = customerSnap.data() as Customer;
    
    // Check if coupon is already assigned
    if (customer.associatedCoupons?.some(c => c.couponCode === couponCode)) {
      throw new Error('Coupon already assigned to customer');
    }
    
    // Create new customer coupon
    const customerCoupon: CustomerCoupon = {
      couponCode,
      description,
      status: 'active',
      expiryDate,
      dateAdded: new Date()
    };
    
    // Update customer
    const associatedCoupons = [...(customer.associatedCoupons || []), customerCoupon];
    
    await updateDoc(customerRef, {
      associatedCoupons
    });
    
    return customerCoupon;
  }
  
  throw new Error('Customer not found');
};

// Customer Gift Cards
export const assignGiftCardToCustomer = async (customerId: string, giftCardCode: string, initialBalance: number, expiryDate?: Date) => {
  const customerRef = doc(db, CUSTOMERS, customerId);
  const customerSnap = await getDoc(customerRef);
  
  if (customerSnap.exists()) {
    const customer = customerSnap.data() as Customer;
    
    // Check if gift card is already assigned
    if (customer.associatedGiftCards?.some(g => g.giftCardCode === giftCardCode)) {
      throw new Error('Gift card already assigned to customer');
    }
    
    // Create new customer gift card
    const customerGiftCard: CustomerGiftCard = {
      giftCardCode,
      initialBalance,
      currentBalance: initialBalance,
      issueDate: new Date(),
      expiryDate
    };
    
    // Update customer
    const associatedGiftCards = [...(customer.associatedGiftCards || []), customerGiftCard];
    
    await updateDoc(customerRef, {
      associatedGiftCards
    });
    
    return customerGiftCard;
  }
  
  throw new Error('Customer not found');
};

// Order History
export const addOrderToCustomerHistory = async (customerId: string, orderSummary: OrderSummaryForCustomer) => {
  const customerRef = doc(db, CUSTOMERS, customerId);
  const customerSnap = await getDoc(customerRef);
  
  if (customerSnap.exists()) {
    const customer = customerSnap.data() as Customer;
    
    // Update customer's order history
    const orderHistoryIds = [...(customer.orderHistoryIds || []), orderSummary.id];
    
    await updateDoc(customerRef, {
      orderHistoryIds
    });
    
    return orderHistoryIds;
  }
  
  throw new Error('Customer not found');
};
