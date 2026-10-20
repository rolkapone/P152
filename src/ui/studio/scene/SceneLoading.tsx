/** Loading screen of the 3D view (UX US-004 §2.2): no view bar until the scene is ready. */
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { ProgressBar } from "../../components/ProgressBar";
import { cx } from "../../components/cx";
import styles from "./SceneOverlay.module.css";

export function SceneLoading() {
  const { t } = useTranslation();
  const labelId = useId();
  return (
    <div className={cx(styles.screen)}>
      <div className={cx(styles.loading)}>
        <p id={labelId} className={cx(styles.loadingText)}>
          {t("scene.loading")}
        </p>
        <ProgressBar aria-labelledby={labelId} />
      </div>
    </div>
  );
}
