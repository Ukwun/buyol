import type { ReactElement, ReactNode } from "react";
import { cloneElement } from "react";
import styles from "./FormField.module.css";

interface FieldControlProps {
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export interface FormFieldProps {
  children: ReactElement<FieldControlProps>;
  controlId: string;
  label: ReactNode;
  description?: ReactNode;
  error?: string;
  required?: boolean;
}

export function FormField({
  children,
  controlId,
  label,
  description,
  error,
  required = false,
}: FormFieldProps) {
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [children.props["aria-describedby"], descriptionId, errorId]
    .filter(Boolean)
    .join(" ") || undefined;
  const control = cloneElement(children, {
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : children.props["aria-invalid"],
  });

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={controlId}>
        <span>{label}</span>
        {required ? <span className={styles.required}>*</span> : null}
      </label>
      {description ? <p className={styles.description} id={descriptionId}>{description}</p> : null}
      {control}
      {error ? <p className={styles.error} id={errorId} role="alert">{error}</p> : null}
    </div>
  );
}
