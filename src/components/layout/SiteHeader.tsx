import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { NavigationItem } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import styles from "./SiteHeader.module.css";

interface SiteHeaderProps {
  navigationItems: NavigationItem[];
}

export function SiteHeader({ navigationItems }: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.logo} href="/" aria-label={`${siteConfig.name} home`}>
          <span className={styles.logoMark}>B</span>
          <span>{siteConfig.name}</span>
        </Link>
        <nav className={styles.navigation} aria-label="Main navigation">
          {navigationItems.map((item) => (
            <Link className={styles.link} href={item.href} key={item.href}>
              {item.label}
              {item.href === "/sign-in" ? <ArrowUpRight size={16} aria-hidden="true" /> : null}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
