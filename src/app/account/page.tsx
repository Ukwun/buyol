import type { Metadata } from "next";
import { UserRound } from "lucide-react";
import { RoutePlaceholder } from "@/components/layout";

export const metadata: Metadata = { title: "Customer account | BUYOL" };

export default function AccountPage() {
  return (
    <RoutePlaceholder
      eyebrow="Customer account"
      title="Your account workspace is ready."
      description="Account management, orders and saved items will be added after authentication is connected."
      icon={<UserRound size={24} />}
    />
  );
}
