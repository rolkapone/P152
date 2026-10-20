/**
 * The 3D scene (lazy chunk: three.js, React Three Fiber, camera-controls are downloaded
 * only when the 3D view starts, behind the loading screen). WebGL 2 renderer (three.js),
 * rendered on demand (ADR-3D-08), NeutralToneMapping, VSM shadows updated on change only.
 */
import { Canvas } from "@react-three/fiber";
import { lazy, Suspense, useMemo, useState } from "react";
import { NeutralToneMapping, VSMShadowMap } from "three";
import type { Material, StudioConfig } from "../../core";
import { initialQualityTier, usePrefersReducedMotion, useTheme } from "../environment";
import { Desk } from "./Desk";
import { Lifecycle } from "./Lifecycle";
import { Studio } from "./Studio";
import { ViewControls } from "./ViewControls";

// E2E build only: the import is removed from the production bundle (check-bundle).
const PerfProbe = import.meta.env.VITE_E2E === "true" ? lazy(() => import("./PerfProbe")) : null;

export interface SceneCanvasProps {
  readonly studio: StudioConfig;
  readonly materials: ReadonlyMap<string, Material>;
}

export default function SceneCanvas({ studio, materials }: SceneCanvasProps) {
  const theme = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const [tierName] = useState(() => initialQualityTier(studio.shadow.defaults));
  const tier = studio.shadow.tiers[tierName];
  const glOptions = useMemo(
    () => ({
      antialias: tier.antialias,
      alpha: false,
      stencil: false,
      powerPreference: "high-performance" as const,
      toneMapping: NeutralToneMapping,
    }),
    [tier],
  );
  const shadows = useMemo(() => ({ enabled: true, type: VSMShadowMap, autoUpdate: false }), []);
  const camera = useMemo(
    () => ({
      fov: studio.camera.fovDeg,
      near: studio.camera.near,
      far: studio.camera.far,
      position: studio.camera.views.reset.position,
    }),
    [studio],
  );

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, tier.dprMax]}
      gl={glOptions}
      shadows={shadows}
      camera={camera}
      style={{ position: "absolute", inset: 0 }}
    >
      <Lifecycle config={studio} />
      <Studio config={studio} theme={theme} tier={tier} />
      <Desk config={studio} materials={materials} />
      <ViewControls config={studio} reducedMotion={reducedMotion} />
      {PerfProbe && (
        <Suspense fallback={null}>
          <PerfProbe />
        </Suspense>
      )}
    </Canvas>
  );
}
