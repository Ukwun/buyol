import type { ReactNode } from "react";
import { requireVendorSession } from "@/lib/auth/session";

export default async function VendorProductsLayout({ children }: { children: ReactNode }) {
  await requireVendorSession();
  return children;
}
