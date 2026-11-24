import type { SelectHTMLAttributes } from "react";
import { FieldMessages } from "./FieldMessages";
import styles from "./Select.module.css";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  helperText?: string;
}

export function Select({
  children,
  className,
  error,
  helperText,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: SelectProps) {
  const messageId = id ? `${id}-message` : undefined;
  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(" ") || undefined;
  const classNames = [styles.select, error && styles.error, className].filter(Boolean).join(" ");

  return (
    <>
      <select
        {...props}
        id={id}
        className={classNames}
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid ?? (error ? true : undefined)}
      >
        {children}
      </select>
      {messageId ? <FieldMessages id={messageId} error={error} helperText={helperText} /> : null}
    </>
  );
}
