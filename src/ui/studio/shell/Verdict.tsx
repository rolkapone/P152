/**
 * Verdict of the toolbar (design-system.md §9, UX US-005 §3.1): `role="status"` pill, icon +
 * text, never focusable, always visible. US-005 has the empty state only ("Nothing to check
 * yet"); the fit verdicts come with US-017.
 */
import { useTranslation } from "react-i18next";
import { Icon } from "../../components/Icon";
import { cx } from "../../components/cx";
import styles from "./Shell.module.css";

export function Verdict() {
  const { t } = useTranslation();
  return (
    <p role="status" className={cx(styles.verdict)}>
      <Icon name="circle-dashed" className={cx(styles.verdictIcon)} />
      {t("shell.verdict.empty")}
    </p>
  );
}
