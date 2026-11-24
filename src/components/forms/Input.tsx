import type { InputHTMLAttributes } from "react";
import { FieldMessages } from "./FieldMessages";
import styles from "./Input.module.css";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
}

export function Input({
  className,
  error,
  helperText,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: InputProps) {
  const messageId = id ? `${id}-message` : undefined;
  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(" ") || undefined;
  const classNames = [styles.input, error && styles.error, className].filter(Boolean).join(" ");

  return (
    <>
      <input
        {...props}
        id={id}
        className={classNames}
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid ?? (error ? true : undefined)}
      />
      {messageId ? <FieldMessages id={messageId} error={error} helperText={helperText} /> : null}
    </>
  );
}
