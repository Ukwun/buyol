import type { VendorMembershipRole, VendorPermissions } from "@/types/firestore";

export type VendorPermission = keyof VendorPermissions;

export const vendorRolePermissions: Record<VendorMembershipRole, readonly VendorPermission[]> = {
  owner: ["manageStore", "manageCatalog", "manageInventory", "manageOrders", "viewFinance", "manageSupport"],
  manager: ["manageStore", "manageCatalog", "manageInventory", "manageOrders", "viewFinance", "manageSupport"],
  catalog_manager: ["manageCatalog"],
  fulfillment_manager: ["manageInventory", "manageOrders"],
  finance_manager: ["viewFinance"],
  support_agent: ["manageSupport"],
};

export function roleHasVendorPermission(role: VendorMembershipRole, permission: VendorPermission): boolean {
  return vendorRolePermissions[role].includes(permission);
}
