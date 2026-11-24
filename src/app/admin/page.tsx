import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { RoutePlaceholder } from "@/components/layout";

export const metadata: Metadata = { title: "Admin dashboard | BUYOL" };

export default function AdminPage() {
  return (
    <RoutePlaceholder
      eyebrow="Administration"
      title="The admin workspace is ready."
      description="Platform operations and reporting will be added after server-side administrator authorization is implemented."
      icon={<ShieldCheck size={24} />}
    />
  );
}
