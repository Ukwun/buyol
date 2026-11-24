import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { createRulesTestEnvironment } from "./rulesTestEnvironment";

let testEnv: RulesTestEnvironment;

async function seedStorageDocuments(): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await firestore.doc("vendorStores/vendor-a").set({ vendorId: "vendor-a", status: "active" });
    await firestore.doc("vendorMemberships/vendor-a_alice").set({
      vendorId: "vendor-a", userId: "alice", role: "owner", status: "active",
      permissions: { manageStore: true, manageCatalog: true },
    });
    await firestore.doc("products/listing-a").set({ vendorId: "vendor-a", publicationStatus: "published" });
    await firestore.doc("products/listing-private").set({ vendorId: "vendor-a", publicationStatus: "draft" });
    await firestore.doc("vendorApplications/alice").set({ applicantUserId: "alice", status: "draft" });
    const storage = context.storage("gs://demo-buyol.appspot.com");
    await upload(storage.ref("products/vendor-a/listing-a/image.png"), Buffer.from("published image"), "image/png");
    await upload(storage.ref("products/vendor-a/listing-private/image.png"), Buffer.from("private image"), "image/png");
    await upload(storage.ref("vendors/vendor-a/branding/logo.png"), Buffer.from("branding image"), "image/png");
  });
}

function storageFor(userId?: string, claims?: Record<string, unknown>) {
  return (userId ? testEnv.authenticatedContext(userId, claims) : testEnv.unauthenticatedContext()).storage("gs://demo-buyol.appspot.com");
}

function upload(ref: ReturnType<ReturnType<typeof storageFor>["ref"]>, data: Buffer, contentType: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const task = ref.put(data, { contentType });
    task.on("state_changed", () => undefined, (error) => reject(error), () => resolve(undefined));
  });
}

beforeAll(async () => { testEnv = await createRulesTestEnvironment(); });
beforeEach(async () => { await testEnv.clearStorage(); await testEnv.clearFirestore(); await seedStorageDocuments(); });
afterAll(async () => { await testEnv.cleanup(); });

describe("Storage rules", () => {
  it("allows an owner to upload a valid profile image and denies another user", async () => {
    const alice = storageFor("alice");
    const bob = storageFor("bob");
    await assertSucceeds(upload(alice.ref("users/alice/profile/avatar.png"), Buffer.from("image"), "image/png"));
    await assertFails(bob.ref("users/alice/profile/avatar.png").getDownloadURL());
  });

  it("enforces image content type and size restrictions", async () => {
    const alice = storageFor("alice");
    await assertFails(upload(alice.ref("users/alice/profile/file.txt"), Buffer.from("text"), "text/plain"));
    await assertFails(upload(alice.ref("users/alice/profile/large.png"), Buffer.alloc(5 * 1024 * 1024), "image/png"));
  });

  it("protects vendor branding and product uploads by active membership", async () => {
    const alice = storageFor("alice");
    const bob = storageFor("bob");
    await assertSucceeds(upload(alice.ref("vendors/vendor-a/branding/logo.png"), Buffer.from("image"), "image/png"));
    await assertFails(upload(bob.ref("vendors/vendor-a/branding/logo-2.png"), Buffer.from("image"), "image/png"));
    await assertSucceeds(upload(alice.ref("products/vendor-a/listing-private/image.png"), Buffer.from("image"), "image/png"));
    await assertFails(upload(bob.ref("products/vendor-a/listing-private/image-2.png"), Buffer.from("image"), "image/png"));
  });

  it("allows public reads only for explicitly published product paths", async () => {
    const unauthenticated = storageFor();
    await assertSucceeds(unauthenticated.ref("products/vendor-a/listing-a/image.png").getDownloadURL());
    await assertFails(unauthenticated.ref("products/vendor-a/listing-private/image.png").getDownloadURL());
    await assertFails(unauthenticated.ref("support/ticket-a/file.png").getDownloadURL());
  });

  it("protects application branding and verification documents", async () => {
    const alice = storageFor("alice");
    const bob = storageFor("bob");
    await assertSucceeds(upload(alice.ref("vendorApplications/alice/branding/logo.png"), Buffer.from("image"), "image/png"));
    await assertFails(upload(bob.ref("vendorApplications/alice/branding/logo-2.png"), Buffer.from("image"), "image/png"));
    await assertSucceeds(upload(alice.ref("vendorApplications/alice/verification/document.pdf"), Buffer.from("pdf"), "application/pdf"));
    await assertFails(bob.ref("vendorApplications/alice/verification/document.pdf").getDownloadURL());
  });
});
