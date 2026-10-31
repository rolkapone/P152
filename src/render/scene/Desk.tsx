/**
 * Desk generated from the catalog (ADR-3D-03): `desk.rect` (rounded top, 4 posts, rear rail)
 * or `desk.corner` (L-shaped top, 6 posts, 2 rails); posts and rails merged into one geometry
 * (one geometry per material slot: 2 draw calls), and soft contact shadows under the desk and
 * each foot (one instanced draw call). Metres, origin on the floor.
 */
import { useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo } from "react";
import {
  DataTexture,
  InstancedMesh,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
} from "three";
import type { DeskSpec, Material, StudioConfig } from "../../core";
import {
  CONTACT_CORE,
  contactShadowPixels,
  deskContactFootprints,
  type ContactFootprint,
} from "../math/contactShadow";
import { deskLayout, type DeskLayout } from "../math/deskLayout";
import { buildDeskGeometries } from "./deskGeometry";
import { requestShadowUpdate } from "./imperative";
import { createMaterial } from "./materials";

function useSlotMaterial(materials: ReadonlyMap<string, Material>, id: string | undefined) {
  const material = useMemo(() => {
    const entry = id === undefined ? undefined : materials.get(id);
    return entry === undefined ? null : createMaterial(entry);
  }, [materials, id]);
  useEffect(() => () => material?.dispose(), [material]);
  return material;
}

interface ContactPlane extends ContactFootprint {
  readonly y: number;
}

/** Gradient texture and material shared by every contact plane (built once per opacity). */
function useContactMaterial(opacity: number): MeshBasicMaterial {
  const resources = useMemo(() => {
    const size = 128;
    const texture = new DataTexture(contactShadowPixels(size), size, size);
    // Smooth gradient at grazing angles (DataTexture defaults to nearest, no mipmaps).
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity,
      fog: false,
    });
    return { texture, material };
  }, [opacity]);
  useEffect(
    () => () => {
      resources.material.dispose();
      resources.texture.dispose();
    },
    [resources],
  );
  return resources.material;
}

interface ContactShadowsProps {
  readonly config: StudioConfig;
  readonly desk: DeskSpec;
  readonly layout: DeskLayout;
}

/** Desk planes derived from the desk shown (US-006) and one plane per foot: 1 draw call. */
function ContactShadows({ config, desk, layout }: ContactShadowsProps) {
  const { opacity, deskInsetMm, liftY } = config.lighting.contactShadow;
  const material = useContactMaterial(opacity);
  const resources = useMemo(() => {
    const geometry = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const planes: ContactPlane[] = [
      ...deskContactFootprints(desk, deskInsetMm).map((plane) => ({ ...plane, y: liftY })),
      ...layout.feet.map((foot) => ({
        x: foot.center[0],
        y: liftY * 1.5,
        z: foot.center[2],
        width: foot.size[0],
        depth: foot.size[1],
      })),
    ];
    const mesh = new InstancedMesh(geometry, material, planes.length);
    mesh.name = "contact-shadows";
    const dummy = new Object3D();
    planes.forEach((plane, index) => {
      dummy.position.set(plane.x, plane.y, plane.z);
      dummy.scale.set(plane.width / CONTACT_CORE, 1, plane.depth / CONTACT_CORE);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.renderOrder = 1;
    mesh.computeBoundingSphere();
    return { geometry, mesh };
  }, [material, desk, deskInsetMm, liftY, layout]);
  useEffect(
    () => () => {
      resources.mesh.dispose();
      resources.geometry.dispose();
    },
    [resources],
  );
  return <primitive object={resources.mesh} />;
}

interface DeskProps {
  readonly config: StudioConfig;
  /** Desk shown now. */
  readonly desk: DeskSpec;
  readonly materials: ReadonlyMap<string, Material>;
}

export function Desk({ config, desk, materials }: DeskProps) {
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const edgeRadiusMm = config.desk.edgeRadiusMm;
  const layout = useMemo(() => deskLayout(desk, edgeRadiusMm), [desk, edgeRadiusMm]);
  const geometries = useMemo(() => buildDeskGeometries(layout), [layout]);
  useEffect(
    () => () => {
      geometries.top.dispose();
      geometries.legs.dispose();
    },
    [geometries],
  );
  const top = useSlotMaterial(materials, desk.materials["top"]);
  const legs = useSlotMaterial(materials, desk.materials["legs"]);

  useLayoutEffect(() => {
    requestShadowUpdate(gl);
    invalidate();
  }, [gl, invalidate, geometries, top, legs]);

  return (
    <group name="desk">
      {top && (
        <mesh name="desk-top" geometry={geometries.top} material={top} castShadow receiveShadow />
      )}
      {legs && (
        <mesh
          name="desk-legs"
          geometry={geometries.legs}
          material={legs}
          castShadow
          receiveShadow
        />
      )}
      <ContactShadows config={config} desk={desk} layout={layout} />
    </group>
  );
}
