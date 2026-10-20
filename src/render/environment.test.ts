import { afterEach, describe, expect, it, vi } from "vitest";
import { currentTheme, detectWebGL2, initialQualityTier, isMobileDevice } from "./environment";

afterEach(() => {
  vi.restoreAllMocks();
  delete document.documentElement.dataset["theme"];
});

describe("detectWebGL2", () => {
  it("is false without a WebGL 2 context", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(detectWebGL2()).toBe(false);
  });

  it("is false when the browser throws", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(detectWebGL2()).toBe(false);
  });

  it("is true with a WebGL 2 context, released right away", () => {
    const loseContext = vi.fn();
    const gl = { getExtension: () => ({ loseContext }) };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(gl as never);
    expect(detectWebGL2()).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
  });
});

describe("theme", () => {
  it("follows <html data-theme> when the user chose a theme", () => {
    document.documentElement.dataset["theme"] = "dark";
    expect(currentTheme()).toBe("dark");
    document.documentElement.dataset["theme"] = "light";
    expect(currentTheme()).toBe("light");
  });

  it("falls back to the system preference (light without matchMedia)", () => {
    expect(currentTheme()).toBe("light");
  });
});

describe("quality tier", () => {
  const fakeWindow = (mobile: boolean | undefined, coarse = false, width = 1366) =>
    ({
      navigator: mobile === undefined ? {} : { userAgentData: { mobile } },
      matchMedia: () => ({ matches: coarse }),
      innerWidth: width,
    }) as unknown as Window;

  it("uses the mobile tier on mobile devices", () => {
    const defaults = { desktop: "high", mobile: "medium" } as const;
    expect(initialQualityTier(defaults, fakeWindow(true))).toBe("medium");
    expect(initialQualityTier(defaults, fakeWindow(false))).toBe("high");
  });

  it("guesses from a coarse pointer on a small screen without UA hints", () => {
    expect(isMobileDevice(fakeWindow(undefined, true, 390))).toBe(true);
    expect(isMobileDevice(fakeWindow(undefined, true, 1920))).toBe(false);
    expect(isMobileDevice(fakeWindow(undefined, false, 390))).toBe(false);
  });
});
