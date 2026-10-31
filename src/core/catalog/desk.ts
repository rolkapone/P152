/**
 * Desks of the catalog as the scene and the rules see them (US-006, ADR-3D-02/03): a desk
 * resolved from a catalog entry and its parameters, in millimetres, frozen, independent of
 * any renderer. The procedural generator is chosen by the catalog id (`DESK_SHAPES`):
 * `desk.rect` is a rectangle, `desk.corner` an L (main arm along the back edge, return wing
 * on the `orientation` side, towards the user).
 *
 * Frame of a desk (as `setup.objects[].transform`): origin at the centre of its bounding box,
 * +x to the user's right, +z towards the user, back edge at z = -depth / 2.
 */
import { deepFreeze } from "../json/freeze";
import { isValidParamValue } from "./params";
import type { ObjectType } from "./schema";
import type { StudioConfig } from "./studio";
import { DESK_TYPE, type Catalog } from "./validate";

export type DeskShape = "rect" | "corner";
export type DeskOrientation = "right" | "left";

interface DeskSpecBase {
  readonly catalogId: string;
  readonly catalogVersion: number;
  /** Preset whose parameters are exactly these, or null (custom size, US-007). */
  readonly presetId: string | null;
  readonly widthMm: number;
  readonly depthMm: number;
  readonly heightMm: number;
  readonly thicknessMm: number;
  readonly legStyle: string;
  /** Material of each slot: type defaults, then the overrides of the setup. */
  readonly materials: Readonly<Record<string, string>>;
}

export interface RectDeskSpec extends DeskSpecBase {
  readonly shape: "rect";
}

export interface CornerDeskSpec extends DeskSpecBase {
  readonly shape: "corner";
  /** Depth of the main arm, against the back edge. */
  readonly armDepthMm: number;
  /** Width of the return wing. */
  readonly wingWidthMm: number;
  /** Side of the wing seen from the user. */
  readonly orientation: DeskOrientation;
}

export type DeskSpec = RectDeskSpec | CornerDeskSpec;

/** Catalog entries the scene knows how to generate. */
export const DESK_SHAPES: Readonly<Record<string, DeskShape>> = Object.freeze({
  "desk.rect": "rect",
  "desk.corner": "corner",
});

/** One line of the desk list (US-006): a preset of a desk entry. */
export interface DeskChoice {
  /** `<catalogId>/<presetId>`, stable. */
  readonly id: string;
  readonly catalogId: string;
  readonly presetId: string;
  /** Name of the preset (`name.en`), else of the catalog entry, e.g. "Compact desk". */
  readonly name: string;
  readonly spec: DeskSpec;
}

export const deskChoiceId = (catalogId: string, presetId: string) => `${catalogId}/${presetId}`;

type ParamValues = Readonly<Record<string, unknown>>;

/**
 * Desk of a catalog entry with these parameters (missing ones = catalog defaults) and these
 * material overrides. Null when the entry is not a desk the scene can generate, or when a
 * value is unknown or out of the catalog bounds.
 */
export function deskSpec(
  type: ObjectType,
  params: ParamValues = {},
  materials: Readonly<Record<string, string>> = {},
): DeskSpec | null {
  const shape = DESK_SHAPES[type.id];
  if (type.type !== DESK_TYPE || shape === undefined) return null;
  const values: Record<string, string | number | boolean> = {};
  for (const [key, def] of Object.entries(type.params)) {
    const value = Object.hasOwn(params, key) ? params[key] : def.default;
    if (!isValidParamValue(def, value)) return null;
    values[key] = value as string | number | boolean;
  }
  const number = (key: string) => (typeof values[key] === "number" ? values[key] : null);
  const text = (key: string) => (typeof values[key] === "string" ? values[key] : null);
  const widthMm = number("width");
  const depthMm = number("depth");
  const heightMm = number("height");
  const thicknessMm = number("thickness");
  const legStyle = text("legStyle");
  if (
    widthMm === null ||
    depthMm === null ||
    heightMm === null ||
    thicknessMm === null ||
    legStyle === null
  ) {
    return null;
  }
  const slots: Record<string, string> = {};
  for (const slot of type.slots) {
    const override = Object.hasOwn(materials, slot.id) ? materials[slot.id] : undefined;
    slots[slot.id] = override ?? slot.default;
  }
  const preset = (type.presets ?? []).find((candidate) =>
    Object.entries(candidate.params).every(([key, value]) => values[key] === value),
  );
  const base = {
    catalogId: type.id,
    catalogVersion: type.version,
    presetId: preset?.id ?? null,
    widthMm,
    depthMm,
    heightMm,
    thicknessMm,
    legStyle,
    materials: slots,
  };
  if (shape === "rect") return deepFreeze({ ...base, shape });
  const armDepthMm = number("armDepth");
  const wingWidthMm = number("wingWidth");
  const orientation = text("orientation");
  if (
    armDepthMm === null ||
    wingWidthMm === null ||
    (orientation !== "right" && orientation !== "left") ||
    armDepthMm >= depthMm ||
    wingWidthMm >= widthMm
  ) {
    return null;
  }
  return deepFreeze({ ...base, shape, armDepthMm, wingWidthMm, orientation });
}

/**
 * The desk lines of the catalog, in catalog order: every preset of every desk entry the scene
 * can generate, rectangles first (order of `DESK_SHAPES`).
 */
export function deskChoices(catalog: Catalog): readonly DeskChoice[] {
  const out: DeskChoice[] = [];
  for (const catalogId of Object.keys(DESK_SHAPES)) {
    const type = catalog.objectTypes.get(catalogId);
    if (type === undefined) continue;
    for (const preset of type.presets ?? []) {
      const spec = deskSpec(type, preset.params);
      if (spec === null) continue;
      out.push({
        id: deskChoiceId(catalogId, preset.id),
        catalogId,
        presetId: preset.id,
        name: preset.name?.en ?? type.name.en,
        spec,
      });
    }
  }
  return Object.freeze(out);
}

/** Id of the default desk line: the desk of the studio scene (studio.json, 140 x 70). */
export function defaultDeskChoiceId(catalog: Catalog): string {
  return deskChoiceId(catalog.studio.desk.type, catalog.studio.desk.preset);
}

/**
 * Desk drawn before the application chose one: the studio desk, as a rectangle (the studio
 * file describes a rectangular desk only; `validateCatalog` checks it against its entry). Its
 * entry version is not in the studio file: 1, never serialized (the app sets the real desk).
 */
export function studioDeskSpec(config: StudioConfig): DeskSpec {
  const { desk } = config;
  return deepFreeze({
    shape: "rect",
    catalogId: desk.type,
    catalogVersion: 1,
    presetId: desk.preset,
    widthMm: desk.widthMm,
    depthMm: desk.depthMm,
    heightMm: desk.heightMm,
    thicknessMm: desk.thicknessMm,
    legStyle: desk.legStyle,
    materials: { ...desk.materials },
  });
}

/** Same desk (every value equal): applying it again changes nothing. */
export function sameDesk(a: DeskSpec, b: DeskSpec): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const left = (a as unknown as Record<string, unknown>)[key];
    const right = (b as unknown as Record<string, unknown>)[key];
    if (key === "materials") {
      const lm = left as Record<string, string>;
      const rm = right as Record<string, string>;
      const slots = new Set([...Object.keys(lm), ...Object.keys(rm)]);
      if ([...slots].some((slot) => lm[slot] !== rm[slot])) return false;
    } else if (left !== right) {
      return false;
    }
  }
  return true;
}
