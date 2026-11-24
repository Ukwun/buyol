import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { hasVendorPermission } from "@/lib/permissions";
import { inventoryAdjustmentInputSchema } from "@/features/schemas";
import type { VendorListingDocument } from "@/types/firestore";
import type { InventoryDocument, InventoryAdjustmentDocument } from "@/types/firestore";

function inventoryId(listingId: string, variantId?: string): string { return `${listingId}__${variantId ?? "base"}`; }
async function inventoryVendorIds(userId: string): Promise<string[]> {
  const snapshot = await getFirebaseAdminFirestore().collection("vendorMemberships").where("userId", "==", userId).where("status", "==", "active").get();
  return snapshot.docs.filter((doc) => doc.data().role === "owner" || (doc.data().permissions as Record<string, boolean> | undefined)?.manageInventory).map((doc) => String(doc.data().vendorId));
}

export function availableQuantity(inventory: Pick<InventoryDocument, "onHand" | "reserved">): number { return Math.max(0, inventory.onHand - inventory.reserved); }

export async function adjustInventory(userId: string, rawInput: unknown): Promise<InventoryDocument> {
  const input = inventoryAdjustmentInputSchema.parse(rawInput);
  const productSnapshot = await getFirebaseAdminFirestore().collection("products").doc(input.listingId).get();
  const product = productSnapshot.exists ? ({ id: productSnapshot.id, ...productSnapshot.data() } as VendorListingDocument) : null;
  if (!product) throw new Error("Product not found.");
  const store = await getFirebaseAdminFirestore().collection("vendorStores").doc(product.vendorId).get();
  if (!store.exists || ["suspended", "closed"].includes(String(store.data()?.status))) throw new Error("The vendor store is not eligible for inventory operations.");
  if (!(await hasVendorPermission(userId, product.vendorId, "manageInventory"))) throw new Error("Inventory permission is required.");
  let sku = product.sku;
  if (input.variantId) {
    const variant = await getFirebaseAdminFirestore().collection("products").doc(product.id).collection("variants").doc(input.variantId).get();
    if (!variant.exists || variant.data()?.status !== "active") throw new Error("The selected variant is unavailable.");
    sku = String(variant.data()?.sku);
  }
  if (!sku || sku !== input.sku) throw new Error("The SKU does not belong to the selected sellable item.");
  const id = input.inventoryId ?? inventoryId(product.id, input.variantId);
  const db = getFirebaseAdminFirestore(); const ref = db.collection("inventory").doc(id); const ledgerRef = db.collection("inventoryAdjustments").doc(`${product.vendorId}_${input.idempotencyKey}`); const now = Timestamp.now();
  return db.runTransaction(async (transaction) => {
    const [ledger, current] = await transaction.getAll(ledgerRef, ref);
    if (ledger.exists) return { id, ...current.data() } as InventoryDocument;
    const existing = current.exists ? ({ id: current.id, ...current.data() } as InventoryDocument) : undefined;
    const previousOnHand = existing?.onHand ?? 0; const reserved = existing?.reserved ?? 0; const nextOnHand = previousOnHand + input.delta;
    if (!Number.isSafeInteger(nextOnHand) || nextOnHand < reserved) throw new Error("Stock cannot be reduced below reserved quantity.");
    const threshold = input.lowStockThreshold ?? existing?.lowStockThreshold;
    const next: InventoryDocument = { id, listingId: product.id, variantId: input.variantId, vendorId: product.vendorId, sku, onHand: nextOnHand, reserved, reservationVersion: existing?.reservationVersion ?? 0, status: nextOnHand - reserved > 0 ? "active" : "out-of-stock", lowStockThreshold: threshold, updatedAt: now };
    const ledgerEntry: InventoryAdjustmentDocument = { id: ledgerRef.id, inventoryId: id, vendorId: product.vendorId, actorUserId: userId, idempotencyKey: input.idempotencyKey, delta: input.delta, previousOnHand, nextOnHand, reason: input.reason, createdAt: now };
    const inventoryData = { ...next }; Reflect.deleteProperty(inventoryData, "id"); const ledgerData = { ...ledgerEntry }; Reflect.deleteProperty(ledgerData, "id");
    transaction.set(ref, inventoryData); transaction.create(ledgerRef, ledgerData);
    const oldAvailable = previousOnHand - reserved; const nextAvailable = nextOnHand - reserved;
    if (threshold !== undefined && ((oldAvailable > threshold && nextAvailable <= threshold) || (oldAvailable > 0 && nextAvailable === 0))) {
      const notificationRef = db.collection("users").doc(userId).collection("notifications").doc(`inventory_${id}_${ledgerRef.id}`);
      transaction.create(notificationRef, { type: nextAvailable === 0 ? "inventory-out-of-stock" : "inventory-low-stock", title: nextAvailable === 0 ? "Product out of stock" : "Low stock alert", body: `${sku} has ${nextAvailable} available units remaining.`, createdAt: now });
    }
    return next;
  });
}

export async function listInventory(userId: string): Promise<InventoryDocument[]> {
  const ids = await inventoryVendorIds(userId); if (!ids.length) return [];
  const snapshots = await Promise.all(ids.map((vendorId) => getFirebaseAdminFirestore().collection("inventory").where("vendorId", "==", vendorId).orderBy("updatedAt", "desc").limit(200).get()));
  return snapshots.flatMap((snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as InventoryDocument)));
}

export async function listInventoryAdjustments(userId: string, inventoryIdValue: string): Promise<InventoryAdjustmentDocument[]> {
  const snapshot = await getFirebaseAdminFirestore().collection("inventoryAdjustments").where("inventoryId", "==", inventoryIdValue).orderBy("createdAt", "desc").limit(50).get();
  const entries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as InventoryAdjustmentDocument)); const allowed = new Set(await inventoryVendorIds(userId)); return entries.filter((entry) => allowed.has(entry.vendorId));
}
