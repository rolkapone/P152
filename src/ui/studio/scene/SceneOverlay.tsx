/**
 * Everything drawn over the 3D view (US-004 T5/T6), placed as `children` of `<Viewport>`:
 * loading screen, view bar + tip once ready, error screens, and the live region. Reads the
 * view state (`useSceneView`) and the local preferences (`usePreferences`); never three.js.
 */
import { useRef } from "react";
import { usePreferences, useSceneView } from "../../../state";
import { SceneAnnouncer } from "./SceneAnnouncer";
import { SceneError } from "./SceneError";
import { SceneLoading } from "./SceneLoading";
import { cx } from "../../components/cx";
import styles from "./SceneOverlay.module.css";
import { SceneTip } from "./SceneTip";
import { ViewToolbar } from "./ViewToolbar";

export function SceneOverlay() {
  const status = useSceneView((state) => state.status);
  const attempt = useSceneView((state) => state.attempt);
  const failures = useSceneView((state) => state.failures);
  const tipDismissed = usePreferences((state) => state.sceneTipDismissed);
  const resetButton = useRef<HTMLButtonElement>(null);

  const dismissTip = () => {
    // Focus first: the tip, which holds it, disappears right after (UX-11).
    resetButton.current?.focus();
    usePreferences.getState().dismissSceneTip();
  };

  return (
    <div className={cx(styles.overlay)}>
      {status === "loading" && <SceneLoading />}
      {status === "ready" && (
        <div className={cx(styles.dock)}>
          <ViewToolbar resetRef={resetButton} />
          {!tipDismissed && <SceneTip onDismiss={dismissTip} />}
        </div>
      )}
      {(status === "unsupported" || status === "failed" || status === "contextLost") && (
        // A new screen per attempt: the focus goes to the title again after "Try again".
        <SceneError key={attempt} kind={status} canReload={failures >= 2} />
      )}
      <SceneAnnouncer />
    </div>
  );
}
