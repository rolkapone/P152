/**
 * "Skip to 3D view" and "Skip to alerts" (UX US-005 §4, UX-4): the first two Tab stops,
 * shown only while focused (opaque pills above everything). The first focuses the 3D view
 * (or what stands in its place: an error title, else the main region); the second opens the
 * right panel if needed, then focuses the "Alerts" title.
 */
import type { MouseEvent } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { useShellLayout } from "../../../state";
import { cx } from "../../components/cx";
import { ALERTS_TITLE_ID } from "./Inspector";
import styles from "./Shell.module.css";

export const SCENE_ID = "studio-scene";

function focusScene() {
  const main = document.getElementById(SCENE_ID);
  if (!main) return;
  const target =
    main.querySelector<HTMLElement>('[data-scene-status][tabindex="0"]') ??
    main.querySelector<HTMLElement>('h2[tabindex="-1"]') ??
    main;
  target.focus();
}

function focusAlerts() {
  flushSync(() => useShellLayout.getState().openPanel("right"));
  document.getElementById(ALERTS_TITLE_ID)?.focus();
}

export function SkipLinks() {
  const { t } = useTranslation();
  const go = (action: () => void) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    action();
  };
  return (
    <div className={cx(styles.skipLinks)}>
      <a className={cx(styles.skip)} href={`#${SCENE_ID}`} onClick={go(focusScene)}>
        {t("shell.skip.scene")}
      </a>
      <a className={cx(styles.skip)} href={`#${ALERTS_TITLE_ID}`} onClick={go(focusAlerts)}>
        {t("shell.skip.alerts")}
      </a>
    </div>
  );
}
