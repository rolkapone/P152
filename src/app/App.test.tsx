import { act } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSceneView } from "../state";
import { createI18n } from "../ui/i18n/config";
import { App } from "./App";

// The 3D code itself is not loaded in jsdom (test where WebGL 2 is faked).
vi.mock("../render/scene/SceneCanvas", () => ({ default: () => null }));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const initialView = useSceneView.getState();

afterEach(() => {
  useSceneView.setState(initialView, true);
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function renderApp() {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <I18nextProvider i18n={createI18n()}>
        <App />
      </I18nextProvider>,
    );
    await Promise.resolve();
  });
  return { container, root };
}

describe("App", () => {
  it("labels the 3D view through i18n while it loads", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      getExtension: () => null,
    } as unknown as WebGL2RenderingContext);
    const { container, root } = await renderApp();
    const view = container.querySelector("[data-scene-status]");
    expect(view?.getAttribute("aria-label")).toBe(
      "3D view of your desk. Use arrow keys to turn the view, plus and minus to zoom.",
    );
    act(() => root.unmount());
  });

  it("renders its title through i18n", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null); // no WebGL in jsdom
    const { container, root } = await renderApp();
    expect(container.querySelector("h1")?.textContent).toBe("P152");
    // Without a scene, the region neither takes the focus nor announces the keys.
    const view = container.querySelector("[data-scene-status]");
    expect(view?.hasAttribute("aria-label")).toBe(false);
    expect(view?.hasAttribute("tabindex")).toBe(false);
    // No WebGL 2 in jsdom: the scene is replaced by the message, the title has the focus.
    const alert = container.querySelector("[role=alert]");
    expect(alert?.querySelector("h2")?.textContent).toBe("The 3D view can't start");
    expect(document.activeElement).toBe(alert?.querySelector("h2"));
    expect(container.querySelector("[role=toolbar]")).toBeNull();
    act(() => root.unmount());
  });
});
