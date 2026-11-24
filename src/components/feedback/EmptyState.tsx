import { useId, type ReactNode } from "react";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  const titleId = useId();
  const classNames = [styles.emptyState, className].filter(Boolean).join(" ");

  return (
    <section className={classNames} aria-labelledby={titleId}>
      {icon ? <div className={styles.icon} aria-hidden="true">{icon}</div> : null}
      <h2 className={styles.title} id={titleId}>{title}</h2>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </section>
  );
}
