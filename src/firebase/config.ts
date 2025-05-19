// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbYWl7OcPSoxpTfUSTYHyBM0-9IfzuxeA",
  authDomain: "ariespos-7c20b.firebaseapp.com",
  projectId: "ariespos-7c20b",
  storageBucket: "ariespos-7c20b.firebasestorage.app",
  messagingSenderId: "649776804341",
  appId: "1:649776804341:web:4ba2204f583ac00b1870bc",
  measurementId: "G-32MMK2FJ4G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { db, storage, auth, analytics };
