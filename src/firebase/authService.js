import { auth, googleProvider } from "./firebase-config";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";

export const loginWithGoogle = () => {
  signInWithRedirect(auth, googleProvider);
};

export const fetchRedirectResult = () =>
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const user = result.user;
        return user;
      }
    })
    .catch((error) => {
      throw error;
    });
