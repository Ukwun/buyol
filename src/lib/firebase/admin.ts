import "server-only";

import { getApp, getApps, initializeApp, cert, applicationDefault, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

function assertTrustedServerEnvironment(): void {
  if (typeof window !== "undefined") {
    throw new Error("Firebase Admin SDK cannot be used in a browser environment.");
  }
}

function getAdminCredential() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const configuredCredentialValues = [projectId, clientEmail, privateKey].filter(Boolean).length;

  if (configuredCredentialValues > 0 && configuredCredentialValues < 3) {
    throw new Error(
      "Firebase Admin credentials are incomplete. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY together, or configure Application Default Credentials.",
    );
  }

  if (projectId && clientEmail && privateKey) {
    return cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    });
  }

  const hasApplicationDefaultCredentials = Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT,
  );

  if (!hasApplicationDefaultCredentials) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY, or configure GOOGLE_APPLICATION_CREDENTIALS.",
    );
  }

  return applicationDefault();
}

export function getFirebaseAdminApp(): App {
  assertTrustedServerEnvironment();

  if (getApps().length > 0) return getApp();

  return initializeApp({
    credential: getAdminCredential(),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    storageBucket: process.env.FIREBASE_ADMIN_STORAGE_BUCKET,
  });
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAdminStorage(): Storage {
  return getStorage(getFirebaseAdminApp());
}
