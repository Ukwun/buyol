import type { ReactNode } from "react";
import { requireVendorSession } from "@/lib/auth/session";

export default async function VendorMessagesLayout({ children }: { children: ReactNode }) {
  await requireVendorSession();
  return children;
}
