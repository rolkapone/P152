/**
 * "The 3D view can't start" / "The 3D view stopped" (UX US-004 §2.5, UX-13): opaque card in
 * place of the scene, `role="alert"`, focus on the title when it appears, "Try again" runs
 * the start-up again. Neutral text, without the application name (PO decision 2026-10-19).
 */
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSceneView } from "../../../state";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { cx } from "../../components/cx";
import styles from "./SceneOverlay.module.css";

export type SceneErrorKind = "unsupported" | "contextLost";

export function SceneError({ kind }: { readonly kind: SceneErrorKind }) {
  const { t } = useTranslation();
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus();
  }, []);
  return (
    <div className={cx(styles.screen)}>
      <div role="alert" className={cx(styles.card)}>
        <span className={cx(styles.badge)}>
          <Icon name="alert-triangle" size="lg" />
        </span>
        <h2 ref={title} tabIndex={-1} className={cx(styles.cardTitle)}>
          {kind === "unsupported"
            ? t("scene.error.unsupportedTitle")
            : t("scene.error.contextLostTitle")}
        </h2>
        <p className={cx(styles.cardBody)}>
          {kind === "unsupported"
            ? t("scene.error.unsupportedBody")
            : t("scene.error.contextLostBody")}
        </p>
        <Button
          variant="primary"
          className={cx(styles.cardAction)}
          onPress={() => useSceneView.getState().retry()}
        >
          {t("scene.error.retry")}
        </Button>
      </div>
    </div>
  );
}
