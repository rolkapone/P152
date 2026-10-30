import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createLocalPreferences,
  DEFAULT_PREFERENCES,
  PREFERENCE_KEYS,
  type PreferenceStorage,
} from "./localPreferences";

function memoryStorage(initial: Record<string, string> = {}): PreferenceStorage & {
  data: Map<string, string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const failing: PreferenceStorage = {
  getItem: () => {
    throw new DOMException("blocked", "SecurityError");
  },
  setItem: () => {
    throw new DOMException("full", "QuotaExceededError");
  },
  removeItem: () => {
    throw new DOMException("blocked", "SecurityError");
  },
};

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("local preferences (PreferencesRepository adapter)", () => {
  it("defaults to a visible tip when nothing is stored", () => {
    expect(createLocalPreferences(() => memoryStorage()).load()).toEqual(DEFAULT_PREFERENCES);
  });

  it("stores the dismissed tip and reads it back", () => {
    const storage = memoryStorage();
    const repository = createLocalPreferences(() => storage);
    repository.save({ ...DEFAULT_PREFERENCES, sceneTipDismissed: true });
    expect(storage.data.get(PREFERENCE_KEYS.sceneTipDismissed)).toBe("1");
    expect(createLocalPreferences(() => storage).load()).toEqual({
      ...DEFAULT_PREFERENCES,
      sceneTipDismissed: true,
    });
    repository.save({ ...DEFAULT_PREFERENCES, sceneTipDismissed: false });
    expect(storage.data.has(PREFERENCE_KEYS.sceneTipDismissed)).toBe(false);
  });

  it.each(["true", "0", "", "1 ", '{"__proto__":1}'])(
    "treats any other stored value (%j) as the default",
    (value) => {
      const storage = memoryStorage({ [PREFERENCE_KEYS.sceneTipDismissed]: value });
      expect(createLocalPreferences(() => storage).load().sceneTipDismissed).toBe(false);
    },
  );

  it("works without storage: blocked, full or absent", () => {
    for (const getStorage of [
      () => failing,
      () => null,
      () => {
        throw new DOMException("blocked", "SecurityError");
      },
    ]) {
      const repository = createLocalPreferences(getStorage);
      expect(repository.load()).toEqual({ ...DEFAULT_PREFERENCES, sceneTipDismissed: false });
      expect(() =>
        repository.save({ ...DEFAULT_PREFERENCES, sceneTipDismissed: true }),
      ).not.toThrow();
      expect(() =>
        repository.save({ ...DEFAULT_PREFERENCES, sceneTipDismissed: false }),
      ).not.toThrow();
    }
  });

  it("stores each collapsed panel under its own key", () => {
    const storage = memoryStorage();
    const repository = createLocalPreferences(() => storage);
    repository.save({ sceneTipDismissed: false, sidebarCollapsed: true, inspectorCollapsed: true });
    expect(storage.data.get(PREFERENCE_KEYS.sidebarCollapsed)).toBe("1");
    expect(storage.data.get(PREFERENCE_KEYS.inspectorCollapsed)).toBe("1");
    expect(storage.data.has(PREFERENCE_KEYS.sceneTipDismissed)).toBe(false);
    expect(createLocalPreferences(() => storage).load()).toEqual({
      sceneTipDismissed: false,
      sidebarCollapsed: true,
      inspectorCollapsed: true,
    });
    repository.save(DEFAULT_PREFERENCES);
    expect(storage.data.size).toBe(0);
  });

  it.each(["true", "open", "", '{"__proto__":1}'])(
    "treats any other stored value (%j) of a panel as open",
    (value) => {
      const storage = memoryStorage({ [PREFERENCE_KEYS.sidebarCollapsed]: value });
      expect(createLocalPreferences(() => storage).load().sidebarCollapsed).toBe(false);
    },
  );

  it("uses the browser localStorage by default", () => {
    const repository = createLocalPreferences();
    repository.save({ ...DEFAULT_PREFERENCES, sceneTipDismissed: true });
    expect(localStorage.getItem(PREFERENCE_KEYS.sceneTipDismissed)).toBe("1");
    expect(repository.load()).toEqual({ ...DEFAULT_PREFERENCES, sceneTipDismissed: true });
  });

  it("falls back to the defaults when reading window.localStorage throws", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const repository = createLocalPreferences();
    expect(repository.load()).toEqual({ ...DEFAULT_PREFERENCES, sceneTipDismissed: false });
    expect(() =>
      repository.save({ ...DEFAULT_PREFERENCES, sceneTipDismissed: true }),
    ).not.toThrow();
  });
});
