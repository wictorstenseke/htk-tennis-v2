import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";

import { auth } from "./firebase";

export type { User };

export const signIn = async (
  email: string,
  password: string
): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
};

export const signUp = async (
  email: string,
  password: string
): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

/**
 * Wait for Firebase Auth to initialize and return current user
 * This is a utility function for use in route guards
 */
export const waitForAuthReady = async (): Promise<User | null> => {
  // Wait for auth to initialize using authStateReady
  await auth.authStateReady();
  return auth.currentUser;
};
