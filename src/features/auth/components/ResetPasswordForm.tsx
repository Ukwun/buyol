"use client";

import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { Alert } from "@/components/feedback";
import { Button, Card, CardBody } from "@/components/ui";
import { FormField, Input } from "@/components/forms";
import { getFirebaseAuth } from "@/lib/firebase/client";
import styles from "./AuthForm.module.css";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
    } finally {
      setSubmitted(true);
      setBusy(false);
    }
  }

  return <Card className={styles.card}><CardBody><div className={styles.header}><h1>Reset your password.</h1><p>Enter your email and we&apos;ll send recovery instructions if an account exists.</p></div>{submitted ? <Alert variant="success" icon={<CheckCircle2 size={18} />} title="Check your inbox">If an account matches that email, recovery instructions are on the way.</Alert> : <form className={styles.form} onSubmit={submit} noValidate><FormField controlId="reset-email" label="Email address" required><Input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></FormField><Button type="submit" size="large" loading={busy} startIcon={<Mail size={18} aria-hidden="true" />}>Send instructions</Button></form>}<p className={styles.footer}><Link className={styles.link} href="/sign-in">Return to sign in</Link></p></CardBody></Card>;
}
