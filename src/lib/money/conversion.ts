import type { CurrencyCode, ExchangeRateSnapshot, Money } from "@/types/money";
import { makeMoney } from "./arithmetic";

export function convertMoney(
  money: Money,
  targetCurrency: CurrencyCode,
  rate: ExchangeRateSnapshot,
): Money {
  if (money.currency !== rate.baseCurrency) {
    throw new Error("Money currency must match the exchange-rate base currency.");
  }
  if (targetCurrency !== rate.quoteCurrency) {
    throw new Error("Target currency must match the exchange-rate quote currency.");
  }

  const numerator = BigInt(rate.rateNumerator);
  const denominator = BigInt(rate.rateDenominator);
  if (numerator <= 0n || denominator <= 0n) throw new Error("Exchange-rate values must be positive integers.");

  const absoluteNumerator = BigInt(money.amountMinor) * numerator;
  const quotient = absoluteNumerator / denominator;
  const remainder = absoluteNumerator % denominator;
  let rounded = quotient;

  if (rate.roundingMode === "up" && remainder > 0n) rounded += 1n;
  if (rate.roundingMode === "half-up" && remainder * 2n >= denominator) rounded += 1n;

  const amount = Number(rounded);
  if (!Number.isSafeInteger(amount)) throw new Error("Converted amount exceeds safe integer limits.");
  return makeMoney(amount, targetCurrency);
}
