import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { hasVendorPermission } from "@/lib/permissions";
import { makeMoney } from "@/lib/money";
import { vendorProductInputSchema } from "@/features/schemas";
import type { ProductVariantSummary, VendorListingDocument } from "@/types/firestore";

function slugKey(value: string): string { return value.trim().toLowerCase(); }
function skuKey(value: string): string { return value.trim().toLowerCase(); }

export async function getUserVendorIds(userId: string): Promise<string[]> {
  const snapshot = await getFirebaseAdminFirestore().collection("vendorMemberships").where("userId", "==", userId).where("status", "==", "active").get();
  return snapshot.docs.filter((doc) => (doc.data().permissions as Record<string, boolean> | undefined)?.manageCatalog || doc.data().role === "owner").map((doc) => String(doc.data().vendorId));
}

async function assertVendorCatalogPermission(userId: string, vendorId?: string): Promise<string> {
  if (vendorId) {
    if (!(await hasVendorPermission(userId, vendorId, "manageCatalog"))) throw new Error("Catalogue permission is required.");
    return vendorId;
  }
  const ids = await getUserVendorIds(userId);
  if (ids.length !== 1) throw new Error("A single catalogue store must be selected.");
  return ids[0];
}

async function validateCategories(categoryIds: string[]): Promise<void> {
  const db = getFirebaseAdminFirestore();
  const snapshots = await db.getAll(...categoryIds.map((id) => db.collection("categories").doc(id)));
  if (snapshots.length !== categoryIds.length || snapshots.some((snapshot) => !snapshot.exists || snapshot.data()?.status !== "active")) throw new Error("One or more selected categories are unavailable.");
}

function summaries(variants: Array<{ id: string; title: string; sku: string; sellingPrice: { amountMinor: number; currency: string } }>): ProductVariantSummary[] {
  return variants.map((variant) => ({ id: variant.id, title: variant.title, sku: variant.sku, price: makeMoney(variant.sellingPrice.amountMinor, variant.sellingPrice.currency) }));
}

export async function createVendorProduct(userId: string, rawInput: unknown, vendorId?: string): Promise<VendorListingDocument> {
  const input = vendorProductInputSchema.parse(rawInput);
  const resolvedVendorId = await assertVendorCatalogPermission(userId, vendorId);
  await validateCategories(input.categoryIds);
  const db = getFirebaseAdminFirestore();
  const productRef = db.collection("products").doc();
  const now = Timestamp.now();
  const productSlugRef = db.collection("vendorProductSlugs").doc(`${resolvedVendorId}_${slugKey(input.slug)}`);
  const allSkus = input.variants.length ? input.variants.map((variant) => variant.sku) : [input.sku as string];
  const skuRefs = allSkus.map((sku) => db.collection("vendorSkus").doc(`${resolvedVendorId}_${skuKey(sku)}`));

  return db.runTransaction(async (transaction) => {
    const existingSlug = await transaction.get(productSlugRef);
    if (existingSlug.exists) throw new Error("That product slug is already in use by this store.");
    const existingSkus = await transaction.getAll(...skuRefs);
    if (existingSkus.some((snapshot) => snapshot.exists)) throw new Error("A product or variant already uses one of those SKUs.");
    const variantSummaries = input.variants.map((variant, index) => ({ id: `variant-${index + 1}`, title: variant.title, sku: variant.sku, price: makeMoney(variant.sellingPrice.amountMinor, variant.sellingPrice.currency) }));
    const product: VendorListingDocument = {
      id: productRef.id, vendorId: resolvedVendorId, categoryIds: input.categoryIds, title: input.title, description: input.description,
      shortDescription: input.shortDescription, brand: input.brand, slug: input.slug, sku: input.sku, sellingPrice: input.sellingPrice ? makeMoney(input.sellingPrice.amountMinor, input.sellingPrice.currency) : undefined, compareAtPrice: input.compareAtPrice ? makeMoney(input.compareAtPrice.amountMinor, input.compareAtPrice.currency) : undefined, tags: input.tags, attributes: input.attributes,
      images: input.images, variantSummaries, inventoryPolicy: input.inventoryPolicy, publicationStatus: "draft", createdAt: now, updatedAt: now,
    };
    const productData = { ...product };
    Reflect.deleteProperty(productData, "id");
    transaction.create(productRef, productData);
    transaction.create(productSlugRef, { productId: productRef.id, vendorId: resolvedVendorId, createdAt: now });
    skuRefs.forEach((skuRef, index) => transaction.create(skuRef, { productId: productRef.id, vendorId: resolvedVendorId, sku: allSkus[index], createdAt: now }));
    input.variants.forEach((variant, index) => {
      const variantRef = productRef.collection("variants").doc(`variant-${index + 1}`);
      const variantData = { ...variant };
      Reflect.deleteProperty(variantData, "id");
      transaction.create(variantRef, { ...variantData, createdAt: now, updatedAt: now });
    });
    return product;
  });
}

export async function listVendorProducts(userId: string, search?: string): Promise<VendorListingDocument[]> {
  const vendorIds = await getUserVendorIds(userId);
  const snapshots = await Promise.all(vendorIds.map((vendorId) => getFirebaseAdminFirestore().collection("products").where("vendorId", "==", vendorId).orderBy("updatedAt", "desc").limit(100).get()));
  const normalizedSearch = search?.trim().toLowerCase();
  return snapshots.flatMap((snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as VendorListingDocument))).filter((product) => !normalizedSearch || `${product.title} ${product.sku ?? ""} ${product.slug}`.toLowerCase().includes(normalizedSearch));
}

export async function getVendorProduct(userId: string, productId: string): Promise<VendorListingDocument> {
  const snapshot = await getFirebaseAdminFirestore().collection("products").doc(productId).get();
  if (!snapshot.exists) throw new Error("Product not found.");
  const product = { id: snapshot.id, ...snapshot.data() } as VendorListingDocument;
  if (!(await hasVendorPermission(userId, product.vendorId, "manageCatalog"))) throw new Error("Catalogue permission is required.");
  return product;
}

export async function updateVendorProduct(userId: string, productId: string, rawInput: unknown): Promise<void> {
  const input = vendorProductInputSchema.parse(rawInput);
  const current = await getVendorProduct(userId, productId);
  await validateCategories(input.categoryIds);
  const db = getFirebaseAdminFirestore();
  const productRef = db.collection("products").doc(productId);
  const now = Timestamp.now();
  await db.runTransaction(async (transaction) => {
    const productSnapshot = await transaction.get(productRef);
    if (!productSnapshot.exists || productSnapshot.data()?.vendorId !== current.vendorId) throw new Error("Product ownership could not be confirmed.");
    const variantsSnapshot = await transaction.get(productRef.collection("variants"));
    const currentSlugRef = db.collection("vendorProductSlugs").doc(`${current.vendorId}_${slugKey(current.slug)}`);
    const nextSlugRef = db.collection("vendorProductSlugs").doc(`${current.vendorId}_${slugKey(input.slug)}`);
    const nextSlugSnapshot = await transaction.get(nextSlugRef);
    if (nextSlugSnapshot.exists && nextSlugSnapshot.data()?.productId !== productId) throw new Error("That product slug is already in use by this store.");
    const oldSkuRefs = variantsSnapshot.docs.map((doc) => db.collection("vendorSkus").doc(`${current.vendorId}_${skuKey(String(doc.data().sku))}`));
    const newSkus = input.variants.length ? input.variants.map((variant) => variant.sku) : [input.sku as string];
    const newSkuRefs = newSkus.map((sku) => db.collection("vendorSkus").doc(`${current.vendorId}_${skuKey(sku)}`));
    const skuSnapshots = await transaction.getAll(...newSkuRefs);
    if (skuSnapshots.some((snapshot) => snapshot.exists && snapshot.data()?.productId !== productId)) throw new Error("A product or variant already uses one of those SKUs.");
    oldSkuRefs.forEach((ref) => transaction.delete(ref));
    newSkuRefs.forEach((ref, index) => transaction.set(ref, { productId, vendorId: current.vendorId, sku: newSkus[index], createdAt: now }));
    variantsSnapshot.docs.forEach((doc) => transaction.delete(doc.ref));
    input.variants.forEach((variant, index) => {
      const variantData = { ...variant };
      Reflect.deleteProperty(variantData, "id");
      transaction.create(productRef.collection("variants").doc(`variant-${index + 1}`), { ...variantData, createdAt: now, updatedAt: now });
    });
    if (current.slug !== input.slug) { transaction.delete(currentSlugRef); transaction.set(nextSlugRef, { productId, vendorId: current.vendorId, createdAt: now }); }
    transaction.update(productRef, { ...input, variantSummaries: summaries(input.variants.map((variant, index) => ({ id: `variant-${index + 1}`, ...variant }))), publicationStatus: "draft", rejectionReason: null, updatedAt: now });
  });
}

export async function submitVendorProduct(userId: string, productId: string): Promise<void> {
  const product = await getVendorProduct(userId, productId);
  if (!["draft", "rejected", "unpublished"].includes(product.publicationStatus)) throw new Error("This product cannot be submitted in its current state.");
  await getFirebaseAdminFirestore().collection("products").doc(productId).update({ publicationStatus: "pending", rejectionReason: null, updatedAt: Timestamp.now() });
}

export async function archiveVendorProduct(userId: string, productId: string): Promise<void> {
  await getVendorProduct(userId, productId);
  const now = Timestamp.now();
  await getFirebaseAdminFirestore().collection("products").doc(productId).update({ publicationStatus: "unpublished", archivedAt: now, updatedAt: now });
}

export async function moderateVendorProduct(adminUserId: string, productId: string, decision: "published" | "rejected" | "unpublished", rejectionReason?: string): Promise<void> {
  const db = getFirebaseAdminFirestore();
  const ref = db.collection("products").doc(productId);
  const now = Timestamp.now();
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.data()?.publicationStatus !== "pending") throw new Error("Only pending products can be moderated.");
    transaction.update(ref, { publicationStatus: decision, rejectionReason: decision === "rejected" ? rejectionReason ?? "Changes are required before publication." : null, publishedAt: decision === "published" ? now : null, updatedAt: now });
    transaction.create(db.collection("auditLogs").doc(), { actorUserId: adminUserId, actorType: "admin", action: `product.${decision}`, resourceType: "product", resourceId: productId, metadata: {}, createdAt: now });
  });
}

export async function listPublishedProducts(search?: string, categoryId?: string): Promise<VendorListingDocument[]> {
  const snapshot = await getFirebaseAdminFirestore().collection("products").where("publicationStatus", "==", "published").orderBy("publishedAt", "desc").limit(60).get();
  const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as VendorListingDocument));
  const storeSnapshots = await Promise.all([...new Set(products.map((product) => product.vendorId))].map((vendorId) => getFirebaseAdminFirestore().collection("vendorStores").doc(vendorId).get()));
  const activeVendors = new Set(storeSnapshots.filter((snapshot) => snapshot.exists && snapshot.data()?.status === "active").map((snapshot) => snapshot.id));
  const normalizedSearch = search?.trim().toLowerCase();
  return products.filter((product) => activeVendors.has(product.vendorId)).filter((product) => !categoryId || product.categoryIds.includes(categoryId)).filter((product) => !normalizedSearch || `${product.title} ${product.shortDescription ?? ""} ${product.brand ?? ""} ${(product.tags ?? []).join(" ")}`.toLowerCase().includes(normalizedSearch));
}

export async function getPublishedProductBySlug(slug: string): Promise<VendorListingDocument | null> {
  const snapshot = await getFirebaseAdminFirestore().collection("products").where("slug", "==", slug).where("publicationStatus", "==", "published").limit(1).get();
  if (snapshot.empty) return null;
  const product = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as VendorListingDocument;
  const store = await getFirebaseAdminFirestore().collection("vendorStores").doc(product.vendorId).get();
  return store.exists && store.data()?.status === "active" ? product : null;
}

export async function getEligiblePublishedProduct(productId: string): Promise<VendorListingDocument | null> {
  const snapshot = await getFirebaseAdminFirestore().collection("products").doc(productId).get();
  if (!snapshot.exists || snapshot.data()?.publicationStatus !== "published") return null;
  const product = { id: snapshot.id, ...snapshot.data() } as VendorListingDocument;
  const store = await getFirebaseAdminFirestore().collection("vendorStores").doc(product.vendorId).get();
  return store.exists && store.data()?.status === "active" ? product : null;
}
