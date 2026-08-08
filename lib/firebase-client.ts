"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD_b7TASutFOmoUKskH6yLjmxJzVpTUIn4",
  authDomain: "mypeer-501909.firebaseapp.com",
  projectId: "mypeer-501909",
  storageBucket: "mypeer-501909.firebasestorage.app",
  messagingSenderId: "470549580687",
  appId: "1:470549580687:web:d4b4b1fb1d659e5fb719fa",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
