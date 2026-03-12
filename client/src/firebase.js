import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-W4JTX_nJDmddfJISM8qWKVnDhAhvg2s",
  authDomain: "attend-e898c.firebaseapp.com",
  projectId: "attend-e898c",
  storageBucket: "attend-e898c.firebasestorage.app",
  messagingSenderId: "1024262235523",
  appId: "1:1024262235523:web:763cd529c8ec0056ad82b6",
  measurementId: "G-K2XKPMD33J"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
