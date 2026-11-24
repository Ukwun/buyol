import type { ReactNode } from "react";
import { navigation } from "@/config/navigation";
import { DashboardShell } from "@/components/layout";
import { requireCustomerSession } from "@/lib/auth/session";

export default async function VendorLayout({ children }: { children: ReactNode }) {
  await requireCustomerSession();
  return (
    <DashboardShell area="vendor" title="Vendor dashboard" navigationItems={navigation.vendor}>
      {children}
    </DashboardShell>
  );
}
