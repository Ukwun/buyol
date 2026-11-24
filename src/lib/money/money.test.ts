import { describe, expect, it } from "vitest";
import { addMoney, allocateProportionally, calculateBasisPoints, convertMoney, makeMoney } from "@/lib/money";

describe("money utilities", () => {
  it("rejects unsupported currencies and unsafe amounts", () => {
    expect(() => makeMoney(100, "XXX")).toThrow();
    expect(() => makeMoney(Number.MAX_SAFE_INTEGER + 1, "NGN")).toThrow();
  });

  it("prevents arithmetic across currencies", () => {
    expect(() => addMoney(makeMoney(100, "NGN"), makeMoney(100, "USD"))).toThrow("Currency mismatch");
  });

  it("calculates basis points with explicit half-up rounding", () => {
    expect(calculateBasisPoints(makeMoney(105, "NGN"), 3333).amountMinor).toBe(35);
  });

  it("conserves totals using largest-remainder allocation", () => {
    const result = allocateProportionally(makeMoney(100, "NGN"), [1, 1, 1]);
    expect(result.map((item) => item.amountMinor)).toEqual([34, 33, 33]);
  });

  it("converts with integer numerator and denominator arithmetic", () => {
    const result = convertMoney(makeMoney(1000, "USD"), "NGN" as never, {
      baseCurrency: "USD" as never,
      quoteCurrency: "NGN" as never,
      rateNumerator: "150000",
      rateDenominator: "100",
      source: "test",
      capturedAt: { seconds: 0, nanoseconds: 0 },
      roundingMode: "half-up",
    });
    expect(result.amountMinor).toBe(1500000);
  });
});
