/**
 * The "Desk" tab wired to the setup document (US-006): the lines come from the catalog of the
 * session, the active line from `setup.desk`, and choosing a line runs the `setDesk` command
 * (`useSetupDocument.chooseDesk`); the 3D view follows the setup (`connectSceneDesk`) and the
 * live region of the scene announces the change (SceneAnnouncer).
 */
import { useMemo } from "react";
import { deskChoiceIdOf, deskChoices } from "../../../core";
import { useSetupDocument } from "../../../state";
import { DeskPanel } from "./DeskPanel";

const chooseDesk = (choiceId: string) => {
  useSetupDocument.getState().chooseDesk(choiceId);
};

export function DeskTab() {
  const catalog = useSetupDocument((state) => state.catalog);
  const desk = useSetupDocument((state) => state.setup?.desk ?? null);
  const failed = useSetupDocument((state) => state.failed);
  const choices = useMemo(() => (catalog === null ? [] : deskChoices(catalog)), [catalog]);
  const value = catalog === null || desk === null ? null : deskChoiceIdOf(catalog, desk);
  return <DeskPanel choices={failed ? null : choices} value={value} onChange={chooseDesk} />;
}
