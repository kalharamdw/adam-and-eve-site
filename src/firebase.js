import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // <-- Added Firestore import

const firebaseConfig = {
  apiKey: "AIzaSyCpuYs1SLbgM0ZCUHv5DhfY18Nu3VcHB8c",
  authDomain: "adam-and-eve-website.firebaseapp.com",
  databaseURL: "https://adam-and-eve-website-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "adam-and-eve-website",
  storageBucket: "adam-and-eve-website.firebasestorage.app",
  messagingSenderId: "725097794870",
  appId: "1:725097794870:web:383465eecec50d33b7b797",
  measurementId: "G-Q4X14VV1HW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize and export the database so main.js can use it
export const db = getFirestore(app);