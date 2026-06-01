import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyASz7huPhBJ3JbYtwGyQz6WBktDcpu0yFo",
  authDomain: "nearbuy-d7daf.firebaseapp.com",
  projectId: "nearbuy-d7daf",
  storageBucket: "nearbuy-d7daf.firebasestorage.app",
  messagingSenderId: "1009771297153",
  appId: "1:1009771297153:web:fd18e7ca3d15c8581d9080",
  measurementId: "G-S6MDPVPQBV"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Messaging and get a reference to the service
export const getMessagingInstance = async () => {
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
};

export default app;
