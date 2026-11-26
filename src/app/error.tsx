"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import styles from "./error.module.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.error} role="alert">
      <div className={styles.icon}><AlertTriangle size={28} aria-hidden="true" /></div>
      <h1>Something went wrong.</h1>
      <p>We could not load this part of BUYLO. Please try again.</p>
      <Button variant="primary" onClick={reset}>Try again</Button>
    </main>
  );
}
