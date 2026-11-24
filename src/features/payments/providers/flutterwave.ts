import "server-only";
import { PaymentProviderError, headerValue, type PaymentAdapter, type NormalizedWebhookEvent, type PaymentInitializationInput } from "./types";
import { formatMajorUnits, parseProviderMoney, providerJson, safeEqual } from "./shared";
import type { CurrencyCode } from "@/types/money";

type FlutterwaveResponse<T> = { status: string; message: string; data: T };
type FlutterwaveTransaction = { id: number; tx_ref: string; status: string; amount: number | string; currency: string; meta?: Record<string, unknown> };
const apiUrl = "https://api.flutterwave.com/v3";

export class FlutterwaveAdapter implements PaymentAdapter {
  readonly provider = "flutterwave" as const;
  private get secret(): string | undefined { return process.env.FLUTTERWAVE_SECRET_KEY; }
  isConfigured(): boolean { return Boolean(this.secret); }
  async initialize(input: PaymentInitializationInput) {
    if (!this.secret) throw new PaymentProviderError("Flutterwave is not configured.", "not_configured");
    const response = await providerJson<FlutterwaveResponse<{ link: string }>>(`${apiUrl}/payments`, { method: "POST", headers: { Authorization: `Bearer ${this.secret}`, "Content-Type": "application/json" }, body: JSON.stringify({ tx_ref: input.reference, amount: formatMajorUnits(input.amount), currency: input.amount.currency, redirect_url: input.callbackUrl, customer: { email: input.email }, meta: input.metadata }) });
    if (response.status !== "success" || !response.data?.link) throw new PaymentProviderError(response.message || "Flutterwave initialization failed.");
    return { checkoutUrl: response.data.link, reference: input.reference };
  }
  async verify(transactionId: string) {
    if (!this.secret) throw new PaymentProviderError("Flutterwave is not configured.", "not_configured");
    const response = await providerJson<FlutterwaveResponse<FlutterwaveTransaction>>(`${apiUrl}/transactions/${encodeURIComponent(transactionId)}/verify`, { headers: { Authorization: `Bearer ${this.secret}` } });
    if (response.status !== "success" || !response.data) throw new PaymentProviderError(response.message || "Flutterwave verification failed.");
    const transaction = response.data; const currency = transaction.currency as CurrencyCode;
    return { status: transaction.status === "successful" ? "succeeded" as const : transaction.status === "failed" ? "failed" as const : "processing" as const, reference: transaction.tx_ref, providerTransactionId: String(transaction.id), amount: parseProviderMoney(transaction.amount, currency), safeMetadata: { providerStatus: transaction.status } };
  }
  validateWebhookSignature(_rawBody: string, headers: Headers): boolean { return safeEqual(headerValue(headers, "verif-hash", "flutterwave-signature"), process.env.FLUTTERWAVE_SECRET_HASH); }
  normalizeWebhook(rawBody: string, headers: Headers): NormalizedWebhookEvent {
    void headers;
    const payload = JSON.parse(rawBody) as { id?: string; event?: string; data?: FlutterwaveTransaction }; const data = payload.data; if (!data?.tx_ref) throw new PaymentProviderError("Flutterwave webhook has no transaction reference.", "invalid_webhook");
    const currency = data.currency as CurrencyCode;
    return { eventId: String(payload.id || `transaction:${data.id}`), eventType: payload.event || "charge.completed", status: data.status === "successful" ? "succeeded" : data.status === "failed" ? "failed" : "processing", reference: data.tx_ref, providerTransactionId: String(data.id), amount: parseProviderMoney(data.amount, currency), safeMetadata: { providerStatus: data.status } };
  }
}
