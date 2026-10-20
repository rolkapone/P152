/**
 * First-visit tip of the 3D view (UX US-004 §2.1, UX-11): glass band above the view bar.
 * "Got it" and the X ("Hide tip") have the same effect: hidden for good.
 */
import { useTranslation } from "react-i18next";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";
import { cx } from "../../components/cx";
import styles from "./SceneOverlay.module.css";

export function SceneTip({ onDismiss }: { readonly onDismiss: () => void }) {
  const { t } = useTranslation();
  return (
    <div className={cx("glass", styles.tip)}>
      <Icon name="info" className={cx(styles.tipIcon)} />
      <p className={cx(styles.tipText)}>{t("scene.tip.text")}</p>
      <div className={cx(styles.tipActions)}>
        <Button size="sm" onPress={onDismiss}>
          {t("scene.tip.dismiss")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          iconOnly
          aria-label={t("scene.tip.hide")}
          onPress={onDismiss}
        >
          <Icon name="x" size="sm" />
        </Button>
      </div>
    </div>
  );
}
