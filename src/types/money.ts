import type { FirestoreTimestamp } from "./timestamps";

export type CurrencyCode = string & { readonly __brand: "CurrencyCode" };
export type MinorUnits = number & { readonly __brand: "MinorUnits" };

export interface Money {
  amountMinor: MinorUnits;
  currency: CurrencyCode;
}

export interface ExchangeRateSnapshot {
  baseCurrency: CurrencyCode;
  quoteCurrency: CurrencyCode;
  rateNumerator: string;
  rateDenominator: string;
  source: string;
  capturedAt: FirestoreTimestamp;
  roundingMode: "half-up" | "down" | "up";
}

export interface ConvertedMoney {
  original: Money;
  converted: Money;
  exchangeRate: ExchangeRateSnapshot;
}
