/**
 * Desk shown by the 3D view (US-006, ADR-APP-02 session family): the renderer reads it, the
 * application writes it. The setup document (developer, T4) stays the source of truth of the
 * chosen desk; this store is the contract with the renderer, which never reads the setup.
 *
 * - `desk`: null until the application sets one; the view then draws the studio desk
 *   (140 x 70, studio.json).
 * - `setDesk(desk)`: applies a desk (`DeskSpec` from `deskChoices(catalog)` or
 *   `deskSpec(type, setup.desk.params, setup.desk.materials)`). Returns false and changes
 *   nothing when it is the same desk (UX-4: clicking the active line does nothing). On a
 *   change the view regenerates the desk, its contact shadow and camera limits, and reframes
 *   it in the free zone, keeping the orientation of the view (UX-10, UX-11).
 * - `revision`: incremented by each change (one reframing per change, even in a burst).
 */
import { create } from "zustand";
import { sameDesk, type DeskSpec } from "../../core";

export interface SceneDeskState {
  readonly desk: DeskSpec | null;
  readonly revision: number;
  setDesk(desk: DeskSpec): boolean;
}

export function createSceneDeskStore() {
  return create<SceneDeskState>()((set, get) => ({
    desk: null,
    revision: 0,
    setDesk(desk) {
      const current = get().desk;
      if (current !== null && sameDesk(current, desk)) return false;
      set((state) => ({ desk, revision: state.revision + 1 }));
      return true;
    },
  }));
}

/** The application instance (one 3D view per page). */
export const useSceneDesk = createSceneDeskStore();
