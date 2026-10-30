/**
 * Toolbar button that collapses or expands a side panel (design-system.md §15, UX-6):
 * constant accessible name, `aria-expanded` / `aria-controls`, 40 px target, tooltip
 * "Hide panel" / "Show panel" (400 ms on hover, at once on keyboard focus). The focus stays
 * on the button when the panel moves.
 */
import { Button } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { useShellLayout, type PanelSide } from "../../../state";
import { Icon, type IconName } from "../../components/Icon";
import { Tooltip } from "../../components/Tooltip";
import { cx } from "../../components/cx";
import styles from "./Shell.module.css";

const ICONS: Record<PanelSide, { open: IconName; closed: IconName }> = {
  left: { open: "panel-left-close", closed: "panel-left-open" },
  right: { open: "panel-right-close", closed: "panel-right-open" },
};

export interface PanelToggleProps {
  readonly side: PanelSide;
  /** Id of the panel it controls. */
  readonly controls: string;
}

export function PanelToggle({ side, controls }: PanelToggleProps) {
  const { t } = useTranslation();
  const open = useShellLayout((state) => (side === "left" ? state.leftOpen : state.rightOpen));
  return (
    <Tooltip
      content={open ? t("shell.toggle.hide") : t("shell.toggle.show")}
      placement={side === "left" ? "bottom start" : "bottom end"}
    >
      <Button
        className={cx(styles.toggle, side === "left" ? styles.toggleLeft : styles.toggleRight)}
        aria-label={side === "left" ? t("shell.toggle.left") : t("shell.toggle.right")}
        aria-expanded={open}
        aria-controls={controls}
        onPress={() => useShellLayout.getState().togglePanel(side)}
      >
        <Icon name={open ? ICONS[side].open : ICONS[side].closed} size="lg" />
      </Button>
    </Tooltip>
  );
}
