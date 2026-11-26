import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { messageInputSchema } from "@/features/schemas";
import { hasVendorPermission } from "@/lib/permissions";
import type { ConversationDocument, MessageDocument, VendorListingDocument } from "@/types/firestore";

function conversationId(customerId: string, vendorId: string, listingId: string): string {
  return `${customerId}__${vendorId}__${listingId}`.replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function assertConversationAccess(userId: string, conversation: ConversationDocument): Promise<"customer" | "vendor"> {
  if (conversation.customerId === userId) return "customer";
  if (await hasVendorPermission(userId, conversation.vendorId, "manageSupport")) return "vendor";
  throw new Error("Conversation access denied.");
}

export async function startConversation(customerId: string, listingId: string): Promise<ConversationDocument> {
  const db = getFirebaseAdminFirestore();
  const listingSnapshot = await db.collection("products").doc(listingId).get();
  if (!listingSnapshot.exists) throw new Error("This product is no longer available.");
  const listing = { id: listingSnapshot.id, ...listingSnapshot.data() } as VendorListingDocument;
  if (listing.publicationStatus !== "published") throw new Error("Messaging is unavailable for this listing.");
  const storeSnapshot = await db.collection("vendorStores").doc(listing.vendorId).get();
  if (!storeSnapshot.exists || storeSnapshot.data()?.status !== "active") throw new Error("This store is not currently available.");

  const id = conversationId(customerId, listing.vendorId, listingId);
  const ref = db.collection("conversations").doc(id);
  const existing = await ref.get();
  if (existing.exists) return { id: existing.id, ...existing.data() } as ConversationDocument;

  const now = Timestamp.now();
  const conversation: ConversationDocument = {
    id, customerId, vendorId: listing.vendorId, listingId, participantIds: [customerId, listing.vendorId], status: "active",
    unreadCounts: { [customerId]: 0, [listing.vendorId]: 0 }, createdAt: now, updatedAt: now,
  };
  await ref.create(conversation);
  return conversation;
}

export async function sendMessage(userId: string, conversationIdValue: string, rawInput: unknown): Promise<MessageDocument> {
  const input = messageInputSchema.parse(rawInput);
  const db = getFirebaseAdminFirestore();
  const conversationRef = db.collection("conversations").doc(conversationIdValue);
  const messageRef = conversationRef.collection("messages").doc();
  const now = Timestamp.now();
  const currentSnapshot = await conversationRef.get();
  if (!currentSnapshot.exists) throw new Error("Conversation not found.");
  const currentConversation = { id: currentSnapshot.id, ...currentSnapshot.data() } as ConversationDocument;
  const senderRole = await assertConversationAccess(userId, currentConversation);
  if (currentConversation.status !== "active") throw new Error("This conversation is closed.");
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(conversationRef);
    if (!snapshot.exists) throw new Error("Conversation not found.");
    const conversation = { id: snapshot.id, ...snapshot.data() } as ConversationDocument;
    if (conversation.status !== "active") throw new Error("This conversation is closed.");
    const recipientId = senderRole === "customer" ? conversation.vendorId : conversation.customerId;
    const message: MessageDocument = { id: messageRef.id, conversationId: conversation.id, senderId: userId, senderRole, body: input.body, createdAt: now };
    transaction.create(messageRef, message);
    transaction.update(conversationRef, { lastMessagePreview: input.body.slice(0, 160), lastMessageAt: now, updatedAt: now, unreadCounts: { ...conversation.unreadCounts, [recipientId]: (conversation.unreadCounts[recipientId] ?? 0) + 1 } });
    return message;
  });
}

export async function markConversationRead(userId: string, conversationIdValue: string): Promise<void> {
  const db = getFirebaseAdminFirestore();
  const ref = db.collection("conversations").doc(conversationIdValue);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error("Conversation not found.");
    const conversation = { id: snapshot.id, ...snapshot.data() } as ConversationDocument;
    await assertConversationAccess(userId, conversation);
    transaction.update(ref, { unreadCounts: { ...conversation.unreadCounts, [userId]: 0 }, updatedAt: Timestamp.now() });
  });
}

export async function listConversations(userId: string): Promise<ConversationDocument[]> {
  const db = getFirebaseAdminFirestore();
  const customerSnapshot = await db.collection("conversations").where("customerId", "==", userId).orderBy("updatedAt", "desc").limit(50).get();
  const memberships = await db.collection("vendorMemberships").where("userId", "==", userId).where("status", "==", "active").get();
  const vendorIds = memberships.docs.filter((document) => document.data().role === "owner" || document.data().permissions?.manageSupport === true).map((document) => String(document.data().vendorId));
  const vendorSnapshots = await Promise.all(vendorIds.map((vendorId) => db.collection("conversations").where("vendorId", "==", vendorId).orderBy("updatedAt", "desc").limit(50).get()));
  const conversations = [...customerSnapshot.docs, ...vendorSnapshots.flatMap((snapshot) => snapshot.docs)].map((document) => ({ id: document.id, ...document.data() } as ConversationDocument));
  return [...new Map(conversations.map((conversation) => [conversation.id, conversation])).values()].sort((left, right) => (right.updatedAt.seconds - left.updatedAt.seconds));
}
