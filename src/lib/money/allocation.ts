import type { Money } from "@/types/money";
import { makeMoney } from "./arithmetic";

export function calculateBasisPoints(
  money: Money,
  basisPoints: number,
  rounding: "half-up" | "down" | "up" = "half-up",
): Money {
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0) {
    throw new Error("Basis points must be a non-negative safe integer.");
  }

  const numerator = BigInt(money.amountMinor) * BigInt(basisPoints);
  const denominator = 10000n;
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  let result = quotient;

  if (rounding === "up" && remainder > 0n) result += 1n;
  if (rounding === "half-up" && remainder * 2n >= denominator) result += 1n;

  const amount = Number(result);
  if (!Number.isSafeInteger(amount)) throw new Error("Calculated amount exceeds safe integer limits.");
  return makeMoney(amount, money.currency);
}

export function allocateProportionally(
  total: Money,
  weights: readonly number[],
): Money[] {
  if (weights.length === 0) return [];
  if (weights.some((weight) => !Number.isSafeInteger(weight) || weight < 0)) {
    throw new Error("Allocation weights must be non-negative safe integers.");
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) throw new Error("Allocation weights must have a positive total.");

  const totalMinor = BigInt(total.amountMinor);
  const denominator = BigInt(totalWeight);
  const allocations = weights.map((weight) => {
    const numerator = totalMinor * BigInt(weight);
    return {
      floor: numerator / denominator,
      remainder: numerator % denominator,
    };
  });

  let assigned = allocations.reduce((sum, allocation) => sum + allocation.floor, 0n);
  let remainder = totalMinor - assigned;
  const order = allocations
    .map((allocation, index) => ({ index, remainder: allocation.remainder }))
    .sort((left, right) => right.remainder > left.remainder ? 1 : right.remainder < left.remainder ? -1 : left.index - right.index);

  const result = allocations.map((allocation) => allocation.floor);
  let cursor = 0;
  while (remainder > 0n) {
    result[order[cursor % order.length].index] += 1n;
    remainder -= 1n;
    cursor += 1;
  }

  assigned = result.reduce((sum, amount) => sum + amount, 0n);
  if (assigned !== totalMinor) throw new Error("Largest-remainder allocation failed to conserve the total.");

  return result.map((amount) => {
    const numericAmount = Number(amount);
    if (!Number.isSafeInteger(numericAmount)) throw new Error("Allocated amount exceeds safe integer limits.");
    return makeMoney(numericAmount, total.currency);
  });
}
