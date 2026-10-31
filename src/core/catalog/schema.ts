/**
 * Zod schemas of the technical-artist catalog files (assets/catalog). Structural only;
 * cross-file and semantic checks (min <= default <= max, references) live in validate.ts.
 * Unknown keys are rejected (strict) except in purely descriptive blocks of the scene file.
 */
import { z } from "../schema/zod";
import {
  CATALOG_ID,
  HEX_COLOR,
  KEY,
  MATERIAL_ID,
  MAX_ID_LENGTH,
  MAX_KEY_LENGTH,
  SLUG,
  STYLE_ID,
} from "../schema/patterns";
import {
  ALLOWED_SHADOW_MAP_SIZES,
  MAX_CYCLORAMA_SEGMENTS,
  MAX_DPR,
  MAX_DRAW_CALLS_PER_OBJECT,
  MAX_EMISSIVE_INTENSITY,
  MAX_LIGHT_INTENSITY,
  MAX_FOOTPRINT_MM,
  MAX_SCENE_DRAW_CALLS,
  MAX_SCENE_EXTENT_M,
  MAX_SCENE_TRIANGLES,
  MAX_SHADOW_BLUR_SAMPLES,
  MAX_SHADOW_RADIUS,
  MAX_SOFTBOXES,
  MAX_TRANSITION_MS,
  MAX_TRIS_PER_OBJECT,
} from "./limits";

const Text = (max: number) => z.string().min(1).max(max);
const Note = Text(500).optional();
const Slug = z.string().max(MAX_ID_LENGTH).regex(SLUG);
const Key = z.string().max(MAX_KEY_LENGTH).regex(KEY);
const MaterialId = z.string().max(MAX_ID_LENGTH).regex(MATERIAL_ID);
const Hex = z.string().regex(HEX_COLOR);
const Unit01 = z.number().min(0).max(1);
const Finite = z.number().min(-1e6).max(1e6);
const LocalizedName = z.strictObject({ en: Text(80) });
const Unit = z.enum(["mm", "in", "deg"]).optional();

const EnumValue = z.union([z.string().max(32), z.number().min(-1e6).max(1e6), z.boolean()]);

export const NumericParamSchema = z.strictObject({
  unit: Unit,
  default: Finite,
  min: Finite,
  max: Finite,
  step: z.number().positive().max(1e6).optional(),
  note: Note,
});

export const EnumParamSchema = z.strictObject({
  unit: Unit,
  enum: z.array(EnumValue).min(1).max(32),
  default: EnumValue,
  note: Note,
});

export const ParamDefSchema = z.union([NumericParamSchema, EnumParamSchema]);

const PresetSchema = z.strictObject({
  id: Slug,
  /** Name of the model shown in the lists (US-006, e.g. "Compact desk"); default: entry name. */
  name: LocalizedName.optional(),
  params: z.record(Key, EnumValue),
});

const SlotSchema = z.strictObject({
  id: Key,
  role: Key,
  default: MaterialId,
  note: Note,
});

const BudgetSchema = z.strictObject({
  tris: z.int().min(1).max(MAX_TRIS_PER_OBJECT),
  drawCalls: z.int().min(1).max(MAX_DRAW_CALLS_PER_OBJECT),
  note: Note,
});

const Reference = z
  .string()
  .max(MAX_ID_LENGTH)
  .regex(/^(?:\*|[a-z0-9.-]+)$/);

const PlacementSchema = z.strictObject({
  restsOn: z.array(Slug).min(1).max(8),
  canSupport: z.array(Reference).max(16).optional(),
  mountable: z.array(Reference).max(16).optional(),
  edgeClamp: z.boolean().optional(),
  footprintParts: z.array(Text(120)).max(8).optional(),
  clearanceFrontMm: z.number().min(0).max(1000).optional(),
});

const FormatSchema = z.strictObject({
  widthMm: z.number().positive().max(3000),
  depthMm: z.number().positive().max(3000),
  keys: z.int().min(1).max(200),
});

export const ObjectTypeSchema = z.strictObject({
  id: z.string().max(MAX_ID_LENGTH).regex(CATALOG_ID),
  version: z.int().min(1).max(1000),
  type: Slug,
  category: Slug,
  name: LocalizedName,
  /** MVP: procedural only (ADR-3D-03); glTF models arrive in R4 with their own schema. */
  generator: z.literal("procedural"),
  model: z.null(),
  license: Text(200),
  source: Text(200),
  params: z.record(Key, ParamDefSchema),
  presets: z.array(PresetSchema).max(32).optional(),
  formats: z.record(Slug, FormatSchema).optional(),
  slots: z.array(SlotSchema).min(1).max(MAX_DRAW_CALLS_PER_OBJECT),
  budget: BudgetSchema,
  placement: PlacementSchema,
  notes: Note,
});

export const MaterialSchema = z.strictObject({
  id: MaterialId,
  name: LocalizedName,
  tags: z.array(Slug).max(16),
  kind: Slug.optional(),
  baseColor: Hex,
  metalness: Unit01,
  roughness: Unit01,
  opacity: Unit01.optional(),
  clearcoat: Unit01.optional(),
  clearcoatRoughness: Unit01.optional(),
  sheen: Unit01.optional(),
  sheenRoughness: Unit01.optional(),
  sheenColor: Hex.optional(),
  emissive: Hex.optional(),
  emissiveIntensity: z.number().min(0).max(MAX_EMISSIVE_INTENSITY).optional(),
  /** Reserved for KTX2 maps (R2). */
  textures: z.null().optional(),
});

export const MaterialsFileSchema = z.strictObject({
  format: z.literal("p152.materials"),
  schemaVersion: z.literal(2),
  notes: Note,
  materials: z.array(MaterialSchema).min(1).max(256),
});

const BackdropSchema = z.strictObject({
  background: Hex,
  floor: Hex,
  exposureBias: z.number().min(-2).max(2),
  envIntensityBias: z.number().min(-2).max(2),
});

const MaterialRules = z.record(Key, MaterialId);

export const StyleSchema = z.strictObject({
  id: z.string().max(MAX_ID_LENGTH).regex(STYLE_ID),
  name: LocalizedName,
  rules: z.strictObject({
    byRole: MaterialRules,
    byType: z.record(Slug, MaterialRules),
  }),
  ambience: z.strictObject({
    background: Hex,
    floor: Hex,
    exposure: z.number().min(0).max(4),
    keyColor: Hex,
    keyIntensity: z.number().min(0).max(MAX_LIGHT_INTENSITY),
    hemiIntensity: z.number().min(0).max(MAX_LIGHT_INTENSITY),
    envIntensity: z.number().min(0).max(MAX_LIGHT_INTENSITY),
    lampOn: z.boolean(),
    screenGradient: z.tuple([Hex, Hex]),
  }),
  suggestedDecor: z.array(Slug).max(16),
});

export const StylesFileSchema = z.strictObject({
  format: z.literal("p152.styles"),
  schemaVersion: z.literal(2),
  notes: Note,
  /** Descriptive lighting block (consumed by the renderer); backdrops are checked. */
  studio: z.looseObject({ light: BackdropSchema, dark: BackdropSchema }),
  styles: z.array(StyleSchema).min(1).max(32),
});

const ShadowTierSchema = z.looseObject({
  mapSize: z.union(ALLOWED_SHADOW_MAP_SIZES.map((size) => z.literal(size))),
  radius: z.number().min(0).max(MAX_SHADOW_RADIUS),
  blurSamples: z.int().min(1).max(MAX_SHADOW_BLUR_SAMPLES),
  dprMax: z.number().min(0.5).max(MAX_DPR),
  antialias: z.boolean(),
});

/** Scene coordinates of the studio, in metres (three.js units, Y up, Y = 0 floor). */
const Metres = z.number().min(-MAX_SCENE_EXTENT_M).max(MAX_SCENE_EXTENT_M);
const PositiveMetres = z.number().positive().max(MAX_SCENE_EXTENT_M);
const Vec3 = z.tuple([Metres, Metres, Metres]);
const Range = z.tuple([Metres, Metres]);
const Intensity = z.number().min(0).max(MAX_LIGHT_INTENSITY);
const Degrees = z.number().min(-180).max(180);
const Millimetres = z.number().positive().max(MAX_FOOTPRINT_MM);
const QualityTier = z.enum(["high", "medium", "low"]);

const BackdropThemeSchema = z.looseObject({
  background: Hex,
  floor: Hex,
  fog: z.looseObject({ color: Hex, near: PositiveMetres, far: PositiveMetres }),
  envIntensity: Intensity,
  exposure: z.number().min(0).max(4),
});

const LightSchema = z.looseObject({ color: Hex, intensity: Intensity, position: Vec3 });

const SoftboxSchema = z.looseObject({
  size: z.tuple([PositiveMetres, PositiveMetres]),
  position: Vec3,
  emissive: z.number().min(0).max(MAX_EMISSIVE_INTENSITY),
});

const CameraViewSchema = z.looseObject({ position: Vec3, target: Vec3 });

/**
 * Base scene (US-004). Unknown keys (TA notes) are tolerated, but every value the renderer
 * reads is checked here and only reaches it through `toStudioConfig` (studio.ts).
 */
export const StudioSceneSchema = z.looseObject({
  format: z.literal("p152.scene-studio"),
  schemaVersion: z.literal(1),
  desk: z.looseObject({
    type: z.string().max(MAX_ID_LENGTH).regex(CATALOG_ID),
    preset: Slug,
    widthMm: Finite,
    depthMm: Finite,
    heightMm: Finite,
    thicknessMm: Finite,
    legStyle: Slug,
    materials: z.record(Key, MaterialId),
    edgeRadiusMm: z.number().min(0).max(50),
    budget: BudgetSchema,
  }),
  backdrop: z.looseObject({ light: BackdropThemeSchema, dark: BackdropThemeSchema }),
  cyclorama: z.looseObject({
    floorEndZ: Metres,
    curveStartZ: Metres,
    radius: PositiveMetres,
    wallHeight: PositiveMetres,
    halfWidthX: PositiveMetres,
    segments: z.int().min(1).max(MAX_CYCLORAMA_SEGMENTS),
    roughness: Unit01,
    tris: z.int().min(1).max(MAX_TRIS_PER_OBJECT),
  }),
  lighting: z.looseObject({
    toneMapping: z.literal("NeutralToneMapping"),
    hemisphere: z.looseObject({ sky: Hex, ground: Hex, intensity: Intensity }),
    key: LightSchema.extend({ target: Vec3 }),
    fill: LightSchema,
    rim: LightSchema,
    environment: z.looseObject({
      kind: z.literal("procedural-pmrem"),
      sigma: z.number().min(0).max(0.5),
      room: z.looseObject({
        size: z.tuple([PositiveMetres, PositiveMetres, PositiveMetres]),
        centerY: Metres,
        color: Hex,
      }),
      softboxes: z.array(SoftboxSchema).max(MAX_SOFTBOXES),
      lookAt: Vec3,
    }),
    contactShadow: z.looseObject({
      opacity: Unit01,
      /** Desk contact planes = desk footprint minus this (width, depth), US-006. */
      deskInsetMm: z.tuple([Millimetres, Millimetres]),
      liftY: z.number().min(0).max(0.01),
    }),
  }),
  shadow: z.looseObject({
    type: z.literal("VSMShadowMap"),
    frustum: z.looseObject({ half: PositiveMetres, near: PositiveMetres, far: PositiveMetres }),
    bias: z.number().min(-0.01).max(0.01),
    normalBias: z.number().min(0).max(0.1),
    tiers: z.strictObject({
      high: ShadowTierSchema,
      medium: ShadowTierSchema,
      low: ShadowTierSchema,
    }),
    defaults: z.looseObject({ desktop: QualityTier, mobile: QualityTier }),
  }),
  camera: z.looseObject({
    fovDeg: z.number().min(10).max(90),
    near: PositiveMetres,
    far: PositiveMetres,
    views: z.looseObject({
      reset: CameraViewSchema,
      top: CameraViewSchema,
      front: CameraViewSchema,
    }),
    limits: z.looseObject({
      minDistance: PositiveMetres,
      maxDistance: PositiveMetres,
      minPolarDeg: z.number().min(0).max(180),
      maxPolarDeg: z.number().min(0).max(180),
      minAzimuthDeg: Degrees,
      maxAzimuthDeg: Degrees,
      minCameraY: Metres,
      pan: z.looseObject({ x: Range, y: Range, z: Range }),
      /** Inflation of the bounding box of the desk shown (US-006: derived from the desk). */
      deskKeepOutMm: z.looseObject({ margin: z.number().min(0).max(1000) }),
    }),
    transition: z.looseObject({ durationMs: z.int().min(0).max(MAX_TRANSITION_MS) }),
  }),
  perf: z.looseObject({
    budget: z.looseObject({
      drawCalls: z.int().min(1).max(MAX_SCENE_DRAW_CALLS),
      triangles: z.int().min(1).max(MAX_SCENE_TRIANGLES),
    }),
  }),
});

export type NumericParamDef = z.infer<typeof NumericParamSchema>;
export type EnumParamDef = z.infer<typeof EnumParamSchema>;
export type ParamDef = z.infer<typeof ParamDefSchema>;
export type EnumValue = z.infer<typeof EnumValue>;
export type ObjectType = z.infer<typeof ObjectTypeSchema>;
export type Material = z.infer<typeof MaterialSchema>;
export type Style = z.infer<typeof StyleSchema>;
export type StudioScene = z.infer<typeof StudioSceneSchema>;

export function isEnumParam(def: ParamDef): def is EnumParamDef {
  return "enum" in def;
}
