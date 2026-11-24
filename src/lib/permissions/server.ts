import "server-only";

import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { PlatformClaims } from "./claims";
import type { VendorPermission } from "./vendor";

export async function getPlatformClaims(userId: string): Promise<PlatformClaims> {
  const user = await getFirebaseAdminAuth().getUser(userId);
  return (user.customClaims ?? {}) as PlatformClaims;
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const claims = await getPlatformClaims(userId);
  return claims.admin === true;
}

export async function hasVendorPermission(
  userId: string,
  vendorId: string,
  permission: VendorPermission,
): Promise<boolean> {
  const membership = await getFirebaseAdminFirestore()
    .collection("vendorMemberships")
    .doc(`${vendorId}_${userId}`)
    .get();

  if (!membership.exists) return false;
  const data = membership.data() as { status?: string; permissions?: Record<string, boolean> };
  return data.status === "active" && data.permissions?.[permission] === true;
}

export async function hasAnyActiveVendorMembership(userId: string): Promise<boolean> {
  const snapshot = await getFirebaseAdminFirestore()
    .collection("vendorMemberships")
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .limit(1)
    .get();

  return !snapshot.empty;
}

export async function assertVendorPermission(
  userId: string,
  vendorId: string,
  permission: VendorPermission,
): Promise<void> {
  if (!(await hasVendorPermission(userId, vendorId, permission))) {
    throw new Error("The user does not have the required vendor permission.");
  }
}
