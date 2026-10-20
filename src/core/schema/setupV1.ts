/**
 * Setup document, schema version 1 (ADR-3D-02). Millimetres and degrees, no render data:
 * only catalog references and parameters. Fields reserved for the long-term vision are
 * present but closed (`product`, `environment.room`: null only; `lighting`: "neutral" only)
 * so that opening them later is a schema migration, not a redesign.
 */
import { z } from "./zod";
import {
  CATALOG_ID,
  KEY,
  MATERIAL_ID,
  MAX_ID_LENGTH,
  MAX_KEY_LENGTH,
  NO_CONTROL_CHARS,
  SLUG,
  STYLE_ID,
} from "./patterns";
import {
  MAX_COORDINATE_MM,
  MAX_EXTENSION_KEYS,
  MAX_MATERIAL_OVERRIDES,
  MAX_NAME_LENGTH,
  MAX_OBJECTS,
  MAX_PARAM_MAGNITUDE,
  MAX_PARAM_STRING_LENGTH,
  MAX_PARAMS,
  SETUP_FORMAT,
} from "./limits";

const maxKeys = (max: number) => (record: Record<string, unknown>) =>
  Object.keys(record).length <= max;

const Id = z.uuid();
const CatalogId = z.string().max(MAX_ID_LENGTH).regex(CATALOG_ID);
const CatalogVersion = z.int().min(1).max(1000);
const Key = z.string().max(MAX_KEY_LENGTH).regex(KEY);
const DisplayText = z.string().min(1).max(MAX_NAME_LENGTH).regex(NO_CONTROL_CHARS);

/** Parameter value: checked against the catalog definition after schema validation. */
export const ParamValueSchema = z.union([
  z.number().min(-MAX_PARAM_MAGNITUDE).max(MAX_PARAM_MAGNITUDE),
  z.string().max(MAX_PARAM_STRING_LENGTH),
  z.boolean(),
]);

const Params = z
  .record(Key, ParamValueSchema)
  .refine(maxKeys(MAX_PARAMS), { message: "too many params" });

/** Material overrides per slot (R2): `{ "<slot>": "<materialId>" }`, empty = type defaults. */
const MaterialOverrides = z
  .record(Key, z.string().max(MAX_ID_LENGTH).regex(MATERIAL_ID))
  .refine(maxKeys(MAX_MATERIAL_OVERRIDES), { message: "too many material overrides" });

const Coordinate = z.number().min(-MAX_COORDINATE_MM).max(MAX_COORDINATE_MM);

export const TransformSchema = z.strictObject({
  /** mm, desk-top frame, origin at the top centre, +x to the user's right. */
  x: Coordinate,
  /** mm, desk-top frame, +z towards the user. */
  z: Coordinate,
  /** degrees around the vertical axis. */
  rotationY: z.number().min(-360).max(360),
});

/** Mounted object (R3/R4, e.g. monitor on an arm). Height is derived, never stored. */
export const MountSchema = z.strictObject({
  parentId: Id,
  socket: z.string().max(MAX_KEY_LENGTH).regex(SLUG),
});

export const SetupObjectSchema = z.strictObject({
  id: Id,
  type: z.string().max(MAX_KEY_LENGTH).regex(SLUG),
  catalogId: CatalogId,
  catalogVersion: CatalogVersion,
  params: Params,
  transform: TransformSchema,
  mount: MountSchema.nullable(),
  materials: MaterialOverrides,
  /** R5: reference to a real product (id only, never a URL). Reserved: null in v1. */
  product: z.null(),
  label: DisplayText.nullable(),
});

export const DeskSchema = z.strictObject({
  catalogId: CatalogId,
  catalogVersion: CatalogVersion,
  params: Params,
  materials: MaterialOverrides,
});

export const EnvironmentSchema = z.strictObject({
  /** R2: style preset applied in one click (cascade: object > style > type default). */
  stylePreset: z.string().max(MAX_ID_LENGTH).regex(STYLE_ID).nullable(),
  /** R3 adds "day" and "evening". */
  lighting: z.literal("neutral"),
  /** R3/R4: room around the desk. Reserved: null in v1. */
  room: z.null(),
});

export const AlertSettingsSchema = z.strictObject({
  occupancyMax: z.number().min(0.1).max(1),
  depthMarginMm: z.number().min(0).max(500),
  keyboardClearanceMm: z.number().min(0).max(500),
});

export const SetupV1Schema = z.strictObject({
  format: z.literal(SETUP_FORMAT),
  schemaVersion: z.literal(1),
  id: Id,
  name: DisplayText,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  units: z.literal("mm"),
  desk: DeskSchema,
  objects: z.array(SetupObjectSchema).max(MAX_OBJECTS),
  environment: EnvironmentSchema,
  alertSettings: AlertSettingsSchema,
  /** Reserved space: kept as-is, never merged nor interpreted. */
  extensions: z
    .record(z.string().max(MAX_ID_LENGTH), z.unknown())
    .refine(maxKeys(MAX_EXTENSION_KEYS), { message: "too many extension keys" }),
});

export type SetupV1 = z.infer<typeof SetupV1Schema>;
export type SetupObject = z.infer<typeof SetupObjectSchema>;
export type Desk = z.infer<typeof DeskSchema>;
export type Transform = z.infer<typeof TransformSchema>;
export type Mount = z.infer<typeof MountSchema>;
export type AlertSettings = z.infer<typeof AlertSettingsSchema>;
export type ParamValue = z.infer<typeof ParamValueSchema>;

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  occupancyMax: 0.7,
  depthMarginMm: 100,
  keyboardClearanceMm: 150,
};
