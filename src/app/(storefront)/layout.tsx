import type { ReactNode } from "react";
import { navigation } from "@/config/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout";
import styles from "./layout.module.css";

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <SiteHeader navigationItems={navigation.storefront} />
      <main className={styles.main}>{children}</main>
      <SiteFooter />
    </div>
  );
}
