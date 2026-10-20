/**
 * Projection of the validated studio scene (assets/catalog/scene/studio.json) onto the
 * exact set of values the renderer may read (US-004, dette US-003). `StudioSceneSchema` is a
 * `looseObject` so that the technical-artist can keep notes in the file; unknown keys must
 * never reach a generator. This function copies field by field, so the result only holds
 * values checked by the schema and by `validateCatalog`. Units are kept as in the catalog:
 * millimetres for the desk, metres for scene coordinates (mm -> m happens in render/).
 */
import { deepFreeze } from "../json/freeze";
import type { StudioScene } from "./schema";

export type Vec3 = readonly [number, number, number];
export type Range = readonly [number, number];
export type QualityTier = "high" | "medium" | "low";
export type ThemeName = "light" | "dark";
export type ViewName = "reset" | "top" | "front";

export interface StudioBackdrop {
  readonly background: string;
  readonly floor: string;
  readonly fog: { readonly color: string; readonly near: number; readonly far: number };
  readonly envIntensity: number;
  readonly exposure: number;
}

export interface StudioLight {
  readonly color: string;
  readonly intensity: number;
  readonly position: Vec3;
}

export interface StudioShadowTier {
  readonly mapSize: number;
  readonly radius: number;
  readonly blurSamples: number;
  readonly dprMax: number;
  readonly antialias: boolean;
}

export interface StudioCameraView {
  readonly position: Vec3;
  readonly target: Vec3;
}

export interface StudioConfig {
  readonly desk: {
    readonly type: string;
    readonly preset: string;
    readonly widthMm: number;
    readonly depthMm: number;
    readonly heightMm: number;
    readonly thicknessMm: number;
    readonly edgeRadiusMm: number;
    readonly legStyle: string;
    readonly materials: Readonly<Record<string, string>>;
    readonly budget: { readonly tris: number; readonly drawCalls: number };
  };
  readonly backdrop: Readonly<Record<ThemeName, StudioBackdrop>>;
  readonly cyclorama: {
    readonly floorEndZ: number;
    readonly curveStartZ: number;
    readonly radius: number;
    readonly wallHeight: number;
    readonly halfWidthX: number;
    readonly segments: number;
    readonly roughness: number;
    readonly tris: number;
  };
  readonly lighting: {
    readonly toneMapping: "NeutralToneMapping";
    readonly hemisphere: {
      readonly sky: string;
      readonly ground: string;
      readonly intensity: number;
    };
    readonly key: StudioLight & { readonly target: Vec3 };
    readonly fill: StudioLight;
    readonly rim: StudioLight;
    readonly environment: {
      readonly sigma: number;
      readonly room: { readonly size: Vec3; readonly centerY: number; readonly color: string };
      readonly softboxes: readonly {
        readonly size: Range;
        readonly position: Vec3;
        readonly emissive: number;
      }[];
      readonly lookAt: Vec3;
    };
    readonly contactShadow: {
      readonly opacity: number;
      readonly deskFootprintMm: Range;
      readonly liftY: number;
    };
  };
  readonly shadow: {
    readonly frustum: { readonly half: number; readonly near: number; readonly far: number };
    readonly bias: number;
    readonly normalBias: number;
    readonly tiers: Readonly<Record<QualityTier, StudioShadowTier>>;
    readonly defaults: { readonly desktop: QualityTier; readonly mobile: QualityTier };
  };
  readonly camera: {
    readonly fovDeg: number;
    readonly near: number;
    readonly far: number;
    readonly views: Readonly<Record<ViewName, StudioCameraView>>;
    readonly limits: {
      readonly minDistance: number;
      readonly maxDistance: number;
      readonly minPolarDeg: number;
      readonly maxPolarDeg: number;
      readonly minAzimuthDeg: number;
      readonly maxAzimuthDeg: number;
      readonly minCameraY: number;
      readonly pan: { readonly x: Range; readonly y: Range; readonly z: Range };
      readonly deskKeepOutMm: {
        readonly halfWidth: number;
        readonly halfDepth: number;
        readonly height: number;
        readonly margin: number;
      };
    };
    readonly transitionMs: number;
  };
  readonly budget: { readonly drawCalls: number; readonly triangles: number };
}

const vec3 = (v: readonly [number, number, number]): Vec3 => [v[0], v[1], v[2]];
const range = (v: readonly [number, number]): Range => [v[0], v[1]];

function backdrop(b: StudioScene["backdrop"]["light"]): StudioBackdrop {
  return {
    background: b.background,
    floor: b.floor,
    fog: { color: b.fog.color, near: b.fog.near, far: b.fog.far },
    envIntensity: b.envIntensity,
    exposure: b.exposure,
  };
}

function light(l: StudioScene["lighting"]["fill"]): StudioLight {
  return { color: l.color, intensity: l.intensity, position: vec3(l.position) };
}

function tier(t: StudioScene["shadow"]["tiers"]["high"]): StudioShadowTier {
  return {
    mapSize: t.mapSize,
    radius: t.radius,
    blurSamples: t.blurSamples,
    dprMax: t.dprMax,
    antialias: t.antialias,
  };
}

function view(v: StudioScene["camera"]["views"]["top"]): StudioCameraView {
  return { position: vec3(v.position), target: vec3(v.target) };
}

/** Copies only the validated values of the studio scene (see module comment). */
export function toStudioConfig(studio: StudioScene): StudioConfig {
  const { desk, cyclorama, lighting, shadow, camera } = studio;
  const { environment: env, contactShadow } = lighting;
  const { limits } = camera;
  return deepFreeze({
    desk: {
      type: desk.type,
      preset: desk.preset,
      widthMm: desk.widthMm,
      depthMm: desk.depthMm,
      heightMm: desk.heightMm,
      thicknessMm: desk.thicknessMm,
      edgeRadiusMm: desk.edgeRadiusMm,
      legStyle: desk.legStyle,
      materials: Object.fromEntries(Object.entries(desk.materials)),
      budget: { tris: desk.budget.tris, drawCalls: desk.budget.drawCalls },
    },
    backdrop: { light: backdrop(studio.backdrop.light), dark: backdrop(studio.backdrop.dark) },
    cyclorama: {
      floorEndZ: cyclorama.floorEndZ,
      curveStartZ: cyclorama.curveStartZ,
      radius: cyclorama.radius,
      wallHeight: cyclorama.wallHeight,
      halfWidthX: cyclorama.halfWidthX,
      segments: cyclorama.segments,
      roughness: cyclorama.roughness,
      tris: cyclorama.tris,
    },
    lighting: {
      toneMapping: lighting.toneMapping,
      hemisphere: {
        sky: lighting.hemisphere.sky,
        ground: lighting.hemisphere.ground,
        intensity: lighting.hemisphere.intensity,
      },
      key: { ...light(lighting.key), target: vec3(lighting.key.target) },
      fill: light(lighting.fill),
      rim: light(lighting.rim),
      environment: {
        sigma: env.sigma,
        room: { size: vec3(env.room.size), centerY: env.room.centerY, color: env.room.color },
        softboxes: env.softboxes.map((box) => ({
          size: range(box.size),
          position: vec3(box.position),
          emissive: box.emissive,
        })),
        lookAt: vec3(env.lookAt),
      },
      contactShadow: {
        opacity: contactShadow.opacity,
        deskFootprintMm: range(contactShadow.deskFootprintMm),
        liftY: contactShadow.liftY,
      },
    },
    shadow: {
      frustum: {
        half: shadow.frustum.half,
        near: shadow.frustum.near,
        far: shadow.frustum.far,
      },
      bias: shadow.bias,
      normalBias: shadow.normalBias,
      tiers: {
        high: tier(shadow.tiers.high),
        medium: tier(shadow.tiers.medium),
        low: tier(shadow.tiers.low),
      },
      defaults: { desktop: shadow.defaults.desktop, mobile: shadow.defaults.mobile },
    },
    camera: {
      fovDeg: camera.fovDeg,
      near: camera.near,
      far: camera.far,
      views: {
        reset: view(camera.views.reset),
        top: view(camera.views.top),
        front: view(camera.views.front),
      },
      limits: {
        minDistance: limits.minDistance,
        maxDistance: limits.maxDistance,
        minPolarDeg: limits.minPolarDeg,
        maxPolarDeg: limits.maxPolarDeg,
        minAzimuthDeg: limits.minAzimuthDeg,
        maxAzimuthDeg: limits.maxAzimuthDeg,
        minCameraY: limits.minCameraY,
        pan: { x: range(limits.pan.x), y: range(limits.pan.y), z: range(limits.pan.z) },
        deskKeepOutMm: {
          halfWidth: limits.deskKeepOutMm.halfWidth,
          halfDepth: limits.deskKeepOutMm.halfDepth,
          height: limits.deskKeepOutMm.height,
          margin: limits.deskKeepOutMm.margin,
        },
      },
      transitionMs: camera.transition.durationMs,
    },
    budget: {
      drawCalls: studio.perf.budget.drawCalls,
      triangles: studio.perf.budget.triangles,
    },
  });
}
