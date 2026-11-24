import type { Money } from "@/types/money";

export type PaymentProvider = "paystack" | "flutterwave";
export type NormalizedPaymentStatus = "pending" | "processing" | "succeeded" | "failed" | "abandoned";

export interface PaymentInitializationInput {
  reference: string;
  email: string;
  amount: Money;
  callbackUrl: string;
  metadata: Record<string, string>;
}

export interface NormalizedPayment {
  status: NormalizedPaymentStatus;
  reference: string;
  providerTransactionId?: string;
  amount: Money;
  safeMetadata?: Record<string, string | number | boolean | null>;
}

export interface NormalizedWebhookEvent extends NormalizedPayment {
  eventId: string;
  eventType: string;
}

export interface PaymentAdapter {
  readonly provider: PaymentProvider;
  isConfigured(): boolean;
  initialize(input: PaymentInitializationInput): Promise<{ checkoutUrl: string; reference: string; safeMetadata?: Record<string, string | number | boolean | null> }>;
  verify(referenceOrTransactionId: string): Promise<NormalizedPayment>;
  validateWebhookSignature(rawBody: string, headers: Headers): boolean;
  normalizeWebhook(rawBody: string, headers: Headers): NormalizedWebhookEvent;
}

export class PaymentProviderError extends Error {
  constructor(message: string, readonly code = "provider_error") {
    super(message);
    this.name = "PaymentProviderError";
  }
}

export function headerValue(headers: Headers, ...names: string[]): string | undefined {
  for (const name of names) {
    const value = headers.get(name);
    if (value) return value;
  }
  return undefined;
}
