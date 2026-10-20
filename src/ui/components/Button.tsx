/**
 * Button of the design system (design-system.md §7) on React Aria `Button`: press, keyboard,
 * focus-visible ring (tokens.css `[data-focus-visible]`), never disabled by default.
 */
import type { Ref } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import styles from "./Button.module.css";
import { cx } from "./cx";

export interface ButtonProps extends Omit<AriaButtonProps, "className" | "style"> {
  readonly variant?: "primary" | "secondary" | "ghost";
  /** md = 36 px (`--control-md`), sm = 32 px (`--control-sm`). */
  readonly size?: "sm" | "md";
  /** Square button with an icon only: an `aria-label` is then required. */
  readonly iconOnly?: boolean;
  readonly className?: string | undefined;
  readonly ref?: Ref<HTMLButtonElement> | undefined;
}

export function Button({
  variant = "secondary",
  size = "md",
  iconOnly = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      {...props}
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        iconOnly && styles.icon,
        className,
      )}
    />
  );
}
