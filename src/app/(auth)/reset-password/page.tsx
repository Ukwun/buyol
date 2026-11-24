import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components";

export const metadata: Metadata = { title: "Reset your password | BUYOL" };

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
