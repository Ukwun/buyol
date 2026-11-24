import { Spinner } from "@/components/ui";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <main className={styles.loading} aria-label="Loading page">
      <Spinner size="large" />
    </main>
  );
}
