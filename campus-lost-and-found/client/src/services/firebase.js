import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

let app;
try {
  if (!firebaseConfig.apiKey) {
    console.warn("Firebase API Key is missing. Check your .env file or Render environment variables.");
  }
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
const storageBucket = (firebaseConfig.storageBucket || '')
  .replace(/^gs:\/\//, '')
  .replace(/^https?:\/\//, '')
  .replace(/\/+$/, '');
export const storage = app 
  ? (storageBucket ? getStorage(app, `gs://${storageBucket}`) : getStorage(app))
  : null;
export default app;
