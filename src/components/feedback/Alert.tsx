import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Alert.module.css";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  icon?: ReactNode;
  title?: ReactNode;
}

export function Alert({
  children,
  className,
  icon,
  title,
  variant = "info",
  ...props
}: AlertProps) {
  const classNames = [styles.alert, styles[variant], className].filter(Boolean).join(" ");
  const role = variant === "error" ? "alert" : "status";

  return (
    <div {...props} className={classNames} role={role}>
      {icon ? <span className={styles.icon} aria-hidden="true">{icon}</span> : null}
      <div className={styles.content}>
        {title ? <strong className={styles.title}>{title}</strong> : null}
        {children ? <div className={styles.message}>{children}</div> : null}
      </div>
    </div>
  );
}
