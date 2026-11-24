import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { paymentAttemptSchema } from "@/features/schemas";
import type { ParentOrderDocument, PaymentAttemptDocument } from "@/types/firestore";
import type { PaymentProvider, NormalizedPayment } from "./providers/types";
import { PaymentProviderError } from "./providers/types";
import { configuredPaymentProviders, getPaymentAdapter } from "./providers/registry";
import { releaseExpiredReservations } from "@/features/checkout/expiry";

const PAYMENT_EXPIRY_MS = 30 * 60 * 1000;
const providerSchema = (value: unknown): PaymentProvider => {
  if (value !== "paystack" && value !== "flutterwave") throw new Error("Unsupported payment provider.");
  return value;
};

function appUrl(): string { return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; }
function safeError(error: unknown): { code: string; reason: string } { return { code: error instanceof PaymentProviderError ? error.code : "provider_error", reason: error instanceof Error ? error.message.slice(0, 200) : "Payment provider request failed." }; }

export async function listConfiguredPaymentProviders(): Promise<PaymentProvider[]> { return configuredPaymentProviders(); }

export async function initializePayment(customerId: string, rawInput: unknown) {
  const input = rawInput as { orderId?: unknown; provider?: unknown; idempotencyKey?: unknown };
  if (typeof input.orderId !== "string" || typeof input.idempotencyKey !== "string" || input.idempotencyKey.length < 8) throw new Error("A valid order and idempotency key are required.");
  const provider = providerSchema(input.provider); const adapter = getPaymentAdapter(provider); if (!adapter.isConfigured()) throw new Error("That payment provider is not currently configured.");
  const db = getFirebaseAdminFirestore(); const orderRef = db.collection("orders").doc(input.orderId); const orderSnapshot = await orderRef.get();
  if (!orderSnapshot.exists) throw new Error("Order was not found.");
  const order = { id: orderSnapshot.id, ...orderSnapshot.data() } as ParentOrderDocument; const userSnapshot = await db.collection("users").doc(customerId).get(); const customerEmail = String(userSnapshot.data()?.email || ""); if (!customerEmail) throw new Error("A verified customer email is required for payment.");
  if (order.customerId !== customerId) throw new Error("Order access denied.");
  if (order.paymentStatus !== "pending" || order.orderStatus !== "pending_payment") throw new Error("This order is not available for payment.");
  const reservationSnapshot = await db.collectionGroup("reservations").where("parentOrderId", "==", order.id).where("status", "==", "active").get();
  if (reservationSnapshot.empty || reservationSnapshot.docs.some((reservation) => { const expiresAt = reservation.data().expiresAt as { toMillis?: () => number } | undefined; return !expiresAt?.toMillis || expiresAt.toMillis() <= Date.now(); })) throw new Error("This order's inventory reservation has expired. Create a new checkout.");
  const existing = await db.collection("payments").where("parentOrderId", "==", order.id).where("customerId", "==", customerId).where("provider", "==", provider).where("idempotencyKey", "==", input.idempotencyKey).limit(1).get();
  if (!existing.empty) {
    const attempt = { id: existing.docs[0].id, ...existing.docs[0].data() } as PaymentAttemptDocument;
    if (attempt.status === "requires_action" && attempt.safeProviderMetadata?.checkoutUrl) return { paymentId: attempt.id, checkoutUrl: String(attempt.safeProviderMetadata.checkoutUrl), provider, reference: attempt.internalReference };
  }
  const paymentId = db.collection("payments").doc().id; const now = Timestamp.now(); const internalReference = `buyol_${order.id}_${provider}_${paymentId}`;
  const attempt: PaymentAttemptDocument = { id: paymentId, parentOrderId: order.id, customerId, provider, idempotencyKey: input.idempotencyKey, internalReference, amount: order.total, status: "initializing", createdAt: now, updatedAt: now, expiresAt: Timestamp.fromMillis(Date.now() + PAYMENT_EXPIRY_MS) };
  await db.collection("payments").doc(paymentId).set({ ...attempt, id: undefined });
  try {
    const initialized = await adapter.initialize({ reference: internalReference, email: customerEmail, amount: order.total, callbackUrl: `${appUrl()}/checkout/payment-return?paymentId=${encodeURIComponent(paymentId)}`, metadata: { orderId: order.id, paymentId } });
    await db.collection("payments").doc(paymentId).update({ status: "requires_action", providerReference: initialized.reference, safeProviderMetadata: { ...(initialized.safeMetadata || {}), checkoutUrl: initialized.checkoutUrl }, updatedAt: Timestamp.now() });
    return { paymentId, checkoutUrl: initialized.checkoutUrl, provider, reference: initialized.reference };
  } catch (error) {
    const failure = safeError(error); await db.collection("payments").doc(paymentId).update({ status: "failed", failureCode: failure.code, failureReason: failure.reason, updatedAt: Timestamp.now() }); throw new Error("Payment initialization failed. You can retry this order.");
  }
}

function assertPaymentMatchesOrder(payment: PaymentAttemptDocument, normalized: NormalizedPayment, order: ParentOrderDocument): void {
  if (normalized.reference !== payment.providerReference && normalized.reference !== payment.internalReference) throw new Error("Payment reference mismatch.");
  if (normalized.amount.currency !== order.total.currency || normalized.amount.amountMinor !== order.total.amountMinor) throw new Error("Payment amount or currency mismatch.");
}

async function applyVerifiedPayment(paymentId: string, normalized: NormalizedPayment, provider: PaymentProvider): Promise<"succeeded" | "failed" | "reconciliation_required"> {
  const db = getFirebaseAdminFirestore(); const paymentRef = db.collection("payments").doc(paymentId); const now = Timestamp.now();
  return db.runTransaction(async (transaction) => {
    const paymentSnapshot = await transaction.get(paymentRef); if (!paymentSnapshot.exists) throw new Error("Payment attempt was not found.");
    const payment = { id: paymentSnapshot.id, ...paymentSnapshot.data() } as PaymentAttemptDocument; const orderRef = db.collection("orders").doc(payment.parentOrderId); const orderSnapshot = await transaction.get(orderRef); if (!orderSnapshot.exists) throw new Error("Parent order was not found.");
    const order = { id: orderSnapshot.id, ...orderSnapshot.data() } as ParentOrderDocument;
    try { assertPaymentMatchesOrder(payment, normalized, order); } catch (error) { const exceptionRef = db.collection("reconciliationExceptions").doc(`${paymentId}_${now.toMillis()}`); transaction.create(exceptionRef, { id: exceptionRef.id, provider, paymentId, parentOrderId: payment.parentOrderId, reason: error instanceof Error ? error.message : "Payment mismatch", status: "open", createdAt: now }); transaction.update(paymentRef, { status: "failed", failureCode: "mismatch", failureReason: "Provider verification did not match the order.", updatedAt: now }); return "reconciliation_required"; }
    if (normalized.status === "failed" || normalized.status === "abandoned") { transaction.update(paymentRef, { status: normalized.status, providerTransactionId: normalized.providerTransactionId, updatedAt: now, lastVerifiedAt: now }); return "failed"; }
    if (payment.status === "succeeded" && order.paymentStatus === "paid") return "succeeded";
    const reservations = await transaction.get(db.collectionGroup("reservations").where("parentOrderId", "==", payment.parentOrderId));
    const activeReservations = reservations.docs.filter((doc) => doc.data().status === "active");
    if (activeReservations.length === 0) { const exceptionRef = db.collection("reconciliationExceptions").doc(`${paymentId}_late`); transaction.create(exceptionRef, { id: exceptionRef.id, provider, paymentId, parentOrderId: payment.parentOrderId, reason: "Verified payment arrived after inventory reservations were released.", status: "open", createdAt: now }); transaction.update(paymentRef, { status: "succeeded", providerTransactionId: normalized.providerTransactionId, verifiedAt: now, lastVerifiedAt: now, updatedAt: now }); return "reconciliation_required"; }
    for (const reservation of activeReservations) transaction.update(reservation.ref, { status: "confirmed", confirmedAt: now });
    transaction.update(paymentRef, { status: "succeeded", providerTransactionId: normalized.providerTransactionId, verifiedAt: now, lastVerifiedAt: now, updatedAt: now }); transaction.update(orderRef, { paymentStatus: "paid", orderStatus: "processing", updatedAt: now }); transaction.create(orderRef.collection("events").doc(`payment_${paymentId}`), { type: "payment_succeeded", paymentId, createdAt: now });
    for (const vendorOrderId of order.vendorOrderIds) transaction.update(db.collection("vendorOrders").doc(vendorOrderId), { paymentStatus: "paid", orderStatus: "processing", updatedAt: now });
    return "succeeded";
  });
}

export async function verifyPaymentForCustomer(customerId: string, paymentId: string, providerTransactionId?: string) {
  const db = getFirebaseAdminFirestore(); const snapshot = await db.collection("payments").doc(paymentId).get(); if (!snapshot.exists) throw new Error("Payment was not found."); const payment = { id: snapshot.id, ...snapshot.data() } as PaymentAttemptDocument; if (payment.customerId !== customerId) throw new Error("Payment access denied."); if (!payment.providerReference) throw new Error("Payment has not been initialized.");
  const normalized = await getPaymentAdapter(payment.provider).verify(payment.provider === "flutterwave" ? providerTransactionId || payment.providerTransactionId || payment.providerReference : payment.providerReference); const result = await applyVerifiedPayment(payment.id, normalized, payment.provider); return { paymentId, status: result };
}

export async function processPaymentWebhook(provider: PaymentProvider, rawBody: string, headers: Headers) {
  const adapter = getPaymentAdapter(provider); if (!adapter.validateWebhookSignature(rawBody, headers)) throw new Error("Invalid webhook signature."); const event = adapter.normalizeWebhook(rawBody, headers); const eventId = `${provider}_${event.eventId}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 150); const db = getFirebaseAdminFirestore(); const eventRef = db.collection("paymentEvents").doc(eventId); const existing = await eventRef.get(); if (existing.exists && existing.data()?.processingStatus === "processed") return { duplicate: true };
  const paymentQuery = await db.collection("payments").where("provider", "==", provider).where("providerReference", "==", event.reference).limit(1).get(); if (paymentQuery.empty) { await eventRef.set({ id: eventId, provider, providerEventId: event.eventId, eventType: event.eventType, signatureVerified: true, processingStatus: "failed", providerReference: event.reference, receivedAt: Timestamp.now() }); throw new Error("Payment reference was not found."); }
  const paymentId = paymentQuery.docs[0].id; await eventRef.set({ id: eventId, provider, providerEventId: event.eventId, paymentId, eventType: event.eventType, signatureVerified: true, processingStatus: "received", amount: event.amount, providerReference: event.reference, safeMetadata: event.safeMetadata, receivedAt: Timestamp.now() }, { merge: true });
  const verified = await adapter.verify(event.providerTransactionId || event.reference); const status = await applyVerifiedPayment(paymentId, verified, provider); await eventRef.update({ processingStatus: status === "reconciliation_required" ? "failed" : "processed", processedAt: Timestamp.now() }); return { duplicate: false, status };
}

/** Trusted scheduled-job entry point. It is not exposed through a browser route. */
export async function reconcilePendingPayments(now = Timestamp.now()): Promise<{ checked: number; repaired: number; exceptions: number }> {
  const db = getFirebaseAdminFirestore(); const cutoff = Timestamp.fromMillis(now.toMillis() - 15 * 60 * 1000); const snapshot = await db.collection("payments").where("status", "in", ["requires_action", "processing", "initializing"]).where("createdAt", "<=", cutoff).limit(100).get(); let repaired = 0; let exceptions = 0;
  for (const document of snapshot.docs) {
    const payment = { id: document.id, ...document.data() } as PaymentAttemptDocument;
    if (!payment.providerReference) continue;
    try { const normalized = await getPaymentAdapter(payment.provider).verify(payment.provider === "flutterwave" ? payment.providerTransactionId || payment.providerReference : payment.providerReference); const result = await applyVerifiedPayment(payment.id, normalized, payment.provider); if (result === "succeeded") repaired += 1; if (result === "reconciliation_required") exceptions += 1; } catch { exceptions += 1; }
  }
  await expireStalePaymentAttempts(now); return { checked: snapshot.size, repaired, exceptions };
}

async function expireStalePaymentAttempts(now: Timestamp): Promise<void> {
  const db = getFirebaseAdminFirestore(); const snapshot = await db.collection("payments").where("status", "in", ["requires_action", "processing", "initializing"]).where("expiresAt", "<=", now).limit(100).get();
  for (const document of snapshot.docs) await db.runTransaction(async (transaction) => { const current = await transaction.get(document.ref); if (!current.exists) return; const payment = current.data() as PaymentAttemptDocument; if (["succeeded", "failed", "expired", "cancelled"].includes(payment.status)) return; transaction.update(document.ref, { status: "expired", failureCode: "expired", failureReason: "Payment attempt expired.", updatedAt: now }); });
  await releaseExpiredReservations(now);
}

export function paymentAttemptFromData(data: unknown): PaymentAttemptDocument { return paymentAttemptSchema.parse(data) as PaymentAttemptDocument; }
