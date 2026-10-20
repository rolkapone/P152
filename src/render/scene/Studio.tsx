/**
 * "Product photo" studio (US-004, DA §10): seamless cyclorama, light or dark backdrop
 * following the theme, key / fill / rim lights + hemisphere, procedural environment,
 * soft VSM shadow of the key light (map size by quality tier). Values: studio.json only.
 */
import { useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Object3D,
  type DirectionalLight,
} from "three";
import type { StudioConfig, StudioShadowTier, ThemeName } from "../../core";
import { cycloramaBuffers } from "../math/cyclorama";
import { applyBackdrop, requestShadowUpdate, setEnvironment } from "./imperative";
import { createStudioEnvironment } from "./studioEnvironment";

interface StudioProps {
  readonly config: StudioConfig;
  readonly theme: ThemeName;
  readonly tier: StudioShadowTier;
}

function useCycloramaGeometry(config: StudioConfig["cyclorama"]): BufferGeometry {
  const geometry = useMemo(() => {
    const buffers = cycloramaBuffers(config);
    const out = new BufferGeometry();
    out.setAttribute("position", new BufferAttribute(buffers.positions, 3));
    out.setAttribute("normal", new BufferAttribute(buffers.normals, 3));
    out.setIndex(new BufferAttribute(buffers.indices, 1));
    out.computeBoundingSphere();
    return out;
  }, [config]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

export function Studio({ config, theme, tier }: StudioProps) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);
  const { lighting, shadow } = config;
  const backdrop = config.backdrop[theme];
  const cyclorama = useCycloramaGeometry(config.cyclorama);
  const keyTarget = useMemo(() => new Object3D(), []);
  const floorColor = useMemo(() => new Color(backdrop.floor), [backdrop.floor]);

  // Environment: pre-filtered once per renderer.
  useEffect(() => {
    const target = createStudioEnvironment(gl, lighting.environment);
    setEnvironment(scene, target.texture);
    invalidate();
    return () => {
      setEnvironment(scene, null);
      target.dispose();
    };
  }, [gl, scene, invalidate, lighting.environment]);

  // Backdrop of the current theme.
  useEffect(() => {
    applyBackdrop(gl, scene, backdrop);
    invalidate();
  }, [gl, scene, invalidate, backdrop]);

  // Shadows are rendered only when the scene changes (ADR-3D-08).
  useLayoutEffect(() => {
    requestShadowUpdate(gl);
    invalidate();
  }, [gl, invalidate, tier]);

  const setupKey = (light: DirectionalLight | null) => {
    if (light === null) return;
    const { half, near, far } = shadow.frustum;
    Object.assign(light.shadow.camera, {
      left: -half,
      right: half,
      top: half,
      bottom: -half,
      near,
      far,
    });
    light.shadow.camera.updateProjectionMatrix();
    light.shadow.mapSize.set(tier.mapSize, tier.mapSize);
    light.shadow.bias = shadow.bias;
    light.shadow.normalBias = shadow.normalBias;
    light.shadow.radius = tier.radius;
    light.shadow.blurSamples = tier.blurSamples;
  };

  return (
    <>
      <hemisphereLight
        args={[lighting.hemisphere.sky, lighting.hemisphere.ground, lighting.hemisphere.intensity]}
      />
      <primitive object={keyTarget} position={lighting.key.target} />
      <directionalLight
        key={tier.mapSize}
        ref={setupKey}
        color={lighting.key.color}
        intensity={lighting.key.intensity}
        position={lighting.key.position}
        target={keyTarget}
        castShadow
      />
      <directionalLight
        color={lighting.fill.color}
        intensity={lighting.fill.intensity}
        position={lighting.fill.position}
      />
      <directionalLight
        color={lighting.rim.color}
        intensity={lighting.rim.intensity}
        position={lighting.rim.position}
      />
      <mesh name="cyclorama" geometry={cyclorama} receiveShadow>
        <meshStandardMaterial
          color={floorColor}
          roughness={config.cyclorama.roughness}
          side={DoubleSide}
        />
      </mesh>
    </>
  );
}
