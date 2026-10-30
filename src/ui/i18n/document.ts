/**
 * Document-level text (ADR-APP-05, WCAG 3.1.1 and 2.4.2): `<html lang>` and the page title
 * follow the active language. Called once by src/main.tsx, and again on a language change.
 */
import type { i18n } from "i18next";
import { DEFAULT_LANGUAGE } from "./config";

export function applyDocumentLanguage(doc: Document, instance: i18n): void {
  doc.documentElement.lang = instance.resolvedLanguage ?? DEFAULT_LANGUAGE;
  doc.title = instance.t("app.title", { appName: instance.t("app.name") });
}
