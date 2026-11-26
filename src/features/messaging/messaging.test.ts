import { describe, expect, it } from "vitest";
import { messageInputSchema } from "@/features/schemas";

describe("messaging validation", () => {
  it("accepts a meaningful message and trims it", () => {
    expect(messageInputSchema.parse({ body: "  Is this available in another colour?  " }).body).toBe("Is this available in another colour?");
  });

  it("rejects empty and oversized messages", () => {
    expect(messageInputSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(messageInputSchema.safeParse({ body: "x".repeat(2001) }).success).toBe(false);
  });
});
