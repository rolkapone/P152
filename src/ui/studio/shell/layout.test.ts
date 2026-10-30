import { describe, expect, it, vi } from "vitest";
import { isNarrowWindow, NARROW_QUERY, watchNarrowWindow } from "./layout";

describe("narrow window rule (1024 px)", () => {
  it("is wide without matchMedia", () => {
    expect(isNarrowWindow({} as Window)).toBe(false);
    expect(() => watchNarrowWindow(() => {}, {} as Window)()).not.toThrow();
  });

  it("asks the media query and listens to its changes", () => {
    const query = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const win = { matchMedia: vi.fn(() => query) } as unknown as Window;
    expect(isNarrowWindow(win)).toBe(true);
    expect(win.matchMedia).toHaveBeenCalledWith(NARROW_QUERY);
    const onChange = vi.fn();
    const stop = watchNarrowWindow(onChange, win);
    const listener = query.addEventListener.mock.calls[0]?.[1] as (e: { matches: boolean }) => void;
    listener({ matches: false });
    expect(onChange).toHaveBeenCalledWith(false);
    stop();
    expect(query.removeEventListener).toHaveBeenCalledWith("change", listener);
  });
});
