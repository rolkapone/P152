import { afterEach, describe, expect, it } from "vitest";
import { createI18n } from "./config";
import { applyDocumentLanguage } from "./document";

afterEach(() => {
  document.documentElement.removeAttribute("lang");
  document.title = "";
});

describe("applyDocumentLanguage", () => {
  it("sets lang=en and the page title from i18n (UX-3)", () => {
    applyDocumentLanguage(document, createI18n());
    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe("Deskfit - Plan your desk setup");
  });
});
