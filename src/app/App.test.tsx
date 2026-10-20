import { act } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "../ui/i18n/config";
import { App } from "./App";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("App", () => {
  it("renders its title through i18n", async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null); // no WebGL in jsdom
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
    expect(container.querySelector("h1")?.textContent).toBe("P152");
    const view = container.querySelector("[role=group]");
    expect(view?.getAttribute("aria-label")).toBe(
      "3D view of your desk. Use arrow keys to turn the view, plus and minus to zoom.",
    );
    // No WebGL 2 in jsdom: the scene is replaced by the message, the title has the focus.
    const alert = container.querySelector("[role=alert]");
    expect(alert?.querySelector("h2")?.textContent).toBe("The 3D view can't start");
    expect(document.activeElement).toBe(alert?.querySelector("h2"));
    expect(container.querySelector("[role=toolbar]")).toBeNull();
    act(() => root.unmount());
  });
});
