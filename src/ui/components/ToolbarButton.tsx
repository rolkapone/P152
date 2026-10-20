/**
 * Pill buttons of the floating scene bar (design-system.md §14, maquette US-004 `.vb`):
 * 36 px high, icon 20 px + visible label 14 px / 500 (the label is the accessible name).
 * - `ToolbarButton`: action (Reset view), no pressed state.
 * - `ToolbarToggleButton`: view toggle (Top, Front) on React Aria `ToggleButton`
 *   (`aria-pressed`); pressed = accent-subtle fill + 2 px accent contour + check icon in
 *   place of the view icon (same slot: no layout shift), never the colour alone.
 */
import type { Ref } from "react";
import {
  Button as AriaButton,
  ToggleButton as AriaToggleButton,
  type ButtonProps as AriaButtonProps,
  type ToggleButtonProps as AriaToggleButtonProps,
} from "react-aria-components";
import { Icon, type IconName } from "./Icon";
import { cx } from "./cx";
import styles from "./ToolbarButton.module.css";

interface CommonProps {
  readonly icon: IconName;
  readonly label: string;
  readonly ref?: Ref<HTMLButtonElement> | undefined;
}

export type ToolbarButtonProps = CommonProps &
  Omit<AriaButtonProps, "className" | "style" | "children">;

export function ToolbarButton({ icon, label, ...props }: ToolbarButtonProps) {
  return (
    <AriaButton {...props} className={cx(styles.button)}>
      <Icon name={icon} />
      <span>{label}</span>
    </AriaButton>
  );
}

export type ToolbarToggleButtonProps = CommonProps &
  Omit<AriaToggleButtonProps, "className" | "style" | "children">;

export function ToolbarToggleButton({ icon, label, ...props }: ToolbarToggleButtonProps) {
  return (
    <AriaToggleButton {...props} className={cx(styles.button)}>
      {({ isSelected }) => (
        <>
          <Icon name={isSelected ? "check" : icon} />
          <span>{label}</span>
        </>
      )}
    </AriaToggleButton>
  );
}
