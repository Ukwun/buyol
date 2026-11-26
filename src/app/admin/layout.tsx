import type { ReactNode } from "react";
import { navigation } from "@/config/navigation";
import { DashboardShell } from "@/components/layout";
import { requireAdminSession } from "@/lib/auth/session";

export const instant = false;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminSession();
  return (
    <DashboardShell area="admin" title="Admin dashboard" navigationItems={navigation.admin}>
      {children}
    </DashboardShell>
  );
}
