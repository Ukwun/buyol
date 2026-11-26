"use client";

import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, UserPlus } from "lucide-react";
import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { Alert } from "@/components/feedback";
import { Button, Card, CardBody } from "@/components/ui";
import { FormField, Input } from "@/components/forms";
import { getFirebaseAuth } from "@/lib/firebase/client";
import styles from "./AuthForm.module.css";
import { SocialAuthButtons } from "./SocialAuthButtons";

export function SignUpForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);

    try {
      const auth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(credential.user);
      const idToken = await credential.user.getIdToken();
      const response = await fetch("/api/auth/sync-user", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken, displayName, phoneNumber }),
      });
      if (!response.ok) throw new Error("Unable to create your account profile.");
      await signOut(auth);
      setComplete(true);
    } catch {
      setError("We could not create your account. Check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (complete) {
    return <Card className={styles.card}><CardBody><Alert variant="success" icon={<CheckCircle2 size={18} />} title="Check your inbox">Your account was created. Verify your email address, then sign in to continue.</Alert><p className={styles.footer}><Link className={styles.link} href="/sign-in">Go to sign in</Link></p></CardBody></Card>;
  }

  return (
    <Card className={styles.card}>
      <CardBody>
        <div className={styles.header}><h1>Create your account.</h1><p>Join the global BUYOL marketplace.</p></div>
        {error ? <Alert variant="error">{error}</Alert> : null}
        <form className={styles.form} onSubmit={submit}>
          <FormField controlId="sign-up-name" label="Your name" required><Input id="sign-up-name" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required /></FormField>
          <FormField controlId="sign-up-email" label="Email address" required><Input id="sign-up-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></FormField>
          <FormField controlId="sign-up-phone" label="Phone number" required><Input id="sign-up-phone" type="tel" autoComplete="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} required /></FormField>
          <FormField controlId="sign-up-password" label="Password" description="Use at least 8 characters." required>
            <div className={styles.passwordField}><Input id="sign-up-password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /><button className={styles.togglePassword} type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></div>
          </FormField>
          <FormField controlId="sign-up-confirm-password" label="Confirm password" required><Input id="sign-up-confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></FormField>
          <Button type="submit" size="large" loading={busy} startIcon={<UserPlus size={18} aria-hidden="true" />}>Create account</Button>
        </form>
        <SocialAuthButtons />
        <p className={styles.footer}>Already have an account? <Link className={styles.link} href="/sign-in">Sign in</Link></p>
      </CardBody>
    </Card>
  );
}
