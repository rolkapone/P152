/**
 * Procedural studio environment (no file, ADR-3D-04): grey room + emissive softboxes,
 * pre-filtered once with PMREM. Values from studio.json `lighting.environment`.
 */
import {
  BackSide,
  BoxGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from "three";
import type { StudioConfig } from "../../core";

export function createStudioEnvironment(
  renderer: WebGLRenderer,
  env: StudioConfig["lighting"]["environment"],
): WebGLRenderTarget {
  const scene = new Scene();
  const disposables: { dispose(): void }[] = [];
  const room = new Mesh(
    new BoxGeometry(...env.room.size),
    new MeshBasicMaterial({ color: env.room.color, side: BackSide }),
  );
  room.position.y = env.room.centerY;
  scene.add(room);
  disposables.push(room.geometry, room.material);
  for (const box of env.softboxes) {
    const panel = new Mesh(
      new PlaneGeometry(...box.size),
      // Linear HDR value > 1: a light source in the pre-filtered environment.
      new MeshBasicMaterial({ color: new Color().setScalar(box.emissive), side: DoubleSide }),
    );
    panel.position.set(...box.position);
    panel.lookAt(...env.lookAt);
    scene.add(panel);
    disposables.push(panel.geometry, panel.material);
  }
  const pmrem = new PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, env.sigma);
  pmrem.dispose();
  for (const item of disposables) item.dispose();
  return target;
}
