// app/firebaseConfig.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// IMPORTANT: Use these for React Native
import { getAuth, sendPasswordResetEmail } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyAQNYtOCEJocCT8UKIiB-pQqv_8iThP98M",
  authDomain: "mindbuddy-782b3.firebaseapp.com",
  projectId: "mindbuddy-782b3",
  storageBucket: "mindbuddy-782b3.appspot.com",
  messagingSenderId: "469852301633",
  appId: "1:469852301633:web:f3a14422b7a314932819c0",
  measurementId: "G-58H5W8GEX4"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();


const auth = getAuth(app); 

const db = getFirestore(app);

export { auth, db, sendPasswordResetEmail };
