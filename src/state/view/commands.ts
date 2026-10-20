/**
 * View commands of the 3D scene (US-004): what the view bar, the keyboard and, later, the
 * touch gestures ask for. Pure data and functions, no React, no three.js: the renderer
 * turns a command into a camera move (render/scene/ViewControls.tsx).
 */
import type { ViewName } from "../../core";

export type { ViewName };
export type Direction = "left" | "right" | "up" | "down";

export type ViewCommand =
  | { readonly type: "view"; readonly view: ViewName }
  | { readonly type: "turn"; readonly direction: Direction }
  | { readonly type: "zoom"; readonly direction: "in" | "out" }
  | { readonly type: "move"; readonly direction: Direction };

/** Keyboard steps (docs/design/ux/stories/US-004.md §5). */
export const VIEW_STEPS = {
  /** Left / right arrows. */
  turnDeg: 15,
  /** Up / down arrows. */
  tiltDeg: 10,
  /** + / -: the distance is multiplied or divided by (1 - 10 %). */
  zoomRatio: 0.1,
  /** Shift + arrows, as a fraction of the desk width. */
  moveDeskWidthRatio: 0.05,
} as const;

/** Keys 0 / 1 / 2 (PO decision 2026-10-19: only while the 3D view has the focus). */
export const VIEW_SHORTCUTS: Readonly<Record<string, ViewName>> = {
  "0": "reset",
  "1": "top",
  "2": "front",
};

const ARROWS: Readonly<Record<string, Direction>> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

export interface KeyLike {
  readonly key: string;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
}

/**
 * Command for a key pressed while the 3D view has the focus, or null (the key is then left
 * to the browser: Tab, browser shortcuts...). Alt is reserved for US-013 (Alt+arrows will
 * drive the view once arrows move the selected object); Ctrl / Cmd never trigger a command.
 */
export function viewCommandForKey(event: KeyLike): ViewCommand | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null;
  const arrow = Object.hasOwn(ARROWS, event.key) ? ARROWS[event.key] : undefined;
  if (arrow !== undefined) {
    return { type: event.shiftKey ? "move" : "turn", direction: arrow };
  }
  switch (event.key) {
    case "+":
    case "=":
      return { type: "zoom", direction: "in" };
    case "-":
    case "_":
      return { type: "zoom", direction: "out" };
  }
  const view = Object.hasOwn(VIEW_SHORTCUTS, event.key) ? VIEW_SHORTCUTS[event.key] : undefined;
  // Shift is accepted: digits need it on some layouts (AZERTY).
  return view === undefined ? null : { type: "view", view };
}
