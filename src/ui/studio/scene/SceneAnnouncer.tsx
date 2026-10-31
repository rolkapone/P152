/**
 * The single polite live region of the 3D view (UX US-004 §2.2 and §5), visually hidden:
 * "Loading 3D scene…", "3D view ready. Desk 140 by 70 cm.", then one announcement per view
 * action (see viewAnnouncements.ts), and each change of desk (US-006, deskAnnouncement.ts, also
 * while the 3D view is loading or failed). Each message is a new node, so repeating the same
 * sentence ("Top view." twice) is announced again.
 */
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSceneView, useSetupDocument, type SceneStatus, type ViewEvent } from "../../../state";
import { formatCentimetres } from "../../i18n/format";
import { cx } from "../../components/cx";
import styles from "./SceneOverlay.module.css";
import { DESK_ANNOUNCE_DELAY_MS, describeDesk } from "./deskAnnouncement";
import {
  describeView,
  isImmediate,
  STEP_ANNOUNCE_DELAY_MS,
  summariseSteps,
  type Announcement,
} from "./viewAnnouncements";

export function SceneAnnouncer() {
  const { t, i18n } = useTranslation();
  const [message, setMessage] = useState({ id: 0, text: "" });

  const say = useCallback((text: string) => {
    setMessage((previous) => ({ id: previous.id + 1, text }));
  }, []);

  useEffect(() => {
    const speak = (announcements: readonly Announcement[]) => {
      if (announcements.length === 0) return;
      say(
        announcements.map(({ key, degrees }) => t(`scene.announce.${key}`, { degrees })).join(" "),
      );
    };

    // Status: only on a change of status (a later desk resize is not "ready" again).
    let announcedStatus: SceneStatus | null = null;
    const announceStatus = (status: SceneStatus) => {
      if (status === announcedStatus) return;
      announcedStatus = status;
      if (status === "loading") {
        say(t("scene.loading"));
      } else if (status === "ready") {
        const desk = useSceneView.getState().deskSizeMm;
        const language = i18n.resolvedLanguage ?? i18n.language;
        say(
          desk === null
            ? ""
            : t("scene.ready", {
                width: formatCentimetres(desk.width, language),
                depth: formatCentimetres(desk.depth, language),
              }),
        );
      } else {
        say(""); // error screens speak through their own role="alert"
      }
    };
    // After mount: a live region only announces changes made once it is in the page.
    const initial = setTimeout(() => announceStatus(useSceneView.getState().status), 0);

    // View events: views at once, steps after 600 ms of inactivity.
    let pending: ViewEvent[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useSceneView.subscribe((state, previous) => {
      if (state.status !== previous.status) {
        clearTimeout(timer);
        pending = [];
        announceStatus(state.status);
      }
      const event = state.lastEvent;
      if (state.status !== "ready" || event === null || event === previous.lastEvent) return;
      clearTimeout(timer);
      if (isImmediate(event)) {
        pending = [];
        const view = describeView(event);
        speak(view === null ? [] : [view]);
        return;
      }
      pending.push(event);
      timer = setTimeout(() => {
        const steps = pending;
        pending = [];
        speak(summariseSteps(steps));
      }, STEP_ANNOUNCE_DELAY_MS);
    });
    // Desk: once, 400 ms after the last change of a burst (UX-7), with the desk shown then.
    let deskTimer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribeDesk = useSetupDocument.subscribe((state, previous) => {
      if (previous.setup === null || state.setup?.desk === previous.setup.desk) return;
      clearTimeout(deskTimer);
      deskTimer = setTimeout(() => {
        const { catalog, setup } = useSetupDocument.getState();
        const desk = catalog === null || setup === null ? null : describeDesk(catalog, setup.desk);
        if (desk === null) return;
        const language = i18n.resolvedLanguage ?? i18n.language;
        say(
          t("desk.announce", {
            name: desk.name,
            width: formatCentimetres(desk.widthMm, language),
            depth: formatCentimetres(desk.depthMm, language),
          }),
        );
      }, DESK_ANNOUNCE_DELAY_MS);
    });
    return () => {
      unsubscribe();
      unsubscribeDesk();
      clearTimeout(initial);
      clearTimeout(timer);
      clearTimeout(deskTimer);
    };
  }, [say, t, i18n]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={cx(styles.visuallyHidden)}>
      <span key={message.id}>{message.text}</span>
    </div>
  );
}
