import type { HTMLAttributes } from "react";
import styles from "./Spinner.module.css";

export type SpinnerSize = "small" | "medium" | "large";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
  label?: string;
}

export function Spinner({ label = "Loading", size = "medium", className, ...props }: SpinnerProps) {
  const classNames = [styles.spinner, styles[size], className].filter(Boolean).join(" ");

  return (
    <span
      {...props}
      className={classNames}
      role="status"
      aria-label={label}
      aria-live="polite"
    />
  );
}
