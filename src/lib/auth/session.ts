import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { hasAnyActiveVendorMembership, isPlatformAdmin } from "@/lib/permissions";
import type { UserDocument } from "@/types/firestore";
import { SESSION_COOKIE_NAME } from "./session-config";

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS, sessionCookieOptions } from "./session-config";

export interface AuthenticatedServerUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  user: UserDocument;
}

export async function getAuthenticatedServerUser(): Promise<AuthenticatedServerUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
    if (decoded.email_verified !== true) return null;
    const snapshot = await getFirebaseAdminFirestore().collection("users").doc(decoded.uid).get();
    if (!snapshot.exists) return null;

    const user = { id: snapshot.id, ...snapshot.data() } as UserDocument;
    if (user.status !== "active") return null;

    return {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified === true,
      user,
    };
  } catch {
    return null;
  }
}

export async function requireCustomerSession(): Promise<AuthenticatedServerUser> {
  const currentUser = await getAuthenticatedServerUser();
  if (!currentUser) redirect("/sign-in?redirect=%2Faccount");
  return currentUser;
}

export async function requireVendorSession(): Promise<AuthenticatedServerUser> {
  const currentUser = await requireCustomerSession();
  const hasMembership = await hasAnyActiveVendorMembership(currentUser.uid).catch(() => false);
  if (!hasMembership) redirect("/account?notice=vendor-access-required");
  return currentUser;
}

export async function requireAdminSession(): Promise<AuthenticatedServerUser> {
  const currentUser = await requireCustomerSession();
  if (!(await isPlatformAdmin(currentUser.uid))) redirect("/account?notice=admin-access-required");
  return currentUser;
}
