import { useEffect, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { toStudioConfig } from "../core";
import { createLocalPreferences, loadEmbeddedCatalog } from "../persistence";
import { Viewport } from "../render";
import { usePreferences, useSceneView, useShellLayout } from "../state";
import { isNarrowWindow, SceneOverlay, StudioShell } from "../ui";

// Composition root (ADR-APP-09): the embedded catalog feeds the 3D view. A catalog that
// fails validation never reaches the renderer (the view reports "failed").
const catalog = loadEmbeddedCatalog();
const scene = catalog.ok
  ? { studio: toStudioConfig(catalog.value.studio), materials: catalog.value.materials }
  : null;

// Display preferences of this browser (the dismissed tip), read before the first render.
usePreferences.getState().connect(createLocalPreferences());
// Docked (remembered) panels or closed drawers, known before the first render (no flash).
useShellLayout.getState().setNarrow(isNarrowWindow());

// Without a scene, the overlays (error screen) take the place of the 3D view.
const FILL_STYLE: CSSProperties = { position: "relative", width: "100%", height: "100%" };

export function App() {
  const { t } = useTranslation();
  const attempt = useSceneView((state) => state.attempt);
  useEffect(() => {
    // Again after "Try again": the embedded catalog cannot become valid.
    if (scene === null) useSceneView.getState().setStatus("failed");
  }, [attempt]);
  return (
    <StudioShell>
      {scene ? (
        <Viewport
          studio={scene.studio}
          materials={scene.materials}
          label={t("scene.viewportLabel")}
        >
          <SceneOverlay />
        </Viewport>
      ) : (
        <div style={FILL_STYLE}>
          <SceneOverlay />
        </div>
      )}
    </StudioShell>
  );
}
