import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirebaseClientConfig } from "./config";

let clientApp: FirebaseApp | undefined;
let clientAuth: Auth | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (clientApp) return clientApp;

  clientApp = getApps().length > 0
    ? getApp()
    : initializeApp(getFirebaseClientConfig());

  return clientApp;
}

export function getFirebaseAuth(): Auth {
  if (clientAuth) return clientAuth;
  clientAuth = getAuth(getFirebaseApp());

  const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  if (emulatorHost && typeof window !== "undefined") {
    connectAuthEmulator(clientAuth, `http://${emulatorHost}`, { disableWarnings: true });
  }

  return clientAuth;
}

export function getFirebaseFirestore(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}
