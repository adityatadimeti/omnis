import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDFT0DuJPC9EWUq67c4PeyFaZAZk4eH-qQ",
  authDomain: "recess-8a2bc.firebaseapp.com",
  projectId: "recess-8a2bc",
  storageBucket: "recess-8a2bc.firebasestorage.app",
  messagingSenderId: "794241899425",
  appId: "1:794241899425:web:4c152b1bf8862cf830c9e0",
  measurementId: "G-D99TCP43F5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export default app;
