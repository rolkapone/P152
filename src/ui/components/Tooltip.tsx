/**
 * Tooltip of the design system (design-system.md §9) on React Aria `TooltipTrigger`:
 * inverted bubble, shown after 400 ms of hover and on keyboard focus, closed by Escape
 * without moving the focus, linked to its trigger with `aria-describedby`.
 * The trigger must be a React Aria focusable component (Button, ToggleButton…).
 */
import type { ReactElement, ReactNode } from "react";
import {
  Tooltip as AriaTooltip,
  TooltipTrigger,
  type TooltipProps as AriaTooltipProps,
} from "react-aria-components";
import { cx } from "./cx";
import styles from "./Tooltip.module.css";

/** UX US-004 §2.3 and design-system.md §9. */
export const TOOLTIP_DELAY_MS = 400;
/** Gap between the trigger and the bubble (`--space-2`). */
const OFFSET_PX = 8;

export interface TooltipProps {
  readonly content: ReactNode;
  readonly children: ReactElement;
  /** "top start" / "top end" keep the bubble inside a narrow scene for the edge buttons. */
  readonly placement?: AriaTooltipProps["placement"];
}

export function Tooltip({ content, children, placement = "top" }: TooltipProps) {
  return (
    <TooltipTrigger delay={TOOLTIP_DELAY_MS} closeDelay={0}>
      {children}
      <AriaTooltip className={cx(styles.tooltip)} placement={placement} offset={OFFSET_PX}>
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
