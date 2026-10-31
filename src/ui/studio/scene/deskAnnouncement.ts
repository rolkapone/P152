/**
 * Announcement of a change of desk (UX US-006 §5, UX-7): "{name} selected. {w} by {d} cm.",
 * once, 400 ms after the last change of a burst (arrows), through the live region of the
 * scene. Nothing for the active desk again: the setup does not change.
 */
import { deskChoiceIdOf, deskChoices, deskSpecOf, type Catalog, type Desk } from "../../../core";

export const DESK_ANNOUNCE_DELAY_MS = 400;

export interface DeskAnnouncement {
  readonly name: string;
  readonly widthMm: number;
  readonly depthMm: number;
}

/** Name and size of a setup desk; the entry name for a desk off the list (US-007). */
export function describeDesk(catalog: Catalog, desk: Desk): DeskAnnouncement | null {
  const spec = deskSpecOf(catalog, desk);
  if (spec === null) return null;
  const id = deskChoiceIdOf(catalog, desk);
  const choice = deskChoices(catalog).find((candidate) => candidate.id === id);
  const name = choice?.name ?? catalog.objectTypes.get(desk.catalogId)?.name.en ?? "";
  return { name, widthMm: spec.widthMm, depthMm: spec.depthMm };
}
