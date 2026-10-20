/**
 * Line icons of the interface (24 × 24 grid, stroke = currentColor), decorative only: the
 * accessible name always comes from a visible label or an aria-label (UX: no icon-only
 * meaning). Paths from Lucide (ISC licence, https://lucide.dev): rotate-ccw, check, x, info,
 * triangle-alert; "view-top" and "view-front" are the design system's own glyphs
 * (docs/design/ui/maquettes/US-004.html).
 */
import { cx } from "./cx";
import styles from "./Icon.module.css";

const PATHS = {
  "rotate-ccw": ["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5"],
  "view-top": [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    "M3 9h18",
  ],
  "view-front": ["M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"],
  check: ["M20 6 9 17l-5-5"],
  x: ["M18 6 6 18", "M6 6l12 12"],
  info: ["M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z", "M12 16v-4", "M12 8h.01"],
  "alert-triangle": [
    "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
    "M12 9v4",
    "M12 17h.01",
  ],
} as const;

export type IconName = keyof typeof PATHS;

export interface IconProps {
  readonly name: IconName;
  /** 16, 20 (default) or 24 px. */
  readonly size?: "sm" | "md" | "lg";
  readonly className?: string | undefined;
}

export function Icon({ name, size = "md", className }: IconProps) {
  return (
    <svg
      className={cx(styles.icon, styles[size], className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      data-icon={name}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
