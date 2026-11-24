import type { HTMLAttributes } from "react";
import styles from "./Badge.module.css";

export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ children, className, variant = "neutral", ...props }: BadgeProps) {
  const classNames = [styles.badge, styles[variant], className].filter(Boolean).join(" ");

  return <span {...props} className={classNames}>{children}</span>;
}
