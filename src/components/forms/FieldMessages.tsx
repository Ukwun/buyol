import styles from "./FieldMessages.module.css";

export interface FieldMessagesProps {
  id: string;
  error?: string;
  helperText?: string;
}

export function FieldMessages({ id, error, helperText }: FieldMessagesProps) {
  if (!error && !helperText) return null;

  return (
    <div id={id} className={styles.messages}>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {!error && helperText ? <p className={styles.helper}>{helperText}</p> : null}
    </div>
  );
}
