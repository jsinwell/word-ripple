import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCf3RvgBt3aaQT0O3gMLd54vh_L5ZOO140",
  authDomain: "word-ripple.firebaseapp.com",
  projectId: "word-ripple",
  storageBucket: "word-ripple.appspot.com",
  messagingSenderId: "607695525961",
  appId: "1:607695525961:web:0a0268ff25b14a79d0c798",
  measurementId: "G-Z3CSKW36EG",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
