/**
 * Empty state of a panel section (design-system.md §15, maquette US-005 `.empty`): a 44 px
 * badge with a decorative icon, a Headline and a Subheadline, in a grouped card. Text only:
 * no link nor button (UX-11: no dead control).
 */
import { Icon, type IconName } from "./Icon";
import { cx } from "./cx";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  readonly icon: IconName;
  readonly title: string;
  readonly description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className={cx(styles.empty)}>
      <span className={cx(styles.badge)}>
        <Icon name={icon} size="xl" />
      </span>
      <p className={cx(styles.title, "t-headline")}>{title}</p>
      <p className={cx(styles.description, "t-subheadline")}>{description}</p>
    </div>
  );
}
