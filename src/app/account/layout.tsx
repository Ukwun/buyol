import type { ReactNode } from "react";
import { navigation } from "@/config/navigation";
import { DashboardShell } from "@/components/layout";
import { requireCustomerSession } from "@/lib/auth/session";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireCustomerSession();
  return (
    <DashboardShell area="account" title="Customer account" navigationItems={navigation.account}>
      {children}
    </DashboardShell>
  );
}
