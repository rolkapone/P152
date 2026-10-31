/**
 * React binding of the view rig (viewRig.ts): creates it for the canvas camera, registers it
 * as the `ViewController` of the state store and drives it before each frame. The free zone
 * between the panels (Studio shell) is read when a view is framed (UX-8).
 */
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { PerspectiveCamera } from "three";
import type { DeskSpec, StudioConfig } from "../../core";
import { useSceneView, useShellLayout } from "../../state";
import { ViewRig } from "./viewRig";

interface ViewControlsProps {
  readonly config: StudioConfig;
  /** Desk shown now: a change reframes the view, keeping its orientation (US-006). */
  readonly desk: DeskSpec;
  readonly reducedMotion: boolean;
}

export function ViewControls({ config, desk, reducedMotion }: ViewControlsProps) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const element = useThree((state) => state.gl.domElement);
  const invalidate = useThree((state) => state.invalidate);
  const rig = useRef<ViewRig | null>(null);
  const reduced = useRef(reducedMotion);
  const deskRef = useRef(desk);

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
      freeZone: () => useShellLayout.getState().freeZone,
      desk: deskRef.current,
    });
    rig.current = next;
    const detach = store.attachController(next);
    const unsubscribe = useShellLayout.subscribe((state, previous) => {
      if (state.freeZone !== previous.freeZone) next.freeZoneChanged();
    });
    return () => {
      unsubscribe();
      detach();
      next.dispose();
      rig.current = null;
    };
  }, [camera, element, config, invalidate]);

  // After the rig is created (same render), so the first desk is not a change.
  useEffect(() => {
    deskRef.current = desk;
    rig.current?.setDesk(desk);
  }, [desk]);

  useFrame((_, delta) => rig.current?.frame(delta), -1);

  return null;
}
