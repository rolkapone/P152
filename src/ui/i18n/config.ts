/**
 * i18n (ADR-APP-05): i18next + react-i18next, English bundled, other languages to be
 * lazy-loaded when they exist. Keys are typed from the `en` files (see i18next.d.ts).
 */
import i18next, { type i18n } from "i18next";
import { initReactI18next } from "react-i18next";
import common from "../../locales/en/common.json";
import errors from "../../locales/en/errors.json";

export const defaultNS = "common";
export const namespaces = ["common", "errors"] as const;

export const resources = {
  en: { common, errors },
} as const;

export type Language = keyof typeof resources;
export const DEFAULT_LANGUAGE: Language = "en";

/**
 * Creates and initialises an i18next instance (synchronous: resources are bundled).
 * A fresh instance per call keeps tests isolated; the app calls it once.
 */
export function createI18n(language: Language = DEFAULT_LANGUAGE): i18n {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: Object.keys(resources),
    ns: namespaces,
    defaultNS,
    resources,
    initAsync: false,
    // React already escapes text; rich text goes through <Trans> with explicit components.
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}
