import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: "nearbuy-d7daf.firebaseapp.com",
  projectId: "nearbuy-d7daf",
  storageBucket: "nearbuy-d7daf.firebasestorage.app",
  messagingSenderId: "1009771297153",
  appId: "1:1009771297153:web:fd18e7ca3d15c8581d9080",
  measurementId: "G-S6MDPVPQBV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
