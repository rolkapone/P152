import { act } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { afterEach, describe, expect, it } from "vitest";
import { createI18n } from "../ui/i18n/config";
import { App } from "./App";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("App", () => {
  it("renders its title through i18n", async () => {
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
    expect(container.querySelector("h1")?.textContent).toBe("P152");
    act(() => root.unmount());
  });
});
