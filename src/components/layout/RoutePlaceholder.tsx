import type { ReactNode } from "react";
import { Construction } from "lucide-react";
import { EmptyState } from "@/components/feedback";
import styles from "./RoutePlaceholder.module.css";

interface RoutePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  icon?: ReactNode;
}

export function RoutePlaceholder({ eyebrow, title, description, icon }: RoutePlaceholderProps) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <EmptyState
        icon={icon ?? <Construction size={24} />}
        title={title}
        description={description}
      />
    </div>
  );
}
