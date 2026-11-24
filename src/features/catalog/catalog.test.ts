import { describe, expect, it } from "vitest";
import { vendorProductInputSchema } from "@/features/schemas";

const base = { title: "Product", description: "A useful product description.", slug: "product", categoryIds: ["cat-1"], inventoryPolicy: "managed" as const };
describe("catalog input", () => {
  it("requires a SKU and price for products without variants", () => {
    expect(vendorProductInputSchema.safeParse(base).success).toBe(false);
    expect(vendorProductInputSchema.safeParse({ ...base, sku: "SKU-1", sellingPrice: { amountMinor: 1000, currency: "NGN" } }).success).toBe(true);
  });
  it("rejects duplicate variant SKUs and invalid compare-at prices", () => {
    const variant = { sku: "SKU-1", title: "Red", sellingPrice: { amountMinor: 1000, currency: "NGN" }, compareAtPrice: { amountMinor: 900, currency: "NGN" } };
    expect(vendorProductInputSchema.safeParse({ ...base, variants: [variant] }).success).toBe(false);
    expect(vendorProductInputSchema.safeParse({ ...base, variants: [variant, { ...variant, title: "Blue" }] }).success).toBe(false);
  });
});
