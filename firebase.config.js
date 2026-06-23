// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCk7ygllZusy6GkRhOm3mve_esmmXh74d0",
  authDomain: "trego-615dc.firebaseapp.com",
  projectId: "trego-615dc",
  storageBucket: "trego-615dc.firebasestorage.app",
  messagingSenderId: "360954493024",
  appId: "1:360954493024:web:2a3639950f16b77966ab05"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});