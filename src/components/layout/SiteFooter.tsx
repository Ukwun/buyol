import { siteConfig } from "@/config/site";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>{siteConfig.name}</span>
        <span>{siteConfig.metadata.description}</span>
      </div>
    </footer>
  );
}
