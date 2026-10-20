import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import materialsFile from "../../assets/catalog/materials/materials.json";
import studio from "../../assets/catalog/scene/studio.json";
import { MaterialsFileSchema, StudioSceneSchema, toStudioConfig } from "../core";
import { useSceneView } from "../state";
import { Viewport } from "./Viewport";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const config = toStudioConfig(StudioSceneSchema.parse(studio));
const materials = new Map(
  MaterialsFileSchema.parse(materialsFile).materials.map((material) => [material.id, material]),
);
const initial = useSceneView.getState();

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  // jsdom has no WebGL: the view must report it instead of loading the 3D code.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  useSceneView.setState(initial, true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function render(children?: React.ReactNode) {
  act(() =>
    root.render(
      <Viewport studio={config} materials={materials} label="3D view of your desk">
        {children}
      </Viewport>,
    ),
  );
  const region = container.querySelector<HTMLElement>('[role="group"]');
  if (region === null) throw new Error("no region");
  return region;
}

function press(target: HTMLElement, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

describe("Viewport", () => {
  it("is a focusable, labelled group with the studio background (size reserved)", () => {
    const region = render();
    expect(region.tabIndex).toBe(0);
    expect(region.getAttribute("aria-label")).toBe("3D view of your desk");
    expect(region.style.width).toBe("100%");
    expect(region.style.background).not.toBe("");
  });

  it("reports a browser without WebGL 2 and does not load the 3D code", () => {
    const region = render();
    expect(useSceneView.getState().status).toBe("unsupported");
    expect(region.dataset["sceneStatus"]).toBe("unsupported");
    expect(region.querySelector("canvas")).toBeNull();
  });

  it("checks again on Try again", () => {
    render();
    const getContext = vi.mocked(HTMLCanvasElement.prototype.getContext);
    const calls = getContext.mock.calls.length;
    act(() => useSceneView.getState().retry());
    expect(getContext.mock.calls.length).toBeGreaterThan(calls);
    expect(useSceneView.getState().status).toBe("unsupported");
  });

  it("sends the view keys to the store only when the region itself has the focus", () => {
    const run = vi.fn(() => ({ limitReached: false }));
    useSceneView.getState().attachController({ run });
    useSceneView.getState().setStatus("ready");
    const region = render(<button type="button">overlay</button>);
    act(() => useSceneView.getState().setStatus("ready"));

    const handled = press(region, "1");
    expect(handled.defaultPrevented).toBe(true);
    expect(run).toHaveBeenCalledWith({ type: "view", view: "top" });
    expect(useSceneView.getState().activeView).toBe("top");

    const button = region.querySelector("button");
    if (button === null) throw new Error("no overlay");
    const fromOverlay = press(button, "2");
    expect(fromOverlay.defaultPrevented).toBe(false);
    expect(run).toHaveBeenCalledTimes(1);

    const tab = press(region, "Tab");
    expect(tab.defaultPrevented).toBe(false);
  });

  it("leaves the keys alone while the view is not ready", () => {
    const region = render();
    expect(press(region, "ArrowLeft").defaultPrevented).toBe(false);
  });

  it("suppresses the browser context menu (right drag moves the view)", () => {
    const region = render();
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    act(() => {
      region.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
  });
});
