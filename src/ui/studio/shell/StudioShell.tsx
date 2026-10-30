/**
 * Window of the Studio (design-system.md §15, maquette US-005, wireframe W2): unified toolbar
 * (panel toggles, "Deskfit" wordmark, document name, verdict), sidebar on the left,
 * inspector on the right, and the 3D view (`children`) filling the whole frame beneath them.
 * DOM order = reading and Tab order: header, left aside, main, right aside. Undo / Redo,
 * File, Help and "Saved" are not rendered until their feature exists (PO decision 29).
 *
 * Free zone (UX §2.3): the dock of the 3D view is centred between the docked panels. It
 * follows the panels open on load and does not move when one is collapsed afterwards.
 */
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useShellLayout } from "../../../state";
import { cx } from "../../components/cx";
import { Inspector } from "./Inspector";
import { PanelToggle } from "./PanelToggle";
import styles from "./Shell.module.css";
import { Sidebar } from "./Sidebar";
import { Verdict } from "./Verdict";

export const SIDEBAR_ID = "studio-sidebar";
export const INSPECTOR_ID = "studio-inspector";

export interface StudioShellProps {
  /** The 3D view and its overlays. */
  readonly children: ReactNode;
}

export function StudioShell({ children }: StudioShellProps) {
  const { t } = useTranslation();
  const leftOpen = useShellLayout((state) => state.leftOpen);
  const rightOpen = useShellLayout((state) => state.rightOpen);
  const [freeZone] = useState(() => ({ left: leftOpen, right: rightOpen }));
  const documentName = t("shell.documentName");

  return (
    <div className={cx(styles.app)}>
      <header className={cx(styles.toolbar, "material-regular")}>
        <PanelToggle side="left" controls={SIDEBAR_ID} />
        <h1 className={cx(styles.brand)}>{t("app.name")}</h1>
        <span className={cx(styles.separator)} aria-hidden="true" />
        <p className={cx(styles.documentName)} title={documentName}>
          {documentName}
        </p>
        <Verdict />
        <PanelToggle side="right" controls={INSPECTOR_ID} />
      </header>
      <aside
        id={SIDEBAR_ID}
        className={cx(styles.pane, styles.paneLeft, "material-regular")}
        aria-label={t("shell.sidebar.label")}
        data-open={leftOpen}
        inert={!leftOpen}
      >
        <Sidebar />
      </aside>
      <main
        className={cx(styles.scene)}
        data-free-left={freeZone.left ? "panel" : "none"}
        data-free-right={freeZone.right ? "panel" : "none"}
      >
        {children}
      </main>
      <aside
        id={INSPECTOR_ID}
        className={cx(styles.pane, styles.paneRight, "material-regular")}
        aria-label={t("shell.inspector.label")}
        data-open={rightOpen}
        inert={!rightOpen}
      >
        <Inspector />
      </aside>
    </div>
  );
}
