import { describe, expect, it } from "vitest";
import { readCatalogFiles, testCatalog } from "../../../tests/unit/helpers/fixtures";
import { toStudioConfig, type StudioConfig } from "./studio";
import { validateCatalog, type CatalogFiles } from "./validate";

type Json = Record<string, unknown>;
type Path = readonly (string | number)[];

const MARKER = "__unvalidated_marker__";

function studioFiles(mutate: (studio: Json) => void): CatalogFiles {
  const files = structuredClone(readCatalogFiles());
  const studio = files.studio as Json;
  mutate(studio);
  return files;
}

function configOf(files: CatalogFiles): StudioConfig | null {
  const result = validateCatalog(files);
  return result.ok ? toStudioConfig(result.value.studio) : null;
}

/** Every leaf (non-object value) of a JSON tree, with its path. */
function leaves(value: unknown, path: Path = []): [Path, unknown][] {
  if (typeof value !== "object" || value === null) return [[path, value]];
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, [...path, Array.isArray(value) ? Number(key) : key]),
  );
}

/** Every object node of a JSON tree, with its path. */
function objectNodes(value: unknown, path: Path = []): [Path, Json][] {
  if (typeof value !== "object" || value === null) return [];
  const own: [Path, Json][] = Array.isArray(value) ? [] : [[path, value as Json]];
  return own.concat(
    Object.entries(value).flatMap(([key, child]) => objectNodes(child, [...path, key])),
  );
}

function setAt(root: Json, path: Path, value: unknown): void {
  let node = root as Record<string | number, unknown>;
  for (const key of path.slice(0, -1)) node = node[key] as Record<string | number, unknown>;
  const last = path.at(-1);
  if (last !== undefined) node[last] = value;
}

/** Fields of studio.json that the renderer never reads (see the test below). */
const UNREAD_DESCRIPTIVE_FIELDS = [
  "notes",
  "desk.notes",
  "backdrop.default",
  "cyclorama.receiveShadow",
  "cyclorama.notes",
  "lighting.exposure",
  "lighting.key.castShadow",
  "lighting.fill.castShadow",
  "lighting.rim.castShadow",
  "lighting.environment.softboxes[].id",
  "lighting.environment.bakeOnce",
  "lighting.contactShadow.technique",
  "lighting.contactShadow.depthWrite",
  "lighting.contactShadow.fog",
  "shadow.autoUpdate",
  "shadow.updateOn",
  "shadow.tiers.high.contactShadows",
  "shadow.tiers.high.fog",
  "shadow.tiers.medium.contactShadows",
  "shadow.tiers.medium.fog",
  "shadow.tiers.low.contactShadows",
  "shadow.tiers.low.fog",
  "shadow.tiers.low.notes",
  "camera.target[]",
  "camera.reset.position[]",
  "camera.reset.target[]",
  "camera.views.top.notes",
  "camera.limits.deskKeepOutMm.notes",
  "camera.limits.damping",
  "camera.transition.easing",
  "camera.transition.path",
  "camera.transition.reducedMotion",
  "camera.transition.notes",
  "camera.mouse.left",
  "camera.mouse.wheel",
  "camera.mouse.right",
  "camera.mouse.touch",
  "perf.frameloop",
  "perf.targetFps",
  "perf.minViewport[]",
  "perf.budget.notes",
];

const reference = toStudioConfig(testCatalog().studio);

describe("toStudioConfig (studio.json -> renderer input)", () => {
  it("copies the values of assets/catalog/scene/studio.json", () => {
    expect(reference.desk).toMatchObject({ widthMm: 1400, depthMm: 700, heightMm: 740 });
    expect(reference.desk.materials).toEqual({ top: "mat.birch", legs: "mat.black-metal" });
    expect(reference.camera.fovDeg).toBe(32);
    expect(reference.camera.views.reset.target).toEqual([0, 0.72, 0]);
    expect(reference.camera.transitionMs).toBe(480);
    expect(reference.camera.limits.minCameraY).toBe(0.9);
    expect(reference.backdrop.light.background).toBe("#e8e8ea");
    expect(reference.backdrop.dark.background).toBe("#1c1e22");
    expect(reference.lighting.toneMapping).toBe("NeutralToneMapping");
    expect(reference.shadow.tiers.high.mapSize).toBe(2048);
    expect(reference.budget).toEqual({ drawCalls: 20, triangles: 8000 });
  });

  it("returns a deeply frozen object", () => {
    expect(Object.isFrozen(reference)).toBe(true);
    expect(Object.isFrozen(reference.camera.views.top.position)).toBe(true);
    expect(Object.isFrozen(reference.lighting.environment.softboxes[0])).toBe(true);
  });

  it("ignores unknown keys added to any (loose) object of the studio file", () => {
    let accepted = 0;
    for (const [path] of objectNodes(readCatalogFiles().studio)) {
      const config = configOf(studioFiles((root) => setAt(root, [...path, "injected"], MARKER)));
      if (config === null) continue; // strict block or record of ids: rejected, fine
      accepted += 1;
      expect(config, `studio.${path.join(".")}.injected reached the renderer`).toEqual(reference);
    }
    expect(accepted).toBeGreaterThan(20);
  });

  // The key property of the US-003 debt: a value is either validated, or never read.
  it("never exposes a value that the schema did not check", () => {
    const studio = readCatalogFiles().studio;
    const garbage = (value: unknown): unknown => (typeof value === "string" ? 1e9 : MARKER);
    const unread: string[] = [];
    for (const [path, value] of leaves(studio)) {
      const config = configOf(studioFiles((root) => setAt(root, path, garbage(value))));
      if (config === null) continue; // rejected by validation: fine
      expect(config, `studio.${path.join(".")} reached the renderer unchecked`).toEqual(reference);
      unread.push(path.join("."));
    }
    // Descriptive fields (TA notes, documentation of the technique, duplicates of validated
    // values). If one of them must drive the render, add it to StudioSceneSchema first.
    expect(new Set(unread.map((path) => path.replace(/\.\d+(?=\.|$)/g, "[]")))).toEqual(
      new Set(UNREAD_DESCRIPTIVE_FIELDS),
    );
  });
});

describe("validateCatalog: studio ranges", () => {
  it.each([
    ["camera.limits", "minDistance", 10],
    ["camera.limits", "minPolarDeg", 120],
    ["camera.limits", "minAzimuthDeg", 150],
    ["camera", "near", 50],
    ["shadow.frustum", "near", 20],
    ["cyclorama", "curveStartZ", 10],
  ])("rejects %s.%s greater than its maximum", (parent, key, value) => {
    const result = validateCatalog(
      studioFiles((studio) => setAt(studio, [...parent.split("."), key], value)),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.map((issue) => issue.code)).toContain("bounds");
  });

  it("rejects a pan range given in the wrong order", () => {
    const result = validateCatalog(
      studioFiles((studio) => setAt(studio, ["camera", "limits", "pan", "y"], [1.1, 0.5])),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects a tone mapping other than NeutralToneMapping", () => {
    const result = validateCatalog(
      studioFiles((studio) => setAt(studio, ["lighting", "toneMapping"], "ACESFilmicToneMapping")),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects more softboxes than the cap", () => {
    const result = validateCatalog(
      studioFiles((studio) => {
        const env = (studio["lighting"] as Json)["environment"] as Json;
        const boxes = env["softboxes"] as unknown[];
        env["softboxes"] = Array.from({ length: 9 }, () => boxes[0]);
      }),
    );
    expect(result.ok).toBe(false);
  });
});
