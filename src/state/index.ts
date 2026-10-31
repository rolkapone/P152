/** Public API of state/ (ADR-APP-02, ADR-APP-07). */
export {
  VIEW_SHORTCUTS,
  VIEW_STEPS,
  viewCommandForKey,
  type Direction,
  type KeyLike,
  type ViewCommand,
  type ViewName,
} from "./view/commands";
export {
  createSceneViewStore,
  useSceneView,
  type ActiveView,
  type SceneStatus,
  type SceneViewState,
  type ViewCommandResult,
  type ViewController,
  type ViewEvent,
  type ViewEventSource,
} from "./view/sceneViewStore";
export {
  createPreferencesStore,
  usePreferences,
  type PreferencesState,
} from "./preferences/preferencesStore";
export {
  createShellLayoutStore,
  EMPTY_FREE_ZONE,
  useShellLayout,
  type DockZone,
  type FreeZone,
  type PanelSide,
  type ShellLayoutState,
} from "./shell/shellLayoutStore";
export { createSceneDeskStore, useSceneDesk, type SceneDeskState } from "./desk/sceneDeskStore";
export { connectSceneDesk } from "./desk/connectSceneDesk";
export {
  createSetupDocumentStore,
  useSetupDocument,
  type SetupDocumentOptions,
  type SetupDocumentState,
} from "./document/setupDocumentStore";
