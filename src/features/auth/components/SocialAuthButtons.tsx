"use client";

import { useState } from "react";
import { FacebookAuthProvider, GoogleAuthProvider, OAuthProvider, signInWithPopup } from "firebase/auth";
import { Alert } from "@/components/feedback";
import { Button } from "@/components/ui";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { getFirebaseAuth } from "@/lib/firebase/client";
import styles from "./AuthForm.module.css";

type SocialProvider = "google" | "facebook" | "apple";

export function SocialAuthButtons() {
  const [busy, setBusy] = useState<SocialProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function authenticate(providerName: SocialProvider) {
    setBusy(providerName);
    setError(null);
    try {
      const provider = providerName === "google" ? new GoogleAuthProvider() : providerName === "facebook" ? new FacebookAuthProvider() : new OAuthProvider("apple.com");
      const credential = await signInWithPopup(getFirebaseAuth(), provider);
      if (!credential.user.email || !credential.user.emailVerified) throw new Error("This provider did not return a verified email address.");
      const idToken = await credential.user.getIdToken();
      const syncResponse = await fetch("/api/auth/sync-user", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken, displayName: credential.user.displayName ?? undefined }) });
      if (!syncResponse.ok) throw new Error("Unable to prepare your account.");
      const sessionResponse = await fetch("/api/auth/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken }) });
      if (!sessionResponse.ok) throw new Error("Unable to create a secure session.");
      window.location.assign(getSafeRedirectPath(new URLSearchParams(window.location.search).get("redirect")));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "This sign-in provider is unavailable.");
    } finally {
      setBusy(null);
    }
  }

  return <div className={styles.social}><div className={styles.divider}><span>or continue with</span></div>{error ? <Alert variant="error">{error}</Alert> : null}<div className={styles.socialGrid}><Button type="button" variant="outline" loading={busy === "google"} disabled={busy !== null} onClick={() => void authenticate("google")}>Google</Button><Button type="button" variant="outline" loading={busy === "facebook"} disabled={busy !== null} onClick={() => void authenticate("facebook")}>Facebook</Button><Button type="button" variant="outline" loading={busy === "apple"} disabled={busy !== null} onClick={() => void authenticate("apple")}>Apple</Button></div></div>;
}
