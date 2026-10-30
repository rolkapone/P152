/**
 * Right panel (design-system.md §15, UX US-005 §3.2): "Properties" then "Alerts", each a
 * `section` named by its `h2`, with their empty states until US-007 / US-017. The "Alerts"
 * title takes the focus from "Skip to alerts" (UX-4, US-005 T4), hence its id and tabindex.
 */
import { useTranslation } from "react-i18next";
import { EmptyState } from "../../components/EmptyState";
import { cx } from "../../components/cx";
import styles from "./Shell.module.css";

export const ALERTS_TITLE_ID = "inspector-alerts-title";
const PROPERTIES_TITLE_ID = "inspector-properties-title";

export function Inspector() {
  const { t } = useTranslation();
  return (
    <>
      <section className={cx(styles.section)} aria-labelledby={PROPERTIES_TITLE_ID}>
        <h2 id={PROPERTIES_TITLE_ID} className={cx(styles.groupTitle)}>
          {t("shell.inspector.properties")}
        </h2>
        <EmptyState
          icon="mouse-pointer"
          title={t("shell.inspector.propertiesEmptyTitle")}
          description={t("shell.inspector.propertiesEmptyBody")}
        />
      </section>
      <section className={cx(styles.section)} aria-labelledby={ALERTS_TITLE_ID}>
        <h2 id={ALERTS_TITLE_ID} className={cx(styles.groupTitle)} tabIndex={-1}>
          {t("shell.inspector.alerts")}
        </h2>
        <EmptyState
          icon="circle-dashed"
          title={t("shell.inspector.alertsEmptyTitle")}
          description={t("shell.inspector.alertsEmptyBody")}
        />
      </section>
    </>
  );
}
