/**
 * Layout of the Studio shell (US-005, UX §2.2, ADR-APP-02 session family).
 *
 * - Wide window (≥ 1024 px CSS): docked panels, open by default, each collapsed or expanded
 *   independently; the choice is remembered in the display preferences (UX-6).
 * - Narrow window (< 1024 px, including 1366 × 768 at 200 % zoom): the panels are drawers,
 *   closed on load, one open at a time, never remembered open (UX-9).
 * - Free zone: the part of the 3D view that no docked panel nor the toolbar covers, in CSS
 *   pixels of the view. The UI measures it; the 3D view reads it when it frames the desk
 *   (load, Reset view, Top, Front, desk change: UX-8, graphics-engineer). It follows the
 *   panels open now.
 * - Dock zone (view bar and tip, UX §2.3 and UX-7): the docked panels the dock stays clear of.
 *   A panel that opens joins it (the dock never ends up under a panel); a panel that
 *   collapses leaves it unchanged (the dock does not move under the user's eyes); crossing
 *   1024 px recomputes it from the panels open then.
 */
import { create } from "zustand";
import { usePreferences } from "../preferences/preferencesStore";

export type PanelSide = "left" | "right";

/** Insets of the free zone inside the 3D view, and the size of the view, in CSS pixels. */
export interface FreeZone {
  readonly top: number;
  readonly left: number;
  readonly right: number;
  readonly width: number;
  readonly height: number;
}

/** Docked panels the dock (view bar, tip) is centred between. */
export interface DockZone {
  readonly left: boolean;
  readonly right: boolean;
}

export interface ShellLayoutState {
  /** Narrow window: drawers instead of docked panels. */
  readonly narrow: boolean;
  readonly leftOpen: boolean;
  readonly rightOpen: boolean;
  readonly freeZone: FreeZone;
  readonly dockZone: DockZone;
  /** app/ on start-up, then the UI when the window crosses 1024 px. */
  setNarrow(narrow: boolean): void;
  togglePanel(side: PanelSide): void;
  /** "Skip to alerts" opens the right panel before moving the focus there (UX-4). */
  openPanel(side: PanelSide): void;
  /** Escape in a drawer (UX-9). */
  closePanel(side: PanelSide): void;
  /** UI only: measured after each layout change. */
  setFreeZone(zone: FreeZone): void;
}

type Preferences = typeof usePreferences;

const OPEN = { left: "leftOpen", right: "rightOpen" } as const;
const COLLAPSED = { left: "sidebarCollapsed", right: "inspectorCollapsed" } as const;
const OTHER = { left: "right", right: "left" } as const;

export const EMPTY_FREE_ZONE: FreeZone = Object.freeze({
  top: 0,
  left: 0,
  right: 0,
  width: 0,
  height: 0,
});

const sameZone = (a: FreeZone, b: FreeZone) =>
  a.top === b.top &&
  a.left === b.left &&
  a.right === b.right &&
  a.width === b.width &&
  a.height === b.height;

export function createShellLayoutStore(preferences: Preferences = usePreferences) {
  const remembered = () => {
    const stored = preferences.getState();
    return { leftOpen: !stored.sidebarCollapsed, rightOpen: !stored.inspectorCollapsed };
  };
  return create<ShellLayoutState>()((set, get) => {
    const setOpen = (side: PanelSide, open: boolean) => {
      if (get()[OPEN[side]] === open) return;
      if (get().narrow) {
        // One drawer at a time; nothing remembered.
        set(open ? { [OPEN[side]]: true, [OPEN[OTHER[side]]]: false } : { [OPEN[side]]: false });
        return;
      }
      set((state) => ({
        [OPEN[side]]: open,
        dockZone: open ? { ...state.dockZone, [side]: true } : state.dockZone,
      }));
      preferences.getState().setPanelCollapsed(COLLAPSED[side], !open);
    };
    const wide = () => {
      const open = remembered();
      return { narrow: false, ...open, dockZone: { left: open.leftOpen, right: open.rightOpen } };
    };
    return {
      ...wide(),
      freeZone: EMPTY_FREE_ZONE,

      setNarrow(narrow) {
        set(
          narrow
            ? { narrow, leftOpen: false, rightOpen: false, dockZone: { left: false, right: false } }
            : wide(),
        );
      },
      togglePanel(side) {
        setOpen(side, !get()[OPEN[side]]);
      },
      openPanel(side) {
        setOpen(side, true);
      },
      closePanel(side) {
        setOpen(side, false);
      },
      setFreeZone(zone) {
        if (!sameZone(get().freeZone, zone)) set({ freeZone: Object.freeze({ ...zone }) });
      },
    };
  });
}

/** The application instance. */
export const useShellLayout = createShellLayoutStore();
