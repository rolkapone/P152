/**
 * React binding of the view rig (viewRig.ts): creates it for the canvas camera, registers it
 * as the `ViewController` of the state store and drives it before each frame.
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { PerspectiveCamera } from "three";
import type { StudioConfig } from "../../core";
import { useSceneView } from "../../state";
import { ViewRig } from "./viewRig";

interface ViewControlsProps {
  readonly config: StudioConfig;
  readonly reducedMotion: boolean;
}

export function ViewControls({ config, reducedMotion }: ViewControlsProps) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const element = useThree((state) => state.gl.domElement);
  const invalidate = useThree((state) => state.invalidate);
  const rig = useRef<ViewRig | null>(null);
  const reduced = useRef(reducedMotion);

  useEffect(() => {
    reduced.current = reducedMotion;
    rig.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    const store = useSceneView.getState();
    const next = new ViewRig({
      camera,
      element,
      config,
      reducedMotion: reduced.current,
      invalidate,
      onPointerViewChange: () => useSceneView.getState().notifyPointerViewChange(),
    });
    rig.current = next;
    const detach = store.attachController(next);
    return () => {
      detach();
      next.dispose();
      rig.current = null;
    };
  }, [camera, element, config, invalidate]);

  useFrame((_, delta) => rig.current?.frame(delta), -1);

  return null;
}
