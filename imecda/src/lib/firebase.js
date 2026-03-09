// Import the functions you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUUmMBR9HIUe4EmbgAj3pF42MMD_GE5FE",
  authDomain: "imecda.firebaseapp.com",
  projectId: "imecda",
  storageBucket: "imecda.firebasestorage.app",
  messagingSenderId: "791839913377",
  appId: "1:791839913377:web:e71f3d079f5ecd129307e0",
  measurementId: "G-0S23S706SY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);