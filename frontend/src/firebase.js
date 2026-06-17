import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// TODO: Replace these with your actual Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let app, auth, googleProvider;
let isMock = false;

try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } else {
    isMock = true;
  }
} catch (error) {
  console.warn("Firebase initialization error", error);
  isMock = true;
}

// Mock implementation for demo purposes before user adds Firebase config
const mockUser = {
  uid: "12345",
  displayName: "Aditya",
  email: "aditya.123.22.111@gmail.com",
  photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya"
};

export const signInWithGoogle = async () => {
  if (isMock) {
    console.log("Mock Sign In");
    return new Promise(resolve => setTimeout(() => resolve({ user: mockUser }), 500));
  }
  return signInWithPopup(auth, googleProvider);
};

export const logout = async () => {
  if (isMock) {
    console.log("Mock Sign Out");
    return new Promise(resolve => setTimeout(resolve, 500));
  }
  return signOut(auth);
};

export { auth, isMock };
