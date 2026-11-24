import type { TextareaHTMLAttributes } from "react";
import { FieldMessages } from "./FieldMessages";
import styles from "./Textarea.module.css";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  helperText?: string;
}

export function Textarea({
  className,
  error,
  helperText,
  id,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: TextareaProps) {
  const messageId = id ? `${id}-message` : undefined;
  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(" ") || undefined;
  const classNames = [styles.textarea, error && styles.error, className].filter(Boolean).join(" ");

  return (
    <>
      <textarea
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
