import type { CurrencyCode, MinorUnits, Money } from "@/types/money";
import { assertCurrencyCode } from "./currency";

export type RoundingMode = "half-up" | "down" | "up";

function assertSafeMinorUnits(amount: number): asserts amount is MinorUnits {
  if (!Number.isSafeInteger(amount)) {
    throw new Error("Money amounts must be safe integers in minor units.");
  }
}

function assertSameCurrency(left: Money, right: Money): void {
  if (left.currency !== right.currency) {
    throw new Error(`Currency mismatch: ${left.currency} and ${right.currency}.`);
  }
}

function roundedDivision(numerator: bigint, denominator: bigint, rounding: RoundingMode): bigint {
  if (denominator <= 0n) throw new Error("The division denominator must be positive.");

  const sign = numerator < 0n ? -1n : 1n;
  const absoluteNumerator = numerator < 0n ? -numerator : numerator;
  const quotient = absoluteNumerator / denominator;
  const remainder = absoluteNumerator % denominator;

  let rounded = quotient;
  if (rounding === "up" && remainder > 0n) rounded += 1n;
  if (rounding === "half-up" && remainder * 2n >= denominator) rounded += 1n;

  return rounded * sign;
}

function toSafeNumber(value: bigint): number {
  const result = Number(value);
  assertSafeMinorUnits(result);
  return result;
}

export function makeMoney(amountMinor: number, currency: string): Money {
  assertCurrencyCode(currency);
  assertSafeMinorUnits(amountMinor);
  return { amountMinor, currency };
}

export function addMoney(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  return makeMoney(left.amountMinor + right.amountMinor, left.currency);
}

export function subtractMoney(left: Money, right: Money): Money {
  assertSameCurrency(left, right);
  return makeMoney(left.amountMinor - right.amountMinor, left.currency);
}

export function multiplyMoney(money: Money, factor: number): Money {
  if (!Number.isSafeInteger(factor)) throw new Error("Money multiplication factors must be integers.");
  return makeMoney(money.amountMinor * factor, money.currency);
}

export function multiplyMoneyByRatio(
  money: Money,
  numerator: number | bigint,
  denominator: number | bigint,
  rounding: RoundingMode = "half-up",
): Money {
  const amount = roundedDivision(
    BigInt(money.amountMinor) * BigInt(numerator),
    BigInt(denominator),
    rounding,
  );
  return makeMoney(toSafeNumber(amount), money.currency);
}

export function compareMoney(left: Money, right: Money): -1 | 0 | 1 {
  assertSameCurrency(left, right);
  if (left.amountMinor === right.amountMinor) return 0;
  return left.amountMinor < right.amountMinor ? -1 : 1;
}

export function assertCurrency(currency: CurrencyCode): CurrencyCode {
  assertCurrencyCode(currency);
  return currency;
}
