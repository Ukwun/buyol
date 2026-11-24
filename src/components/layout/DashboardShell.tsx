import type { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import type { NavigationItem } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import styles from "./DashboardShell.module.css";
import { SignOutButton } from "@/features/auth/components";

type DashboardArea = "account" | "vendor" | "admin";

interface DashboardShellProps {
  area: DashboardArea;
  title: string;
  navigationItems: NavigationItem[];
  children: ReactNode;
}

export function DashboardShell({ area, title, navigationItems, children }: DashboardShellProps) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.logo} href="/" aria-label={`${siteConfig.name} home`}>
          <span className={styles.logoMark}>B</span>
          <span>{siteConfig.name}</span>
        </Link>
        <div className={styles.areaLabel}>{area}</div>
        <nav className={styles.navigation} aria-label={`${title} navigation`}>
          {navigationItems.map((item) => (
            <Link className={styles.navLink} href={item.href} key={item.href}>
              <LayoutDashboard size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>
        <header className={styles.topbar}>
          <p className={styles.context}>{siteConfig.name}</p>
          <div className={styles.actions}>
            <p className={styles.area}>{title}</p>
            <SignOutButton />
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
