import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { getEligiblePublishedProduct } from "@/features/catalog/server";
import type { WishlistItemDocument, VendorListingDocument } from "@/types/firestore";

export async function getWishlist(customerId: string): Promise<Array<WishlistItemDocument & { product?: VendorListingDocument }>> { const snapshot = await getFirebaseAdminFirestore().collection("wishlists").doc(customerId).collection("items").orderBy("addedAt", "desc").get(); const result = []; for (const doc of snapshot.docs) { const item = { id: doc.id, ...doc.data() } as WishlistItemDocument; result.push({ ...item, product: await getEligiblePublishedProduct(item.listingId) ?? undefined }); } return result; }
export async function addWishlistItem(customerId: string, listingId: string): Promise<void> { if (!(await getEligiblePublishedProduct(listingId))) throw new Error("This product is not available."); const ref = getFirebaseAdminFirestore().collection("wishlists").doc(customerId).collection("items").doc(listingId); await ref.set({ listingId, addedAt: Timestamp.now() }, { merge: true }); }
export async function removeWishlistItem(customerId: string, listingId: string): Promise<void> { await getFirebaseAdminFirestore().collection("wishlists").doc(customerId).collection("items").doc(listingId).delete(); }
