import "server-only";
import { FlutterwaveAdapter } from "./flutterwave";
import { PaystackAdapter } from "./paystack";
import type { PaymentAdapter, PaymentProvider } from "./types";

const adapters: Record<PaymentProvider, PaymentAdapter> = { paystack: new PaystackAdapter(), flutterwave: new FlutterwaveAdapter() };
export function getPaymentAdapter(provider: PaymentProvider): PaymentAdapter { return adapters[provider]; }
export function configuredPaymentProviders(): PaymentProvider[] { return (Object.keys(adapters) as PaymentProvider[]).filter((provider) => adapters[provider].isConfigured()); }
