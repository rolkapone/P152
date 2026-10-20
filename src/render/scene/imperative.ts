/**
 * Imperative three.js updates called from React effects. Kept outside components: three.js
 * objects are mutable by design, React components should not mutate hook values.
 */
import { Color, Fog, type Scene, type Texture, type WebGLRenderer } from "three";
import type { StudioBackdrop } from "../../core";

/** Shadows are rendered only when the scene changes (`shadowMap.autoUpdate = false`). */
export function requestShadowUpdate(renderer: WebGLRenderer): void {
  renderer.shadowMap.needsUpdate = true;
}

export function setEnvironment(scene: Scene, texture: Texture | null): void {
  scene.environment = texture;
}

export function applyBackdrop(
  renderer: WebGLRenderer,
  scene: Scene,
  backdrop: StudioBackdrop,
): void {
  scene.background = new Color(backdrop.background);
  scene.fog = new Fog(backdrop.fog.color, backdrop.fog.near, backdrop.fog.far);
  scene.environmentIntensity = backdrop.envIntensity;
  renderer.toneMappingExposure = backdrop.exposure;
}
