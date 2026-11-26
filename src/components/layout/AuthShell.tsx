import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import styles from "./AuthShell.module.css";

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.logo} href="/" aria-label={`${siteConfig.name} home`}>
          <Image className={styles.logoImage} src="/brand/buyol-logo.png" alt="" width={40} height={40} />
          <span>{siteConfig.name}</span>
        </Link>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
