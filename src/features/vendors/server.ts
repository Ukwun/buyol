import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { vendorApplicationInputSchema, vendorReviewSchema, vendorVerificationSchema } from "@/features/schemas";
import type { VendorApplicationDocument, VendorMembershipDocument, VendorStoreDocument, VendorVerificationDocument } from "@/types/firestore";

const APPLICATION_COLLECTION = "vendorApplications";

function vendorIdForUser(userId: string): string {
  return `vendor_${userId}`;
}

function membershipId(vendorId: string, userId: string): string {
  return `${vendorId}_${userId}`;
}

export async function getVendorApplication(userId: string): Promise<VendorApplicationDocument | null> {
  const snapshot = await getFirebaseAdminFirestore().collection(APPLICATION_COLLECTION).doc(userId).get();
  return snapshot.exists ? ({ id: snapshot.id, ...snapshot.data() } as VendorApplicationDocument) : null;
}

export async function saveVendorApplicationDraft(userId: string, rawInput: unknown): Promise<VendorApplicationDocument> {
  const input = vendorApplicationInputSchema.parse(rawInput);
  const db = getFirebaseAdminFirestore();
  const ref = db.collection(APPLICATION_COLLECTION).doc(userId);
  const now = Timestamp.now();

  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists) {
      const current = existing.data() as VendorApplicationDocument;
      if (["submitted", "under_review", "approved", "suspended"].includes(current.status)) {
        throw new Error("This vendor application cannot be edited in its current state.");
      }
      const updated = { ...current, ...input, applicantUserId: userId, status: "draft" as const, updatedAt: now };
      transaction.set(ref, updated, { merge: true });
      return updated as VendorApplicationDocument;
    }
    const created = { id: userId, applicantUserId: userId, ...input, status: "draft" as const, createdAt: now, updatedAt: now };
    transaction.create(ref, created);
    return created as VendorApplicationDocument;
  });
}

export async function submitVendorApplication(userId: string): Promise<VendorApplicationDocument> {
  const db = getFirebaseAdminFirestore();
  const applicationRef = db.collection(APPLICATION_COLLECTION).doc(userId);
  const now = Timestamp.now();

  return db.runTransaction(async (transaction) => {
    const applicationSnapshot = await transaction.get(applicationRef);
    if (!applicationSnapshot.exists) throw new Error("Complete and save the application before submitting it.");
    const current = { id: userId, ...applicationSnapshot.data() } as VendorApplicationDocument;
    if (!["draft", "rejected"].includes(current.status)) throw new Error("This application cannot be submitted in its current state.");
    vendorApplicationInputSchema.parse(current);

    const vendorId = current.vendorId ?? vendorIdForUser(userId);
    const slugRef = db.collection("vendorStoreSlugs").doc(current.store.slug);
    const storeRef = db.collection("vendorStores").doc(vendorId);
    const membershipRef = db.collection("vendorMemberships").doc(membershipId(vendorId, userId));
    const [slugSnapshot, storeSnapshot, membershipSnapshot] = await Promise.all([
      transaction.get(slugRef), transaction.get(storeRef), transaction.get(membershipRef),
    ]);
    if (slugSnapshot.exists && slugSnapshot.data()?.vendorId !== vendorId) throw new Error("That store slug is already in use.");

    const updatedApplication = { ...current, vendorId, status: "submitted" as const, rejectionReason: undefined, submittedAt: now, updatedAt: now };
    const store: VendorStoreDocument = {
      id: vendorId, ownerUserId: userId, name: current.store.name, slug: current.store.slug,
      description: current.store.description, countryCode: current.store.countryCode,
      logoStoragePath: current.store.logoStoragePath, bannerStoragePath: current.store.bannerStoragePath,
      settlementCurrency: current.store.settlementCurrency, status: "pending", createdAt: storeSnapshot.exists ? (storeSnapshot.data() as VendorStoreDocument).createdAt : now, updatedAt: now,
    };
    const membership: VendorMembershipDocument = {
      id: membershipRef.id, vendorId, userId, role: "owner",
      permissions: { manageStore: true, manageCatalog: true, manageInventory: true, manageOrders: true, viewFinance: true, manageSupport: true },
      status: "pending", createdAt: membershipSnapshot.exists ? (membershipSnapshot.data() as VendorMembershipDocument).createdAt : now, updatedAt: now,
    };
    transaction.set(applicationRef, updatedApplication);
    transaction.set(slugRef, { vendorId, slug: current.store.slug, createdAt: now }, { merge: true });
    transaction.set(storeRef, store, { merge: true });
    transaction.set(membershipRef, membership, { merge: true });
    return updatedApplication;
  });
}

export async function reviewVendorApplication(adminUserId: string, applicationId: string, rawInput: unknown): Promise<void> {
  const input = vendorReviewSchema.parse(rawInput);
  const db = getFirebaseAdminFirestore();
  const applicationRef = db.collection(APPLICATION_COLLECTION).doc(applicationId);
  const now = Timestamp.now();

  await db.runTransaction(async (transaction) => {
    const applicationSnapshot = await transaction.get(applicationRef);
    if (!applicationSnapshot.exists) throw new Error("Vendor application was not found.");
    const application = { id: applicationId, ...applicationSnapshot.data() } as VendorApplicationDocument;
    if (!application.vendorId) throw new Error("The application has not been submitted.");
    if (!["submitted", "under_review", "rejected"].includes(application.status)) throw new Error("This application is not reviewable.");
    const storeRef = db.collection("vendorStores").doc(application.vendorId);
    const membershipRef = db.collection("vendorMemberships").doc(membershipId(application.vendorId, application.applicantUserId));
    const reviewedStatus = input.decision === "approved" ? "approved" : input.decision;
    transaction.update(applicationRef, { status: reviewedStatus, rejectionReason: input.rejectionReason ?? null, updatedAt: now });
    transaction.update(storeRef, { status: input.decision === "approved" ? "active" : input.decision === "suspended" ? "suspended" : "pending", updatedAt: now });
    transaction.update(membershipRef, { status: input.decision === "approved" ? "active" : input.decision === "suspended" ? "suspended" : "pending", updatedAt: now });
    transaction.create(db.collection("auditLogs").doc(), {
      actorUserId: adminUserId, actorType: "admin", action: `vendor_application.${input.decision}`,
      resourceType: "vendorApplication", resourceId: applicationId, metadata: { decision: input.decision }, createdAt: now,
    });
  });
}

export async function submitVendorVerification(userId: string, rawInput: unknown): Promise<VendorVerificationDocument> {
  const input = vendorVerificationSchema.parse(rawInput);
  const db = getFirebaseAdminFirestore();
  const application = await getVendorApplication(userId);
  if (!application || application.id !== input.applicationId || !["submitted", "under_review", "rejected"].includes(application.status)) {
    throw new Error("The vendor application is not available for verification.");
  }
  const ref = db.collection("vendorVerifications").doc(input.applicationId);
  const now = Timestamp.now();
  const document: VendorVerificationDocument = {
    id: ref.id, applicationId: application.id, applicantUserId: userId, status: "submitted",
    businessType: application.business.businessType, countryCode: application.business.registrationCountryCode,
    requiredDocumentTypes: [], submittedDocumentPaths: input.documentPaths, createdAt: now, updatedAt: now,
  };
  await ref.set(document, { merge: true });
  return document;
}
