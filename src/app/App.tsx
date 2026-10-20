import { useEffect, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { toStudioConfig } from "../core";
import { createLocalPreferences, loadEmbeddedCatalog } from "../persistence";
import { Viewport } from "../render";
import { usePreferences, useSceneView } from "../state";
import { SceneOverlay } from "../ui";

// Composition root (ADR-APP-09): the embedded catalog feeds the 3D view. A catalog that
// fails validation never reaches the renderer (the view reports "failed").
const catalog = loadEmbeddedCatalog();
const scene = catalog.ok
  ? { studio: toStudioConfig(catalog.value.studio), materials: catalog.value.materials }
  : null;

// Display preferences of this browser (the dismissed tip), read before the first render.
usePreferences.getState().connect(createLocalPreferences());

// Minimal layout until the Studio shell (US-005): the 3D view fills the window.
const MAIN_STYLE: CSSProperties = { position: "fixed", inset: 0 };
const FILL_STYLE: CSSProperties = { position: "relative", width: "100%", height: "100%" };
const VISUALLY_HIDDEN: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
};

export function App() {
  const { t } = useTranslation();
  const attempt = useSceneView((state) => state.attempt);
  useEffect(() => {
    // Again after "Try again": the embedded catalog cannot become valid.
    if (scene === null) useSceneView.getState().setStatus("failed");
  }, [attempt]);
  return (
    <main style={MAIN_STYLE}>
      <h1 style={VISUALLY_HIDDEN}>{t("app.name")}</h1>
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
    </main>
  );
}
