import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config';

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'manager' | 'staff';
  createdAt: Date;
  lastLogin?: Date;
}

// Register a new user
export const registerUser = async (email: string, password: string, displayName: string, role: 'admin' | 'manager' | 'staff' = 'staff') => {
  try {
    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user's display name
    await updateProfile(user, { displayName });
    
    // Create a user profile document in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email,
      displayName,
      role,
      createdAt: new Date()
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    return userProfile;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Sign in a user
export const signInUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update last login timestamp
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      lastLogin: new Date()
    });
    
    // Get the user profile
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    } else {
      throw new Error('User profile not found');
    }
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign out the current user
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// Get current user profile
export const getCurrentUserProfile = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updates);
    
    // If display name is being updated, also update in Auth
    if (updates.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: updates.displayName });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Check if user has admin role
export const isAdmin = async () => {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'admin';
};

// Check if user has manager role or higher
export const isManagerOrAdmin = async () => {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'admin' || profile?.role === 'manager';
};
