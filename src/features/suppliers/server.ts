import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { hasVendorPermission } from "@/lib/permissions";
import { supplierProductSchema } from "@/features/schemas";
import { assertSupplierCapability, resolveSupplierAdapter } from "./adapters";
import { deterministicSupplierProductId, normalizeSupplierProduct } from "./normalization";
import type { ProductImportDocument, SupplierDocument, SupplierProductDocument } from "@/types/firestore";

export async function listConfiguredSuppliers(): Promise<SupplierDocument[]> {
  const snapshot = await getFirebaseAdminFirestore().collection("suppliers").where("integrationStatus", "==", "active").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SupplierDocument)).filter((supplier) => {
    const adapter = resolveSupplierAdapter(supplier.provider);
    return Boolean(adapter?.isConfigured());
  });
}

export async function importSupplierProduct(userId: string, vendorId: string, supplierId: string, externalProductId: string): Promise<{ product: SupplierProductDocument; importRecord: ProductImportDocument }> {
  if (!(await hasVendorPermission(userId, vendorId, "manageCatalog"))) throw new Error("Catalogue permission is required.");
  const db = getFirebaseAdminFirestore();
  const supplierSnapshot = await db.collection("suppliers").doc(supplierId).get();
  if (!supplierSnapshot.exists) throw new Error("Supplier was not found.");
  const supplier = { id: supplierSnapshot.id, ...supplierSnapshot.data() } as SupplierDocument;
  const adapter = resolveSupplierAdapter(supplier.provider);
  if (!adapter || !adapter.isConfigured() || !adapter.getProduct) throw new Error(`${supplier.provider} supplier integration is unavailable.`);
  assertSupplierCapability(adapter, "productDetails");
  const result = await adapter.getProduct({ supplierId }, externalProductId);
  const normalized = normalizeSupplierProduct(supplierId, result);
  const productRef = db.collection("supplierProducts").doc(normalized.id);
  const importRef = db.collection("productImports").doc(`${vendorId}_${normalized.id}`);
  const now = Timestamp.now();
  const importRecord: ProductImportDocument = { id: importRef.id, supplierId, supplierProductId: normalized.id, vendorId, status: "completed", requestedByUserId: userId, importedFields: ["title", "description", "images", "price", "availability", "variants"], createdAt: now, updatedAt: now, completedAt: now };
  supplierProductSchema.parse(normalized);
  await db.runTransaction(async (transaction) => {
    const existingImport = await transaction.get(importRef);
    if (existingImport.exists && existingImport.data()?.status === "completed") return;
    transaction.set(productRef, normalized, { merge: true });
    transaction.set(importRef, importRecord, { merge: true });
    result.variants.forEach((variant) => {
      const variantRef = productRef.collection("variants").doc(variant.id);
      transaction.set(variantRef, variant, { merge: true });
    });
  });
  return { product: normalized, importRecord };
}

export async function getSupplierProductForVendor(userId: string, vendorId: string, supplierProductId: string): Promise<SupplierProductDocument> {
  if (!(await hasVendorPermission(userId, vendorId, "manageCatalog"))) throw new Error("Catalogue permission is required.");
  const snapshot = await getFirebaseAdminFirestore().collection("supplierProducts").doc(supplierProductId).get();
  if (!snapshot.exists) throw new Error("Supplier product was not found.");
  return { id: snapshot.id, ...snapshot.data() } as SupplierProductDocument;
}

export async function synchronizeSupplierProduct(userId: string, vendorId: string, supplierId: string, externalProductId: string): Promise<SupplierProductDocument> {
  const result = await importSupplierProduct(userId, vendorId, supplierId, externalProductId);
  return result.product;
}

export { deterministicSupplierProductId };
