import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import type firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { createRulesTestEnvironment } from "./rulesTestEnvironment";

let testEnv: RulesTestEnvironment;

const baseData = {
  users: {
    alice: { id: "alice", email: "alice@example.com", status: "active" },
    bob: { id: "bob", email: "bob@example.com", status: "active" },
  },
  vendorStores: {
    "vendor-a": { id: "vendor-a", ownerUserId: "vendor-owner", name: "Vendor A", status: "active" },
    "vendor-b": { id: "vendor-b", ownerUserId: "other-owner", name: "Vendor B", status: "active" },
  },
  vendorMemberships: {
    "vendor-a_alice": { id: "vendor-a_alice", vendorId: "vendor-a", userId: "alice", role: "catalog_manager", status: "active", permissions: { manageCatalog: true, manageStore: false, manageInventory: false, manageOrders: false, viewFinance: false, manageSupport: false } },
    "vendor-a_vendor-owner": { id: "vendor-a_vendor-owner", vendorId: "vendor-a", userId: "vendor-owner", role: "owner", status: "active", permissions: { manageCatalog: true, manageStore: true, manageInventory: true, manageOrders: true, viewFinance: true, manageSupport: true } },
    "vendor-a-finance_alice": { id: "vendor-a-finance_alice", vendorId: "vendor-a-finance", userId: "alice", role: "finance_manager", status: "active", permissions: { manageCatalog: false, manageStore: false, manageInventory: false, manageOrders: false, viewFinance: true, manageSupport: false } },
    "vendor-b_alice": { id: "vendor-b_alice", vendorId: "vendor-b", userId: "alice", role: "finance_manager", status: "suspended", permissions: { manageCatalog: false, manageStore: false, manageInventory: false, manageOrders: false, viewFinance: true, manageSupport: false } },
  },
  vendorApplications: {
    alice: { id: "alice", applicantUserId: "alice", status: "submitted", store: { slug: "alice-store" } },
  },
  vendorVerifications: {
    alice: { id: "alice", applicationId: "alice", applicantUserId: "alice", status: "submitted" },
  },
  products: {
    published: { id: "published", vendorId: "vendor-a", title: "Published", publicationStatus: "published" },
    draft: { id: "draft", vendorId: "vendor-a", title: "Draft", publicationStatus: "draft" },
    rejected: { id: "rejected", vendorId: "vendor-a", title: "Rejected", publicationStatus: "rejected" },
    "vendor-b-product": { id: "vendor-b-product", vendorId: "vendor-b", title: "Vendor B", publicationStatus: "draft" },
  },
  supplierProducts: {
    "supplier-product": { id: "supplier-product", supplierId: "supplier-a", externalProductId: "external-1", originalTitle: "Private source" },
  },
  inventory: {
    "inventory-a": { id: "inventory-a", vendorId: "vendor-a", listingId: "published", sku: "SKU-A", onHand: 5, reserved: 1, reservationVersion: 1, status: "active" },
  },
  orders: {
    "order-alice": { id: "order-alice", customerId: "alice", total: { amountMinor: 1000, currency: "NGN" }, paymentStatus: "paid" },
  },
  vendorOrders: {
    "vendor-order-a": { id: "vendor-order-a", parentOrderId: "order-alice", customerId: "alice", vendorId: "vendor-a", fulfillmentStatus: "pending" },
    "vendor-order-b": { id: "vendor-order-b", parentOrderId: "order-alice", customerId: "alice", vendorId: "vendor-b", fulfillmentStatus: "pending" },
  },
  fulfillmentAddresses: {
    "address-a": { id: "address-a", customerId: "alice", vendorId: "vendor-a", vendorOrderId: "vendor-order-a", parentOrderId: "order-alice", addressLine1: "Private address A" },
    "address-b": { id: "address-b", customerId: "alice", vendorId: "vendor-b", vendorOrderId: "vendor-order-b", parentOrderId: "order-alice", addressLine1: "Private address B" },
  },
  payments: { payment: { id: "payment", customerId: "alice", parentOrderId: "order-alice", amount: { amountMinor: 1000, currency: "NGN" } } },
  paymentEvents: { event: { id: "event", provider: "paystack", providerEventId: "event-1" } },
  reconciliationExceptions: { exception: { id: "exception", paymentId: "payment", parentOrderId: "order-alice", status: "open" } },
  refunds: { refund: { id: "refund", parentOrderId: "order-alice", paymentId: "payment", requestedAmount: { amountMinor: 100, currency: "NGN" } } },
  commissions: { commission: { id: "commission", vendorId: "vendor-a", vendorOrderId: "vendor-order-a", parentOrderId: "order-alice" } },
  settlements: { settlement: { id: "settlement", vendorId: "vendor-a", status: "pending" } },
  auditLogs: { audit: { id: "audit", actorType: "system", action: "test", resourceType: "test", resourceId: "test" } },
  conversations: { "alice__vendor-a__published": { id: "alice__vendor-a__published", customerId: "alice", vendorId: "vendor-a", listingId: "published", participantIds: ["alice", "vendor-a"], status: "active", unreadCounts: { alice: 0, "vendor-a": 0 } } },
  "conversations/alice__vendor-a__published/messages": { message: { id: "message", conversationId: "alice__vendor-a__published", senderId: "alice", senderRole: "customer", body: "Hello", createdAt: { seconds: 1, nanoseconds: 0 } } },
};

async function seedData(): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    for (const [collection, documents] of Object.entries(baseData)) {
      for (const [id, data] of Object.entries(documents)) {
        await firestore.doc(`${collection}/${id}`).set(data);
      }
    }
  });
}

function dbFor(userId?: string, claims?: Record<string, unknown>): firebase.firestore.Firestore {
  return (userId ? testEnv.authenticatedContext(userId, claims) : testEnv.unauthenticatedContext()).firestore();
}

beforeAll(async () => { testEnv = await createRulesTestEnvironment(); });
beforeEach(async () => { await testEnv.clearFirestore(); await seedData(); });
afterAll(async () => { await testEnv.cleanup(); });

describe("Firestore rules", () => {
  it("allows public reads of published listings only", async () => {
    const db = dbFor();
    await assertSucceeds(db.doc("products/published").get());
    await assertFails(db.doc("products/draft").get());
    await assertFails(db.doc("products/rejected").get());
    await assertFails(db.doc("supplierProducts/supplier-product").get());
  });

  it("limits customers to their own resources and protected fields", async () => {
    const alice = dbFor("alice");
    await assertSucceeds(alice.doc("users/alice").get());
    await assertFails(alice.doc("users/bob").get());
    await assertFails(alice.doc("users/alice").update({ status: "suspended" }));
    await assertFails(alice.doc("payments/payment").set({ hacked: true }));
    await assertFails(alice.doc("auditLogs/new").set({ action: "forged" }));
    await assertSucceeds(alice.doc("vendorApplications/alice").get());
    await assertFails(alice.doc("vendorApplications/alice").update({ status: "approved" }));
    await assertFails(alice.doc("vendorApplications/new").set({ applicantUserId: "alice" }));
    await assertSucceeds(alice.doc("vendorVerifications/alice").get());
  });

  it("allows catalog managers to update catalog data but not finance or inventory", async () => {
    const alice = dbFor("alice");
    await assertSucceeds(alice.doc("products/published").update({ title: "Updated catalog title" }));
    await assertFails(alice.doc("inventory/inventory-a").update({ onHand: 999 }));
    await assertFails(alice.doc("commissions/commission").set({ amount: 1 }));
    await assertFails(alice.doc("vendorOrders/vendor-order-a").update({ fulfillmentStatus: "delivered" }));
  });

  it("denies suspended memberships and cross-vendor access", async () => {
    const alice = dbFor("alice");
    await assertFails(alice.doc("products/vendor-b-product").get());
    await assertFails(alice.doc("vendorStores/vendor-b").get());
    await assertFails(alice.doc("fulfillmentAddresses/address-b").get());
  });

  it("allows only the customer and authorized vendor to read a fulfillment address", async () => {
    const alice = dbFor("alice");
    const vendorOwner = dbFor("vendor-owner");
    await assertSucceeds(alice.doc("fulfillmentAddresses/address-a").get());
    await assertFails(vendorOwner.doc("fulfillmentAddresses/address-a").get());
    await assertFails(alice.doc("fulfillmentAddresses/address-b").get());
  });

  it("restricts buyer and vendor messaging to the order participants", async () => {
    const alice = dbFor("alice");
    const vendorOwner = dbFor("vendor-owner");
    const bob = dbFor("bob");
    await assertSucceeds(alice.doc("conversations/alice__vendor-a__published").get());
    await assertSucceeds(vendorOwner.doc("conversations/alice__vendor-a__published").get());
    await assertSucceeds(vendorOwner.doc("conversations/alice__vendor-a__published/messages/message").get());
    await assertFails(bob.doc("conversations/alice__vendor-a__published").get());
    await assertFails(bob.doc("conversations/alice__vendor-a__published/messages/message").get());
    await assertFails(alice.doc("conversations/alice__vendor-a__published/messages/forged").set({ body: "forged" }));
  });

  it("does not let clients mutate operational or financial records", async () => {
    const alice = dbFor("alice");
    const admin = dbFor("admin", { admin: true });
    for (const path of ["inventory/inventory-a", "paymentEvents/event", "reconciliationExceptions/exception", "refunds/refund", "commissions/commission", "settlements/settlement", "auditLogs/audit"]) {
      await assertFails(alice.doc(path).set({ changed: true }));
    }
    await assertSucceeds(admin.doc("auditLogs/audit").get());
    await assertFails(alice.doc("orders/order-alice").set({ paymentStatus: "paid" }));
    await assertFails(alice.doc("inventory/inventory-a/reservations/reservation").set({ status: "active" }));
  });
});
