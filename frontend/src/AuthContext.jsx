import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, isMock, signInWithGoogle, logout } from './firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMock) {
      // Mock user not logged in initially
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      if (isMock) {
        const email = window.prompt(
          "Firebase config not detected. Running in Mock Mode.\n\nEnter an email to simulate Google Sign In:\n(Tip: use aditya.123.22.111@gmail.com to test upload access)", 
          "aditya.123.22.111@gmail.com"
        );
        
        if (!email) return; // User cancelled
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setCurrentUser({
          uid: "mock-uid-" + Date.now(),
          displayName: email.split('@')[0],
          email: email,
          photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + email
        });
      } else {
        await signInWithGoogle();
        // The onAuthStateChanged listener will handle setCurrentUser
      }
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed: " + error.message);
    }
  };

  const logoutUser = async () => {
    try {
      if (isMock) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setCurrentUser(null);
      } else {
        await logout();
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const value = {
    currentUser,
    login,
    logout: logoutUser,
    isMock
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
