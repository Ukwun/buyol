import "server-only";
import { randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { checkoutAddressSchema } from "@/features/schemas";
export async function listAddresses(userId: string) { const snapshot = await getFirebaseAdminFirestore().collection("users").doc(userId).collection("addresses").orderBy("updatedAt", "desc").get(); return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })); }
export async function saveAddress(userId: string, raw: unknown, addressId?: string) { const address = checkoutAddressSchema.parse(raw); const ref = getFirebaseAdminFirestore().collection("users").doc(userId).collection("addresses").doc(addressId ?? randomUUID()); await ref.set({ ...address, updatedAt: Timestamp.now() }, { merge: true }); return { id: ref.id, ...address }; }
export async function deleteAddress(userId: string, addressId: string) { await getFirebaseAdminFirestore().collection("users").doc(userId).collection("addresses").doc(addressId).delete(); }
