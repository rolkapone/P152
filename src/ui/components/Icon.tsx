/**
 * Line icons of the interface (design-system.md §6): Lucide (ISC licence, package
 * `lucide-react`, https://lucide.dev), stroke `--icon-stroke`, `currentColor`, decorative only:
 * the accessible name always comes from a visible label or an aria-label (no icon-only
 * meaning). "view-top" and "view-front" are the design system's own glyphs
 * (docs/design/ui/maquettes/US-004.html).
 */
import {
  Box,
  Check,
  CircleDashed,
  Info,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { cx } from "./cx";
import styles from "./Icon.module.css";

const LUCIDE = {
  "alert-triangle": TriangleAlert,
  box: Box,
  check: Check,
  "circle-dashed": CircleDashed,
  info: Info,
  "mouse-pointer": MousePointer2,
  "panel-left-close": PanelLeftClose,
  "panel-left-open": PanelLeftOpen,
  "panel-right-close": PanelRightClose,
  "panel-right-open": PanelRightOpen,
  "rotate-ccw": RotateCcw,
  x: X,
} as const satisfies Record<string, LucideIcon>;

/** Glyphs of the design system (no Lucide equivalent), same 24 × 24 grid. */
const OWN_PATHS = {
  "view-top": [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    "M3 9h18",
  ],
  "view-front": ["M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"],
} as const;

export type IconName = keyof typeof LUCIDE | keyof typeof OWN_PATHS;

export interface IconProps {
  readonly name: IconName;
  /** `--icon-sm` 16, `--icon-md` 18 (default), `--icon-lg` 20 (toolbar), `--icon-xl` 24. */
  readonly size?: "sm" | "md" | "lg" | "xl";
  readonly className?: string | undefined;
}

export function Icon({ name, size = "md", className }: IconProps) {
  const common = {
    className: cx(styles.icon, styles[size], className),
    "aria-hidden": true,
    focusable: false,
    "data-icon": name,
  } as const;
  if (name === "view-top" || name === "view-front") {
    return (
      <svg {...common} viewBox="0 0 24 24">
        {OWN_PATHS[name].map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  }
  const Glyph = LUCIDE[name];
  return <Glyph {...common} />;
}
