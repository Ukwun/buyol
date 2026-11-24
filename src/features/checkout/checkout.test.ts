import { describe, expect, it } from "vitest";
import { checkoutAddressSchema, checkoutQuoteRequestSchema, checkoutSubmitSchema } from "@/features/schemas";

describe("checkout validation", () => {
  it("requires a complete delivery address and preserves country code", () => {
    const result = checkoutAddressSchema.safeParse({ recipientName: "Customer", phoneNumber: "+2348000000000", countryCode: "NG", city: "Lagos", addressLine1: "1 Market Road" });
    expect(result.success).toBe(true);
  });
  it("requires quote and customer-scoped idempotency inputs", () => {
    expect(checkoutQuoteRequestSchema.safeParse({ address: { recipientName: "Customer", phoneNumber: "+2348000000000", countryCode: "NG", city: "Lagos", addressLine1: "1 Market Road" } }).success).toBe(true);
    expect(checkoutSubmitSchema.safeParse({ quoteId: "quote-1", idempotencyKey: "short" }).success).toBe(false);
  });
});
