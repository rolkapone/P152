/**
 * Layout of the Studio shell (US-005, ADR-APP-02 session family): which side panel is open.
 * Both are open on load; the toolbar toggles collapse and expand them (UX §2.2). Remembering
 * the choice and the narrow-screen drawers come with US-005 T4.
 */
import { create } from "zustand";

export type PanelSide = "left" | "right";

export interface ShellLayoutState {
  readonly leftOpen: boolean;
  readonly rightOpen: boolean;
  togglePanel(side: PanelSide): void;
  /** "Skip to alerts" opens the right panel before moving the focus there (UX-4). */
  openPanel(side: PanelSide): void;
}

const KEY = { left: "leftOpen", right: "rightOpen" } as const;

export function createShellLayoutStore() {
  return create<ShellLayoutState>()((set) => ({
    leftOpen: true,
    rightOpen: true,
    togglePanel(side) {
      set((state) => ({ [KEY[side]]: !state[KEY[side]] }));
    },
    openPanel(side) {
      set({ [KEY[side]]: true });
    },
  }));
}

/** The application instance. */
export const useShellLayout = createShellLayoutStore();
