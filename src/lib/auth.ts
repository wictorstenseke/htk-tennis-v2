import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";

import { usersApi } from "./api";
import { auth, isFirebaseConfigured } from "./firebase";

export type { User };

export const signIn = async (
  email: string,
  password: string
): Promise<User> => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase är inte konfigurerat för inloggning.");
  }

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
};

export const signUp = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase är inte konfigurerat för registrering.");
  }

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;
  const userEmail = user.email ?? email;
  const normalizedDisplayName = displayName?.trim() || undefined;

  try {
    await usersApi.createUser({
      uid: user.uid,
      email: userEmail,
      displayName: normalizedDisplayName,
    });
  } catch (error) {
    console.error(
      "Failed to create user profile; sign-up succeeded without profile data:",
      error
    );
  }

  return user;
};

export const signOut = async (): Promise<void> => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase är inte konfigurerat för utloggning.");
  }

  await firebaseSignOut(auth);
};

/**
 * Wait for Firebase Auth to initialize and return current user
 * This is a utility function for use in route guards
 */
export const waitForAuthReady = async (): Promise<User | null> => {
  if (!isFirebaseConfigured || !auth) {
    return null;
  }

  // Wait for auth to initialize using authStateReady
  await auth.authStateReady();
  return auth.currentUser;
};
