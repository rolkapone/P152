/**
 * Session state of the 3D view (US-004, ADR-APP-02 `sessionStore` family): status of the
 * renderer, active view of the view bar, last view event for announcements, and the entry
 * points that the UI calls (view bar, keyboard). Never persisted, never in the history.
 *
 * The renderer registers a `ViewController` (render/scene/ViewControls.tsx); the UI never
 * touches three.js. Without a controller (scene not ready) commands are ignored.
 */
import { create } from "zustand";
import type { ViewCommand, ViewName } from "./commands";

/**
 * - `loading`: WebGL 2 check, code of the 3D view and first frame in progress.
 * - `ready`: the desk is displayed.
 * - `unsupported`: no WebGL 2 ("The 3D view can't start").
 * - `failed`: the 3D code could not load or start (same screen, "Try again").
 * - `contextLost`: the GPU context was lost while in use ("The 3D view stopped").
 */
export type SceneStatus = "loading" | "ready" | "unsupported" | "failed" | "contextLost";

/** Toggle state of the view bar: Reset view is not a toggle (UX §2.3). */
export type ActiveView = Exclude<ViewName, "reset"> | null;

export type ViewEventSource = "toolbar" | "keyboard";

/** Last command run, for the polite announcements of the UI (one per change of `seq`). */
export interface ViewEvent {
  readonly seq: number;
  readonly command: ViewCommand;
  readonly source: ViewEventSource;
  /** A limit (zoom, angle, movement) stopped the step. */
  readonly limitReached: boolean;
}

export interface ViewCommandResult {
  readonly limitReached: boolean;
}

/** Implemented by the renderer. */
export interface ViewController {
  run(command: ViewCommand): ViewCommandResult;
}

export interface SceneViewState {
  readonly status: SceneStatus;
  readonly activeView: ActiveView;
  readonly lastEvent: ViewEvent | null;
  /** Incremented by `retry()`: the view remounts a fresh renderer. */
  readonly attempt: number;
  /** Size of the displayed desk, for "3D view ready. Desk 140 by 70 cm." */
  readonly deskSizeMm: { readonly width: number; readonly depth: number } | null;

  /** View bar and keyboard. Returns false when the view is not ready. */
  runViewCommand(command: ViewCommand, source: ViewEventSource): boolean;
  /** Shortcut for the view bar buttons. */
  showView(view: ViewName): boolean;
  /** "Try again" of the error screens. */
  retry(): void;

  // Renderer side (render/ only).
  attachController(controller: ViewController): () => void;
  /** A drag or a wheel zoom changed the view: no view button stays pressed. */
  notifyPointerViewChange(): void;
  setStatus(status: SceneStatus): void;
  setDeskSize(size: { width: number; depth: number }): void;
}

function activeViewAfter(command: ViewCommand): ActiveView {
  return command.type === "view" && command.view !== "reset" ? command.view : null;
}

export function createSceneViewStore() {
  let controller: ViewController | null = null;
  let seq = 0;
  return create<SceneViewState>()((set, get) => ({
    status: "loading",
    activeView: null,
    lastEvent: null,
    attempt: 0,
    deskSizeMm: null,

    runViewCommand(command, source) {
      if (controller === null || get().status !== "ready") return false;
      const { limitReached } = controller.run(command);
      seq += 1;
      set({
        activeView: activeViewAfter(command),
        lastEvent: { seq, command, source, limitReached },
      });
      return true;
    },
    showView(view) {
      return get().runViewCommand({ type: "view", view }, "toolbar");
    },
    retry() {
      controller = null;
      set((state) => ({ status: "loading", activeView: null, attempt: state.attempt + 1 }));
    },

    attachController(next) {
      controller = next;
      return () => {
        if (controller === next) controller = null;
      };
    },
    notifyPointerViewChange() {
      if (get().activeView !== null) set({ activeView: null });
    },
    setStatus(status) {
      if (get().status !== status) set({ status });
    },
    setDeskSize(size) {
      const current = get().deskSizeMm;
      if (current?.width !== size.width || current.depth !== size.depth) {
        set({ deskSizeMm: { width: size.width, depth: size.depth } });
      }
    },
  }));
}

/** The application instance (one 3D view per page). */
export const useSceneView = createSceneViewStore();
