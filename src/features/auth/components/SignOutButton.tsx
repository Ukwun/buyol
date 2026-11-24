"use client";

import { LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST", headers: { "content-type": "application/json" } });
      await signOut(getFirebaseAuth());
    } finally {
      router.push("/sign-in");
    }
  }

  return <Button variant="ghost" size="small" onClick={handleSignOut} startIcon={<LogOut size={16} aria-hidden="true" />}>Sign out</Button>;
}
