import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { makeMoney } from "@/lib/money";
import { PaymentProviderError, headerValue, type PaymentAdapter, type NormalizedWebhookEvent, type PaymentInitializationInput } from "./types";
import { providerJson } from "./shared";

type PaystackResponse<T> = { status: boolean; message: string; data: T };
type PaystackTransaction = { id: number; reference: string; status: string; amount: number; currency: string; metadata?: Record<string, unknown> };

const apiUrl = "https://api.paystack.co";
function signature(rawBody: string, secret: string): string { return createHmac("sha512", secret).update(rawBody).digest("hex"); }

export class PaystackAdapter implements PaymentAdapter {
  readonly provider = "paystack" as const;
  private get secret(): string | undefined { return process.env.PAYSTACK_SECRET_KEY; }
  private get webhookSecret(): string | undefined { return process.env.PAYSTACK_WEBHOOK_SECRET || this.secret; }
  isConfigured(): boolean { return Boolean(this.secret); }

  async initialize(input: PaymentInitializationInput) {
    if (!this.secret) throw new PaymentProviderError("Paystack is not configured.", "not_configured");
    const response = await providerJson<PaystackResponse<{ authorization_url: string; access_code: string; reference: string }>>(`${apiUrl}/transaction/initialize`, { method: "POST", headers: { Authorization: `Bearer ${this.secret}`, "Content-Type": "application/json" }, body: JSON.stringify({ email: input.email, amount: input.amount.amountMinor, currency: input.amount.currency, reference: input.reference, callback_url: input.callbackUrl, metadata: input.metadata }) });
    if (!response.status || !response.data?.authorization_url) throw new PaymentProviderError(response.message || "Paystack initialization failed.");
    return { checkoutUrl: response.data.authorization_url, reference: response.data.reference, safeMetadata: { accessCodePresent: Boolean(response.data.access_code) } };
  }

  async verify(reference: string) {
    if (!this.secret) throw new PaymentProviderError("Paystack is not configured.", "not_configured");
    const response = await providerJson<PaystackResponse<PaystackTransaction>>(`${apiUrl}/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${this.secret}` } });
    if (!response.status || !response.data) throw new PaymentProviderError(response.message || "Paystack verification failed.");
    const transaction = response.data;
    return { status: transaction.status === "success" ? "succeeded" as const : transaction.status === "abandoned" ? "abandoned" as const : transaction.status === "failed" ? "failed" as const : "processing" as const, reference: transaction.reference, providerTransactionId: String(transaction.id), amount: makeMoney(transaction.amount, transaction.currency), safeMetadata: { providerStatus: transaction.status } };
  }

  validateWebhookSignature(rawBody: string, headers: Headers): boolean {
    const secret = this.webhookSecret; const received = headerValue(headers, "x-paystack-signature", "paystack-signature");
    if (!secret || !received) return false;
    const expected = signature(rawBody, secret);
    return expected.length === received.length && timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  }

  normalizeWebhook(rawBody: string, headers: Headers): NormalizedWebhookEvent {
    void headers;
    const payload = JSON.parse(rawBody) as { event?: string; data?: PaystackTransaction; id?: string };
    const data = payload.data; if (!data?.reference) throw new PaymentProviderError("Paystack webhook has no transaction reference.", "invalid_webhook");
    return { eventId: String(payload.id || `reference:${data.reference}:${payload.event || "unknown"}`), eventType: payload.event || "unknown", status: payload.event === "charge.success" || data.status === "success" ? "succeeded" : data.status === "failed" ? "failed" : "processing", reference: data.reference, providerTransactionId: String(data.id), amount: makeMoney(data.amount, data.currency), safeMetadata: { providerStatus: data.status } };
  }
}
