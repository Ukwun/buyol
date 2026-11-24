import type { CurrencyCode } from "@/types/money";

const currencyMetadata = {
  AED: 2,
  AUD: 2,
  CAD: 2,
  CHF: 2,
  CNY: 2,
  EUR: 2,
  GBP: 2,
  GHS: 2,
  JPY: 0,
  KWD: 3,
  KRW: 0,
  NGN: 2,
  USD: 2,
  ZAR: 2,
} as const satisfies Record<string, number>;

export type SupportedCurrencyCode = keyof typeof currencyMetadata;

export function isCurrencyCode(value: string): value is CurrencyCode {
  return Object.prototype.hasOwnProperty.call(currencyMetadata, value);
}

export function assertCurrencyCode(value: string): asserts value is CurrencyCode {
  if (!isCurrencyCode(value)) {
    throw new Error(`Unsupported ISO 4217 currency code: ${value}`);
  }
}

export function currencyMinorUnits(currency: CurrencyCode): number {
  assertCurrencyCode(currency);
  return currencyMetadata[currency as SupportedCurrencyCode];
}
