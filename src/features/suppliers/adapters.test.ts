import { describe, expect, it } from "vitest";
import { assertSupplierCapability, resolveSupplierAdapter } from "@/features/suppliers/adapters";

describe("supplier adapters", () => {
  it("resolves known providers as explicitly unconfigured", () => {
    const adapter = resolveSupplierAdapter("1688");
    expect(adapter?.provider).toBe("1688");
    expect(adapter?.isConfigured()).toBe(false);
  });
  it("rejects unsupported or unconfigured capabilities", () => {
    expect(() => assertSupplierCapability(resolveSupplierAdapter("alibaba")!, "productDetails")).toThrow("not configured");
    expect(resolveSupplierAdapter("unknown")).toBeNull();
  });
});
