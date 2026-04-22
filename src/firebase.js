import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCJmPURWjIYuynOOq1d21PGT56ZHxXi5CQ",
  authDomain: "code-reviewer-78175.firebaseapp.com",
  projectId: "code-reviewer-78175",
  storageBucket: "code-reviewer-78175.firebasestorage.app",
  messagingSenderId: "382611553247",
  appId: "1:382611553247:web:1c276e1edef99fb694626a",
  measurementId: "G-SG2H4NKH5K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);