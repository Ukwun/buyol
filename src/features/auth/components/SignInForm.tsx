"use client";

import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, LogIn } from "lucide-react";
import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Alert } from "@/components/feedback";
import { Button, Card, CardBody } from "@/components/ui";
import { FormField, Input } from "@/components/forms";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import styles from "./AuthForm.module.css";
import { SocialAuthButtons } from "./SocialAuthButtons";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (!credential.user.emailVerified) {
        await signOut(auth);
        setError("Please verify your email address before signing in.");
        return;
      }

      const idToken = await credential.user.getIdToken();
      const syncResponse = await fetch("/api/auth/sync-user", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!syncResponse.ok) throw new Error("Unable to prepare your account.");

      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!sessionResponse.ok) throw new Error("Unable to create a secure session.");

      const redirectTo = getSafeRedirectPath(new URLSearchParams(window.location.search).get("redirect"));
      window.location.assign(redirectTo);
    } catch {
      setError("We could not sign you in. Check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={styles.card}>
      <CardBody>
        <div className={styles.header}>
          <h1>Welcome back.</h1>
          <p>Sign in to continue to your BUYOL account.</p>
        </div>
        {error ? <Alert variant="error" icon={<LockKeyhole size={18} />}>{error}</Alert> : null}
        <form className={styles.form} onSubmit={submit} noValidate>
          <FormField controlId="sign-in-email" label="Email address" required>
            <Input id="sign-in-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </FormField>
          <FormField controlId="sign-in-password" label="Password" required>
            <div className={styles.passwordField}>
              <Input id="sign-in-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button className={styles.togglePassword} type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </FormField>
          <Button type="submit" size="large" loading={busy} startIcon={<LogIn size={18} aria-hidden="true" />}>Sign in</Button>
        </form>
        <SocialAuthButtons />
        <p className={styles.footer}><Link className={styles.link} href="/reset-password">Forgot your password?</Link><br />Don&apos;t have an account? <Link className={styles.link} href="/sign-up">Create one</Link></p>
      </CardBody>
    </Card>
  );
}
