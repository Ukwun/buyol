import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled,
  startIcon,
  endIcon,
  type = "button",
  ...props
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      {...props}
      className={classNames}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <Spinner size="small" label="Loading" /> : startIcon}
      <span>{children}</span>
      {!loading && endIcon}
    </button>
  );
}
