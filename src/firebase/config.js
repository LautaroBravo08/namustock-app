import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBjOHlQnh9oMs7RV4IrEJSik0AELCQsQTQ",
  authDomain: "namu-inv.firebaseapp.com",
  projectId: "namu-inv",
  storageBucket: "namu-inv.firebasestorage.app",
  messagingSenderId: "1054302858836",
  appId: "1:1054302858836:web:e2807325619f3fd0ad47c1",
  measurementId: "G-WSFXDYTDY8"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;