/**
 * Window of the Studio (design-system.md §15, maquette US-005, wireframe W2): skip links,
 * unified toolbar (panel toggles, "Deskfit" wordmark, document name, verdict), sidebar on the
 * left, inspector on the right, and the 3D view (`children`) filling the whole frame beneath
 * them. DOM order = reading and Tab order (UX-5 as adapted by the PO: both toggles in the
 * toolbar): skip links, toggles, left panel, 3D view, right panel. Undo / Redo, File, Help
 * and "Saved" are not rendered until their feature exists (PO decision 29).
 *
 * - Panels: docked from 1024 px (remembered), drawers below (closed on load, one at a time,
 *   Escape closes and gives the focus back to the toggle): see `useShellLayout`.
 * - Free zone: measured here and published in `useShellLayout` for the camera framing; the
 *   dock follows `dockZone` (a panel that opens joins it; one that collapses does not move
 *   the dock, UX-7; crossing 1024 px recomputes it).
 */
import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useShellLayout, type PanelSide } from "../../../state";
import { cx } from "../../components/cx";
import { Inspector } from "./Inspector";
import { watchNarrowWindow } from "./layout";
import { PanelToggle, toggleId } from "./PanelToggle";
import styles from "./Shell.module.css";
import { Sidebar } from "./Sidebar";
import { SCENE_ID, SkipLinks } from "./SkipLinks";
import { Verdict } from "./Verdict";

export const SIDEBAR_ID = "studio-sidebar";
export const INSPECTOR_ID = "studio-inspector";

export interface StudioShellProps {
  /** The 3D view and its overlays. */
  readonly children: ReactNode;
}

/** Escape in a drawer closes it and gives the focus back to its toggle (UX-9). */
function closeDrawerOnEscape(side: PanelSide) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !useShellLayout.getState().narrow) return;
    useShellLayout.getState().closePanel(side);
    document.getElementById(toggleId(side))?.focus();
    event.stopPropagation();
  };
}

export function StudioShell({ children }: StudioShellProps) {
  const { t } = useTranslation();
  const narrow = useShellLayout((state) => state.narrow);
  const leftOpen = useShellLayout((state) => state.leftOpen);
  const rightOpen = useShellLayout((state) => state.rightOpen);
  const dockZone = useShellLayout((state) => state.dockZone);
  const documentName = t("shell.documentName");
  const header = useRef<HTMLElement>(null);
  const left = useRef<HTMLElement>(null);
  const main = useRef<HTMLElement>(null);
  const right = useRef<HTMLElement>(null);

  useEffect(() => watchNarrowWindow((next) => useShellLayout.getState().setNarrow(next)), []);

  // Free zone in CSS pixels of the 3D view, for the camera framing (graphics-engineer, UX-8).
  useLayoutEffect(() => {
    const measure = () => {
      const docked = !useShellLayout.getState().narrow;
      useShellLayout.getState().setFreeZone({
        top: header.current?.offsetHeight ?? 0,
        left: docked && leftOpen ? (left.current?.offsetWidth ?? 0) : 0,
        right: docked && rightOpen ? (right.current?.offsetWidth ?? 0) : 0,
        width: main.current?.clientWidth ?? 0,
        height: main.current?.clientHeight ?? 0,
      });
    };
    measure();
    if (typeof ResizeObserver !== "function" || !main.current) return;
    const observer = new ResizeObserver(measure);
    observer.observe(main.current);
    if (header.current) observer.observe(header.current);
    return () => observer.disconnect();
  }, [narrow, leftOpen, rightOpen]);

  return (
    <div className={cx(styles.app)} data-layout={narrow ? "narrow" : "wide"}>
      <SkipLinks />
      <header ref={header} className={cx(styles.toolbar, "material-regular")}>
        <PanelToggle side="left" controls={SIDEBAR_ID} />
        <h1 className={cx(styles.brand)}>{t("app.name")}</h1>
        <span className={cx(styles.separator)} aria-hidden="true" />
        <p className={cx(styles.documentName)} title={documentName}>
          {documentName}
        </p>
        <Verdict />
        <PanelToggle side="right" controls={INSPECTOR_ID} />
      </header>
      {/* Escape only closes a drawer that holds the focus: no action of its own. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <aside
        ref={left}
        id={SIDEBAR_ID}
        className={cx(styles.pane, styles.paneLeft, "material-regular")}
        aria-label={t("shell.sidebar.label")}
        data-open={leftOpen}
        inert={!leftOpen}
        onKeyDown={closeDrawerOnEscape("left")}
      >
        <Sidebar />
      </aside>
      <main
        ref={main}
        id={SCENE_ID}
        tabIndex={-1}
        className={cx(styles.scene)}
        data-free-left={dockZone.left ? "panel" : "none"}
        data-free-right={dockZone.right ? "panel" : "none"}
      >
        {children}
      </main>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <aside
        ref={right}
        id={INSPECTOR_ID}
        className={cx(styles.pane, styles.paneRight, "material-regular")}
        aria-label={t("shell.inspector.label")}
        data-open={rightOpen}
        inert={!rightOpen}
        onKeyDown={closeDrawerOnEscape("right")}
      >
        <Inspector />
      </aside>
    </div>
  );
}
