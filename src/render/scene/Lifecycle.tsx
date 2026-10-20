/**
 * Renderer lifecycle exposed in the state store (no UI here, US-004 T5/T6 by the developer):
 * `ready` after the first rendered frame, `contextLost` when the GPU context is lost.
 */
import { addAfterEffect, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { StudioConfig } from "../../core";
import { useSceneView } from "../../state";

export function Lifecycle({ config }: { readonly config: StudioConfig }) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const store = useSceneView.getState();
    store.setDeskSize({ width: config.desk.widthMm, depth: config.desk.depthMm });
    const stop = addAfterEffect(() => {
      stop();
      useSceneView.getState().setStatus("ready");
    });
    return stop;
  }, [config]);

  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (event: Event) => {
      // Allows a later restore; the UI offers "Try again", which mounts a fresh renderer.
      event.preventDefault();
      useSceneView.getState().setStatus("contextLost");
    };
    canvas.addEventListener("webglcontextlost", onLost);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [gl]);

  return null;
}
