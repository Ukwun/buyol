import { describe, expect, it } from "vitest";
import { inventorySchema, promotionSchema, vendorApplicationInputSchema, vendorMembershipSchema } from "@/features/schemas";

const timestamp = { seconds: 1, nanoseconds: 0 };

describe("Firestore schemas", () => {
  it("requires inventory quantities to be non-negative integers", () => {
    expect(inventorySchema.safeParse({
      id: "inventory-1", listingId: "listing-1", vendorId: "vendor-1", sku: "SKU-1",
      onHand: 4, reserved: 1, reservationVersion: 1, status: "active", updatedAt: timestamp,
    }).success).toBe(true);
    expect(inventorySchema.safeParse({
      id: "inventory-1", listingId: "listing-1", vendorId: "vendor-1", sku: "SKU-1",
      onHand: 4, reserved: -1, reservationVersion: 1, status: "active", updatedAt: timestamp,
    }).success).toBe(false);
  });

  it("requires vendor memberships to carry explicit access state", () => {
    expect(vendorMembershipSchema.safeParse({
      id: "vendor-1_user-1", vendorId: "vendor-1", userId: "user-1", role: "catalog_manager",
      permissions: { manageStore: false, manageCatalog: true, manageInventory: false, manageOrders: false, viewFinance: false, manageSupport: false },
      status: "active", createdAt: timestamp, updatedAt: timestamp,
    }).success).toBe(true);
  });

  it("validates vendor applications without accepting privileged fields", () => {
    const result = vendorApplicationInputSchema.safeParse({
      personal: { fullLegalName: "Ada Vendor", contactEmail: "ada@example.com", phoneNumber: "+2348000000000", countryCode: "NG", preferredContactMethod: "email" },
      business: { tradingName: "Ada Trading", businessType: "individual", registrationCountryCode: "NG", address: { recipientName: "Ada Vendor", phoneNumber: "+2348000000000", addressLine1: "1 Market Road", city: "Lagos", countryCode: "NG" }, contactEmail: "business@example.com", phoneNumber: "+2348000000000" },
      store: { name: "Ada Store", slug: "ada-store", description: "A store description that is long enough.", countryCode: "NG", settlementCurrency: "NGN" },
      status: "approved",
    });
    expect(result.success).toBe(true);
    if (result.success) expect("status" in result.data).toBe(false);
  });

  it("accepts integer percentage promotion values", () => {
    expect(promotionSchema.safeParse({
      id: "promo-1", ownerType: "platform", type: "percentage", rateBasisPoints: 1250,
      usageCount: 0, startsAt: timestamp, endsAt: timestamp, status: "active",
    }).success).toBe(true);
  });
});
