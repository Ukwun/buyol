import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { cartMutationSchema } from "@/features/schemas";
import { getEligiblePublishedProduct } from "@/features/catalog/server";
import { availableQuantity } from "@/features/inventory/server";
import type { CartItemDocument, InventoryDocument, VendorListingDocument, VendorVariantDocument } from "@/types/firestore";

export interface CartViewItem extends CartItemDocument { title: string; variantTitle?: string; unitPrice: VendorListingDocument["sellingPrice"]; available: number | null; availability: "available" | "unavailable"; }
function itemId(listingId: string, variantId?: string): string { return `${listingId}__${variantId ?? "base"}`; }
async function resolveItem(input: { listingId: string; variantId?: string; quantity: number }): Promise<{ product: VendorListingDocument; sku: string; variant?: VendorVariantDocument; price: NonNullable<VendorListingDocument["sellingPrice"]>; available: number | null }> {
  const product = await getEligiblePublishedProduct(input.listingId); if (!product) throw new Error("This product is no longer available.");
  let sku = product.sku; let variant: VendorVariantDocument | undefined; let price = product.sellingPrice;
  if (input.variantId) { const snapshot = await getFirebaseAdminFirestore().collection("products").doc(product.id).collection("variants").doc(input.variantId).get(); if (!snapshot.exists) throw new Error("The selected variant was not found."); variant = { id: snapshot.id, ...snapshot.data() } as VendorVariantDocument; if (variant.status !== "active") throw new Error("The selected variant is unavailable."); sku = variant.sku; price = variant.sellingPrice; }
  if (!sku || !price) throw new Error("This product has no sellable price or SKU.");
  let available: number | null = null;
  if (product.inventoryPolicy !== "unmanaged") { const inventory = await getFirebaseAdminFirestore().collection("inventory").doc(itemId(product.id, input.variantId)).get(); if (!inventory.exists) throw new Error("This item has no inventory record."); available = availableQuantity(inventory.data() as InventoryDocument); if (input.quantity > available) throw new Error("There is not enough available stock."); }
  return { product, sku, variant, price, available };
}

export async function getCart(customerId: string): Promise<{ items: CartViewItem[]; currencies: string[] }> {
  const db = getFirebaseAdminFirestore(); const snapshot = await db.collection("carts").doc(customerId).collection("items").orderBy("updatedAt", "desc").get();
  const items: CartViewItem[] = [];
  for (const doc of snapshot.docs) { const item = { id: doc.id, ...doc.data() } as CartItemDocument; try { const resolved = await resolveItem(item); items.push({ ...item, title: resolved.product.title, variantTitle: resolved.variant?.title, unitPrice: resolved.price, available: resolved.available, availability: "available" }); } catch { items.push({ ...item, title: "Unavailable product", unitPrice: undefined, available: 0, availability: "unavailable" }); } }
  return { items, currencies: [...new Set(items.map((item) => item.unitPrice?.currency).filter(Boolean) as string[])] };
}

export async function upsertCartItem(customerId: string, rawInput: unknown): Promise<void> {
  const input = cartMutationSchema.parse(rawInput); const resolved = await resolveItem(input); const db = getFirebaseAdminFirestore(); const cartRef = db.collection("carts").doc(customerId); const ref = cartRef.collection("items").doc(itemId(input.listingId, input.variantId)); const now = Timestamp.now();
  await db.runTransaction(async (transaction) => { const existing = await transaction.get(ref); const currentQuantity = existing.exists ? Number(existing.data()?.quantity ?? 0) : 0; const quantity = currentQuantity + input.quantity; if (resolved.available !== null && quantity > resolved.available) throw new Error("There is not enough available stock."); const item: CartItemDocument = { id: ref.id, listingId: input.listingId, variantId: input.variantId, vendorId: resolved.product.vendorId, sku: resolved.sku, quantity, addedAt: existing.exists ? (existing.data()?.addedAt as Timestamp) : now, updatedAt: now }; const data = { ...item }; Reflect.deleteProperty(data, "id"); transaction.set(ref, data); transaction.set(cartRef, { customerId, currency: resolved.price.currency, itemCount: 0, updatedAt: now }, { merge: true }); });
}

export async function setCartItemQuantity(customerId: string, itemKey: string, quantity: number): Promise<void> { const itemSnapshot = await getFirebaseAdminFirestore().collection("carts").doc(customerId).collection("items").doc(itemKey).get(); if (!itemSnapshot.exists) throw new Error("Cart item not found."); const item = itemSnapshot.data() as CartItemDocument; const resolved = await resolveItem({ listingId: item.listingId, variantId: item.variantId, quantity }); if (resolved.available !== null && quantity > resolved.available) throw new Error("There is not enough available stock."); await getFirebaseAdminFirestore().collection("carts").doc(customerId).collection("items").doc(itemKey).update({ quantity, sku: resolved.sku, updatedAt: Timestamp.now() }); }
export async function removeCartItem(customerId: string, itemKey: string): Promise<void> { await getFirebaseAdminFirestore().collection("carts").doc(customerId).collection("items").doc(itemKey).delete(); }
export async function clearCart(customerId: string): Promise<void> { const db = getFirebaseAdminFirestore(); const snapshot = await db.collection("carts").doc(customerId).collection("items").get(); const batch = db.batch(); snapshot.docs.forEach((doc) => batch.delete(doc.ref)); await batch.commit(); }
