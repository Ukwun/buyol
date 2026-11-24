import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Card.module.css";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export interface CardSectionProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className, interactive = false, ...props }: CardProps) {
  const classNames = [styles.card, interactive && styles.interactive, className]
    .filter(Boolean)
    .join(" ");

  return <div {...props} className={classNames}>{children}</div>;
}

export function CardHeader({ children, className }: CardSectionProps) {
  return <header className={[styles.header, className].filter(Boolean).join(" ")}>{children}</header>;
}

export function CardBody({ children, className }: CardSectionProps) {
  return <div className={[styles.body, className].filter(Boolean).join(" ")}>{children}</div>;
}

export function CardFooter({ children, className }: CardSectionProps) {
  return <footer className={[styles.footer, className].filter(Boolean).join(" ")}>{children}</footer>;
}
