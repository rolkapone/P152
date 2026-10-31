/**
 * Error screens of the 3D view (UX US-004 §2.5, UX US-005 §2.4, UX-14 to UX-16): opaque card
 * in place of the scene, `role="alert"`, focus on the title when it appears, "Try again" runs
 * the start-up again. Three kinds, each with its own text, without the application name:
 * - `unsupported`: no WebGL 2 (browser or device); reloading would not help.
 * - `failed`: the 3D code or the renderer did not start: an incident, not an incompatibility
 *   (neutral text). From the 2nd consecutive failure, "Reload page" too: a chunk that failed
 *   to download stays failed in the page.
 * - `contextLost`: the graphics context was lost while running.
 */
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSceneView } from "../../../state";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { cx } from "../../components/cx";
import styles from "./SceneOverlay.module.css";

export type SceneErrorKind = "unsupported" | "failed" | "contextLost";

export interface SceneErrorProps {
  readonly kind: SceneErrorKind;
  /** Shows "Reload page" (failed kind only, from the 2nd consecutive failure). */
  readonly canReload?: boolean;
  /** Reloads the document (replaced in tests). */
  readonly reload?: () => void;
}

const TEXT = {
  unsupported: { title: "scene.error.unsupportedTitle", body: "scene.error.unsupportedBody" },
  failed: { title: "scene.error.failedTitle", body: "scene.error.failedBody" },
  contextLost: { title: "scene.error.contextLostTitle", body: "scene.error.contextLostBody" },
} as const;

const reloadDocument = () => window.location.reload();

export function SceneError({ kind, canReload = false, reload = reloadDocument }: SceneErrorProps) {
  const { t } = useTranslation();
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus();
  }, []);
  return (
    <div className={cx(styles.screen)}>
      <div role="alert" className={cx(styles.card)}>
        <span className={cx(styles.badge)}>
          <Icon name="alert-triangle" size="xl" />
        </span>
        <h2 ref={title} tabIndex={-1} className={cx(styles.cardTitle)}>
          {t(TEXT[kind].title)}
        </h2>
        <p className={cx(styles.cardBody)}>{t(TEXT[kind].body)}</p>
        <div className={cx(styles.cardActions)}>
          <Button variant="primary" onPress={() => useSceneView.getState().retry()}>
            {t("scene.error.retry")}
          </Button>
          {kind === "failed" && canReload && (
            <Button onPress={reload}>{t("scene.error.reload")}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
