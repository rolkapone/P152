/**
 * What the screen reader hears after a view change (UX US-004 §5), as i18n keys:
 * - a view (Reset view, Top, Front: bar or 0 / 1 / 2) is announced at once;
 * - steps (arrows, + / -, Shift+arrows) are summed and announced once, 600 ms after the
 *   last key ("View turned 30 degrees right."); consecutive steps of the same kind form one
 *   sentence, a change of kind starts another one in the same announcement;
 * - a step stopped by a limit says so ("Zoom limit reached.") instead of a wrong amount;
 * - pointer drags produce no event, hence no announcement.
 */
import { VIEW_STEPS, type ViewCommand, type ViewEvent } from "../../../state";

/** Inactivity before the steps are announced (UX US-004 §5, UX-8). */
export const STEP_ANNOUNCE_DELAY_MS = 600;

export type AnnouncementKey =
  | "reset"
  | "top"
  | "front"
  | "turnLeft"
  | "turnRight"
  | "turnUp"
  | "turnDown"
  | "zoomIn"
  | "zoomOut"
  | "zoomLimit"
  | "moved"
  | "viewLimit";

export interface Announcement {
  readonly key: AnnouncementKey;
  readonly degrees?: number;
}

/** A view change, announced without waiting. */
export function isImmediate(event: ViewEvent): boolean {
  return event.command.type === "view";
}

type StepKind = "turnSideways" | "turnUpDown" | "zoom" | "move";

function stepKind(command: Exclude<ViewCommand, { type: "view" }>): StepKind {
  if (command.type === "turn") {
    return command.direction === "left" || command.direction === "right"
      ? "turnSideways"
      : "turnUpDown";
  }
  return command.type;
}

function turnDegrees(command: ViewCommand): number {
  if (command.type !== "turn") return 0;
  switch (command.direction) {
    case "right":
      return VIEW_STEPS.turnDeg;
    case "left":
      return -VIEW_STEPS.turnDeg;
    case "up":
      return VIEW_STEPS.tiltDeg;
    case "down":
      return -VIEW_STEPS.tiltDeg;
  }
}

function summariseGroup(kind: StepKind, group: readonly ViewEvent[]): Announcement | null {
  const last = group[group.length - 1];
  if (last === undefined) return null;
  if (kind === "zoom") {
    if (last.limitReached) return { key: "zoomLimit" };
    return {
      key: last.command.type === "zoom" && last.command.direction === "in" ? "zoomIn" : "zoomOut",
    };
  }
  if (last.limitReached) return { key: "viewLimit" };
  if (kind === "move") return { key: "moved" };
  const net = group.reduce((sum, event) => sum + turnDegrees(event.command), 0);
  if (net === 0) return null; // back where it started
  const degrees = Math.abs(net);
  if (kind === "turnSideways") return { key: net > 0 ? "turnRight" : "turnLeft", degrees };
  return { key: net > 0 ? "turnUp" : "turnDown", degrees };
}

/** Announcement of a view change (Reset view, Top, Front). */
export function describeView(event: ViewEvent): Announcement | null {
  return event.command.type === "view" ? { key: event.command.view } : null;
}

/** One announcement for a run of steps, in the order they happened. */
export function summariseSteps(events: readonly ViewEvent[]): Announcement[] {
  const result: Announcement[] = [];
  let kind: StepKind | null = null;
  let group: ViewEvent[] = [];
  const flush = () => {
    const sentence = kind === null ? null : summariseGroup(kind, group);
    if (sentence !== null) result.push(sentence);
  };
  for (const event of events) {
    if (event.command.type === "view") continue;
    const next = stepKind(event.command);
    if (next !== kind) {
      flush();
      kind = next;
      group = [];
    }
    group.push(event);
  }
  flush();
  return result;
}
