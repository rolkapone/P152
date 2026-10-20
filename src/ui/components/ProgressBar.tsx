/**
 * Progress bar of the design system (maquette US-004 `.prog`) on React Aria `ProgressBar`
 * (`role="progressbar"`). Indeterminate when the progress is unknown: the fill slides, and
 * stays still under `prefers-reduced-motion`.
 */
import { ProgressBar as AriaProgressBar } from "react-aria-components";
import { cx } from "./cx";
import styles from "./ProgressBar.module.css";

export interface ProgressBarProps {
  /** Id of the visible text that names the bar. */
  readonly "aria-labelledby": string;
  /** 0–100; absent = indeterminate. */
  readonly value?: number;
}

export function ProgressBar({ value, ...props }: ProgressBarProps) {
  const indeterminate = value === undefined;
  return (
    <AriaProgressBar
      {...props}
      className={cx(styles.track)}
      {...(indeterminate ? { isIndeterminate: true } : { value })}
    >
      {({ percentage }) => (
        <span
          className={cx(styles.fill, indeterminate && styles.indeterminate)}
          style={indeterminate ? undefined : { width: `${percentage ?? 0}%` }}
        />
      )}
    </AriaProgressBar>
  );
}
