import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config';
import { Coupon, GiftCard, GiftCardStatus } from '../../types';

// Collection names
const COUPONS = 'coupons';
const GIFT_CARDS = 'giftCards';

// Coupons
export const getCoupons = async () => {
  const couponsCollection = collection(db, COUPONS);
  const couponsSnapshot = await getDocs(couponsCollection);
  return couponsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Coupon[];
};

export const getActiveCoupons = async () => {
  const couponsCollection = collection(db, COUPONS);
  const q = query(couponsCollection, where('isActive', '==', true));
  const couponsSnapshot = await getDocs(q);
  return couponsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Coupon[];
};

export const getCouponByCode = async (code: string) => {
  const couponsCollection = collection(db, COUPONS);
  const q = query(couponsCollection, where('code', '==', code));
  const couponsSnapshot = await getDocs(q);
  
  if (!couponsSnapshot.empty) {
    const doc = couponsSnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Coupon;
  }
  
  return null;
};

export const createCoupon = async (coupon: Omit<Coupon, 'id'>) => {
  // Set default values
  const newCoupon = {
    ...coupon,
    timesUsed: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const docRef = await addDoc(collection(db, COUPONS), newCoupon);
  return {
    id: docRef.id,
    ...newCoupon
  } as Coupon;
};

export const updateCoupon = async (id: string, updates: Partial<Coupon>) => {
  const couponRef = doc(db, COUPONS, id);
  
  const updatedCoupon = {
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  await updateDoc(couponRef, updatedCoupon);
  return {
    id,
    ...updates
  };
};

export const deleteCoupon = async (id: string) => {
  const couponRef = doc(db, COUPONS, id);
  await deleteDoc(couponRef);
};

export const incrementCouponUsage = async (id: string) => {
  const couponRef = doc(db, COUPONS, id);
  const couponSnap = await getDoc(couponRef);
  
  if (couponSnap.exists()) {
    const coupon = couponSnap.data() as Coupon;
    await updateDoc(couponRef, {
      timesUsed: (coupon.timesUsed || 0) + 1,
      updatedAt: new Date().toISOString()
    });
  }
};

// Gift Cards
export const getGiftCards = async () => {
  const giftCardsCollection = collection(db, GIFT_CARDS);
  const giftCardsSnapshot = await getDocs(giftCardsCollection);
  return giftCardsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as GiftCard[];
};

export const getActiveGiftCards = async () => {
  const giftCardsCollection = collection(db, GIFT_CARDS);
  const q = query(giftCardsCollection, where('isActive', '==', true));
  const giftCardsSnapshot = await getDocs(q);
  return giftCardsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as GiftCard[];
};

export const getGiftCardByCode = async (code: string) => {
  const giftCardsCollection = collection(db, GIFT_CARDS);
  const q = query(giftCardsCollection, where('code', '==', code));
  const giftCardsSnapshot = await getDocs(q);
  
  if (!giftCardsSnapshot.empty) {
    const doc = giftCardsSnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as GiftCard;
  }
  
  return null;
};

export const createGiftCard = async (giftCard: Omit<GiftCard, 'id'>) => {
  // Set default values
  const newGiftCard = {
    ...giftCard,
    currentBalance: giftCard.initialBalance,
    redemptionHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const docRef = await addDoc(collection(db, GIFT_CARDS), newGiftCard);
  return {
    id: docRef.id,
    ...newGiftCard
  } as GiftCard;
};

export const updateGiftCard = async (id: string, updates: Partial<GiftCard>) => {
  const giftCardRef = doc(db, GIFT_CARDS, id);
  
  const updatedGiftCard = {
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  await updateDoc(giftCardRef, updatedGiftCard);
  return {
    id,
    ...updates
  };
};

export const deleteGiftCard = async (id: string) => {
  const giftCardRef = doc(db, GIFT_CARDS, id);
  await deleteDoc(giftCardRef);
};

export const redeemGiftCard = async (id: string, orderId: string, amountRedeemed: number) => {
  const giftCardRef = doc(db, GIFT_CARDS, id);
  const giftCardSnap = await getDoc(giftCardRef);
  
  if (giftCardSnap.exists()) {
    const giftCard = giftCardSnap.data() as GiftCard;
    
    // Check if there's enough balance
    if (giftCard.currentBalance < amountRedeemed) {
      throw new Error('Insufficient balance on gift card');
    }
    
    // Update the gift card
    const newBalance = giftCard.currentBalance - amountRedeemed;
    const redemptionHistory = [...(giftCard.redemptionHistory || []), {
      orderId,
      amountRedeemed,
      redeemedAt: new Date().toISOString()
    }];
    
    // Update status if balance is now 0
    const status = newBalance === 0 ? GiftCardStatus.USED : giftCard.isActive ? GiftCardStatus.ACTIVE : GiftCardStatus.INACTIVE;
    
    await updateDoc(giftCardRef, {
      currentBalance: newBalance,
      redemptionHistory,
      isActive: status === GiftCardStatus.ACTIVE,
      updatedAt: new Date().toISOString()
    });
    
    return {
      id,
      currentBalance: newBalance,
      redemptionHistory
    };
  }
  
  throw new Error('Gift card not found');
};
