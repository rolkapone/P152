import { describe, expect, it } from "vitest";
import { IMPORT_ERROR_CODES } from "../../core/io/errors";
import { createI18n, resources } from "./config";

function keysOf(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keysOf(child, prefix === "" ? key : `${prefix}.${key}`),
  );
}

describe("i18n", () => {
  const i18n = createI18n();

  it("defaults to English with bundled resources", () => {
    expect(i18n.language).toBe("en");
    expect(i18n.resolvedLanguage).toBe("en");
    expect(i18n.t("app.name")).toBe("Deskfit");
  });

  it("has typed keys: an unknown key does not compile", () => {
    // @ts-expect-error "app.unknownKey" does not exist in locales/en/common.json
    expect(i18n.t("app.unknownKey")).toBe("app.unknownKey");
  });

  it("translates every import error code produced by core", () => {
    for (const code of IMPORT_ERROR_CODES) {
      const text = i18n.t(`errors:import.${code}`);
      expect(text).not.toBe(`import.${code}`);
      expect(text.length).toBeGreaterThan(0);
    }
    expect(i18n.t("errors:importDetail", { path: "objects[3].params.width" })).toBe(
      "Problem at objects[3].params.width.",
    );
  });

  it("does not escape interpolated values twice (React escapes them)", () => {
    expect(i18n.t("errors:importDetail", { path: "a&b" })).toBe("Problem at a&b.");
  });

  it("every language has exactly the keys of English", () => {
    const reference = keysOf(resources.en).sort();
    for (const language of Object.values(resources)) {
      expect(keysOf(language).sort()).toEqual(reference);
    }
  });
});
