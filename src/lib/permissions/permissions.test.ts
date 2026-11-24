import { describe, expect, it } from "vitest";
import { roleHasVendorPermission } from "@/lib/permissions/vendor";

describe("vendor permissions", () => {
  it("keeps vendor permissions separate from platform claims", () => {
    expect(roleHasVendorPermission("catalog_manager", "manageCatalog")).toBe(true);
    expect(roleHasVendorPermission("catalog_manager", "viewFinance")).toBe(false);
    expect(roleHasVendorPermission("finance_manager", "manageCatalog")).toBe(false);
  });
});
