import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      console.error("Auth or DB not initialized. Check Firebase config.");
      setLoading(false);
      return;
    }
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous profile listener if it exists
      if (unsubscribeProfile) unsubscribeProfile();

      if (firebaseUser) {
        // Use onSnapshot to listen to profile changes in real-time
        // This fixes the signup race condition and makes the app feel faster
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUser({ ...firebaseUser, ...docSnap.data(), uid: firebaseUser.uid });
          } else {
            // Document might not be created yet during signup
            setUser(firebaseUser);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile listener error:", error);
          setUser(firebaseUser);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const value = {
    user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
