/**
 * View bar of the 3D view (UX US-004 §2.3, UX-2/4/5): Reset view, Top, Front.
 * - Each button is a Tab stop (UX-3: three buttons, Tab is enough); the arrows also move
 *   between them, as in a toolbar, without trapping the focus.
 * - Top / Front are toggles bound to `activeView` of the store: pressed from the start of
 *   the transition, released by any manual view change and by Reset view.
 * - Tooltips name the keyboard shortcut ("View from above (1)").
 */
import type { KeyboardEvent, Ref } from "react";
import { useTranslation } from "react-i18next";
import { useSceneView } from "../../../state";
import { ToolbarButton, ToolbarToggleButton } from "../../components/ToolbarButton";
import { Tooltip } from "../../components/Tooltip";
import { cx } from "../../components/cx";
import styles from "./SceneOverlay.module.css";

function moveFocusWithArrows(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  const buttons = [...event.currentTarget.querySelectorAll("button")];
  const index = buttons.indexOf(event.target as HTMLButtonElement);
  if (index < 0) return;
  const step = event.key === "ArrowRight" ? 1 : -1;
  buttons[(index + step + buttons.length) % buttons.length]?.focus();
  event.preventDefault();
}

export function ViewToolbar({ resetRef }: { readonly resetRef?: Ref<HTMLButtonElement> }) {
  const { t } = useTranslation();
  const activeView = useSceneView((state) => state.activeView);
  const showView = useSceneView((state) => state.showView);
  return (
    <div
      role="toolbar"
      aria-label={t("scene.toolbar.label")}
      aria-orientation="horizontal"
      className={cx("material-thin", "float", styles.bar)}
      onKeyDown={moveFocusWithArrows}
    >
      <Tooltip content={t("scene.toolbar.resetHint")} placement="top start">
        <ToolbarButton
          ref={resetRef}
          icon="rotate-ccw"
          label={t("scene.toolbar.reset")}
          onPress={() => showView("reset")}
        />
      </Tooltip>
      <Tooltip content={t("scene.toolbar.topHint")}>
        <ToolbarToggleButton
          icon="view-top"
          label={t("scene.toolbar.top")}
          isSelected={activeView === "top"}
          onChange={() => showView("top")}
        />
      </Tooltip>
      <Tooltip content={t("scene.toolbar.frontHint")} placement="top end">
        <ToolbarToggleButton
          icon="view-front"
          label={t("scene.toolbar.front")}
          isSelected={activeView === "front"}
          onChange={() => showView("front")}
        />
      </Tooltip>
    </div>
  );
}
