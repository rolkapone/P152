/**
 * The 3D view follows the desk of the setup (US-006): each new `setup.desk` is resolved
 * against the catalog (`deskSpecOf`) and applied to `useSceneDesk`, the contract with the
 * renderer, which never reads the setup. Called once by app/ before the first render;
 * returns the unsubscribe function.
 */
import type { StoreApi } from "zustand";
import { deskSpecOf } from "../../core";
import type { SceneDeskState } from "./sceneDeskStore";
import { useSceneDesk } from "./sceneDeskStore";
import { useSetupDocument, type SetupDocumentState } from "../document/setupDocumentStore";

export function connectSceneDesk(
  document: StoreApi<SetupDocumentState> = useSetupDocument,
  scene: StoreApi<SceneDeskState> = useSceneDesk,
): () => void {
  const apply = ({ catalog, setup }: SetupDocumentState) => {
    if (catalog === null || setup === null) return;
    const desk = deskSpecOf(catalog, setup.desk);
    if (desk !== null) scene.getState().setDesk(desk);
  };
  apply(document.getState());
  return document.subscribe((state, previous) => {
    if (state.setup?.desk !== previous.setup?.desk) apply(state);
  });
}
