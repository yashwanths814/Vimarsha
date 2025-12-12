// shared/firebaseConfig.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database"; // ✅ ADD

const firebaseConfig = {
  apiKey: "AIzaSyABgManZ9LUxUhDXSq8a7WZfqw0qoTclQo",
  authDomain: "track-system-free.firebaseapp.com",
  projectId: "track-system-free",
  storageBucket: "track-system-free.appspot.com",
  messagingSenderId: "849936533226",
  appId: "1:849936533226:web:a06033aa6c2a77d3737993",

  // ✅ THIS WAS MISSING (CRITICAL)
  databaseURL: "https://track-system-free-default-rtdb.firebaseio.com",
};

function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export const app = getFirebaseApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ Export RTDB instance (recommended)
export const rtdb = getDatabase(app);
