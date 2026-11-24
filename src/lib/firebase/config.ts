import { z } from "zod";

const firebaseClientConfigSchema = z.object({
  apiKey: z.string().trim().min(1),
  authDomain: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
  storageBucket: z.string().trim().min(1),
  messagingSenderId: z.string().trim().min(1),
  appId: z.string().trim().min(1),
});

export type FirebaseClientConfig = z.infer<typeof firebaseClientConfigSchema>;

/**
 * Reads and validates the browser-safe Firebase configuration lazily.
 * The application can therefore build without a local Firebase project configured.
 */
export function getFirebaseClientConfig(): FirebaseClientConfig {
  const result = firebaseClientConfigSchema.safeParse({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });

  if (!result.success) {
    const missingVariables = Object.keys(result.error.flatten().fieldErrors).map(
      (key) => `NEXT_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`,
    );

    throw new Error(
      `Firebase client configuration is incomplete. Add these variables to .env.local: ${missingVariables.join(", ")}`,
    );
  }

  return result.data;
}
