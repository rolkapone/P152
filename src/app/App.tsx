import { useEffect, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { toStudioConfig } from "../core";
import { loadEmbeddedCatalog } from "../persistence";
import { Viewport } from "../render";
import { useSceneView } from "../state";

// Composition root (ADR-APP-09): the embedded catalog feeds the 3D view. A catalog that
// fails validation never reaches the renderer (the view reports "failed").
const catalog = loadEmbeddedCatalog();
const scene = catalog.ok
  ? { studio: toStudioConfig(catalog.value.studio), materials: catalog.value.materials }
  : null;

// Minimal layout until the Studio shell (US-005): the 3D view fills the window.
const MAIN_STYLE: CSSProperties = { position: "fixed", inset: 0 };
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
  useEffect(() => {
    if (scene === null) useSceneView.getState().setStatus("failed");
  }, []);
  return (
    <main style={MAIN_STYLE}>
      <h1 style={VISUALLY_HIDDEN}>{t("app.name")}</h1>
      {scene && (
        <Viewport
          studio={scene.studio}
          materials={scene.materials}
          label={t("scene.viewportLabel")}
        />
      )}
    </main>
  );
}
