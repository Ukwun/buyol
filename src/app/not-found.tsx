import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/feedback";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <EmptyState
        icon={<SearchX size={24} />}
        title="This page could not be found."
        description="The page may have moved, or the address may be incorrect."
        action={<Link className={styles.link} href="/">Return to BUYOL</Link>}
      />
    </main>
  );
}
