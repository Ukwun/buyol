import type { ReactNode } from "react";
import { requireVendorSession } from "@/lib/auth/session";

export default async function VendorInventoryLayout({ children }: { children: ReactNode }) {
  await requireVendorSession();
  return children;
}
