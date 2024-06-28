import { auth, provider } from "./firebase-config";
import { signInWithPopup, signOut } from "firebase/auth";

export const loginWithGoogle = () => {
  return signInWithPopup(auth, provider)
    .then((result) => {
      return result.user;
    })
    .catch((error) => {
      throw error;
    });
};

export const logoutUser = () => {
  return signOut(auth)
  .then(() => {
    console.log("User signed out successfully");
  })
  .catch((error) => {
    throw error;
  });
};

// Listen to authentication changes (not needed rn)
export const onAuthStateChange = (callback) => {
  return auth.onAuthStateChanged((user) => {
    console.log("Auth state changed:", user);
    callback(user);
  });
};