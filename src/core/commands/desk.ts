/**
 * Desk of the setup document (US-006, ADR-APP-02 `setDesk` command): the line of the desk list
 * becomes `setup.desk` (catalog reference + parameters, millimetres), the desk drawn by the
 * scene is derived from it (`deskSpecOf`), and the line shown as active too (`deskChoiceIdOf`).
 */
import {
  defaultDeskChoiceId,
  deskChoiceId,
  deskChoices,
  deskSpec,
  type DeskSpec,
} from "../catalog/desk";
import { defaultParams } from "../catalog/params";
import type { Catalog } from "../catalog/validate";
import { err, ok, type Result } from "../result";
import type { Desk, SetupV1 } from "../schema/setupV1";

export type SetDeskError = "unknownDesk";

/** Setup desk of a line of the desk list: every parameter written, type default materials. */
export function deskForChoice(catalog: Catalog, choiceId: string): Desk | null {
  const choice = deskChoices(catalog).find((candidate) => candidate.id === choiceId);
  const type = choice === undefined ? undefined : catalog.objectTypes.get(choice.catalogId);
  const preset = type?.presets?.find((candidate) => candidate.id === choice?.presetId);
  if (type === undefined || preset === undefined) return null;
  return {
    catalogId: type.id,
    catalogVersion: type.version,
    params: { ...defaultParams(type.params), ...preset.params },
    materials: {},
  };
}

/** Setup desk of the default line (the studio desk, 140 x 70, UX-3). */
export function defaultDesk(catalog: Catalog): Desk | null {
  return deskForChoice(catalog, defaultDeskChoiceId(catalog));
}

/**
 * Desk the scene draws for this setup desk, or null when the catalog cannot generate it
 * (unknown entry, other version, value out of bounds).
 */
export function deskSpecOf(catalog: Catalog, desk: Desk): DeskSpec | null {
  const type = catalog.objectTypes.get(desk.catalogId);
  if (type?.version !== desk.catalogVersion) return null;
  return deskSpec(type, desk.params, desk.materials);
}

/** Line of the desk list matching this setup desk, or null (custom size, US-007). */
export function deskChoiceIdOf(catalog: Catalog, desk: Desk): string | null {
  const spec = deskSpecOf(catalog, desk);
  return spec?.presetId == null ? null : deskChoiceId(spec.catalogId, spec.presetId);
}

function sameRecord(a: Readonly<Record<string, unknown>>, b: Readonly<Record<string, unknown>>) {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

/** Same setup desk: same entry, version, parameters and material overrides. */
export function sameSetupDesk(a: Desk, b: Desk): boolean {
  return (
    a.catalogId === b.catalogId &&
    a.catalogVersion === b.catalogVersion &&
    sameRecord(a.params, b.params) &&
    sameRecord(a.materials, b.materials)
  );
}

/**
 * Reducer of the `setDesk` command (pure). The objects are kept as they are: none removed nor
 * moved, their positions stay relative to the centre of the desk (UX US-006 §6); the alerts,
 * derived from the setup, are recomputed by whoever watches its reference. The same desk
 * returns the same setup (same reference: nothing to recompute, nothing to announce).
 */
export function setDesk(
  setup: SetupV1,
  desk: Desk,
  catalog: Catalog,
  now: string,
): Result<SetupV1, SetDeskError> {
  if (deskSpecOf(catalog, desk) === null) return err("unknownDesk");
  if (sameSetupDesk(setup.desk, desk)) return ok(setup);
  return ok({
    ...setup,
    updatedAt: now,
    desk: {
      catalogId: desk.catalogId,
      catalogVersion: desk.catalogVersion,
      params: { ...desk.params },
      materials: { ...desk.materials },
    },
  });
}
