
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";



const firebaseConfig = {
  apiKey: "AIzaSyCVxYrgkBv5yt04074N06ZZcwQaACT7O5I",
  authDomain: "barangayinformartioncenter.firebaseapp.com",
  projectId: "barangayinformartioncenter",
  storageBucket: "barangayinformartioncenter.firebasestorage.app",
  messagingSenderId: "267500815065",
  appId: "1:267500815065:web:8516a0cd54ad2346d6b4c8",
  measurementId: "G-HXT0FY6596"
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);


const analytics = getAnalytics(app);

export default app;
