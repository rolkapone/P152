/**
 * Left panel (design-system.md §15, UX US-005 §3.3): segmented control Desk / Objects on
 * React Aria Tabs (`tablist` / `tab` / `tabpanel`, arrows change the tab, automatic
 * activation), "Desk" selected on load: the desk models (US-006, DeskTab); Objects is an empty
 * state until the object library (US-008).
 */
import { Tab, TabList, TabPanel, Tabs } from "react-aria-components";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../../components/EmptyState";
import { cx } from "../../components/cx";
import { DeskTab } from "../desk/DeskTab";
import styles from "./Shell.module.css";

export function Sidebar() {
  const { t } = useTranslation();
  return (
    <Tabs className={cx(styles.tabs)} defaultSelectedKey="desk">
      <TabList className={cx(styles.segmented)}>
        <Tab id="desk" className={cx(styles.segment)}>
          {t("shell.sidebar.desk")}
        </Tab>
        <Tab id="objects" className={cx(styles.segment)}>
          {t("shell.sidebar.objects")}
        </Tab>
      </TabList>
      <TabPanel id="desk" className={cx(styles.tabPanel)}>
        <DeskTab />
      </TabPanel>
      <TabPanel id="objects" className={cx(styles.tabPanel)}>
        <h2 className={cx(styles.sectionTitle)}>{t("shell.sidebar.objects")}</h2>
        <EmptyState
          icon="box"
          title={t("shell.sidebar.objectsEmptyTitle")}
          description={t("shell.sidebar.objectsEmptyBody")}
        />
      </TabPanel>
    </Tabs>
  );
}
