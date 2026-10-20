/**
 * Browser capabilities and preferences read by the 3D view. DOM only, no three.js: this
 * module is in the main chunk, so the WebGL 2 check runs before the 3D code is downloaded.
 */
import { useSyncExternalStore } from "react";
import type { QualityTier, ThemeName } from "../core";

/** True if the browser can create a WebGL 2 context (three.js r163+ requires WebGL 2). */
export function detectWebGL2(doc: Document = document): boolean {
  try {
    const canvas = doc.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (gl === null) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Coarse device class: touch-first devices start on the mobile tier (ADR-3D-08). */
export function isMobileDevice(win: Window = window): boolean {
  const nav = win.navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  if (typeof nav.userAgentData?.mobile === "boolean") return nav.userAgentData.mobile;
  const coarse =
    typeof win.matchMedia === "function" && win.matchMedia("(pointer: coarse)").matches;
  return coarse && win.innerWidth < 1024;
}

export function initialQualityTier(
  defaults: { readonly desktop: QualityTier; readonly mobile: QualityTier },
  win: Window = window,
): QualityTier {
  return isMobileDevice(win) ? defaults.mobile : defaults.desktop;
}

/** `matchMedia` may be missing (old embedded browsers, test DOMs): no preference then. */
function mediaQuery(query: string): MediaQueryList | null {
  return typeof window.matchMedia === "function" ? window.matchMedia(query) : null;
}

function mediaQueryStore(query: string) {
  return {
    subscribe(onChange: () => void) {
      const list = mediaQuery(query);
      list?.addEventListener("change", onChange);
      return () => list?.removeEventListener("change", onChange);
    },
    get: () => mediaQuery(query)?.matches ?? false,
  };
}

const reducedMotion = mediaQueryStore("(prefers-reduced-motion: reduce)");
const darkScheme = mediaQueryStore("(prefers-color-scheme: dark)");

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(reducedMotion.subscribe, reducedMotion.get, () => false);
}

/**
 * Theme of the page: `<html data-theme="light|dark">` when the user chose one (US-005,
 * design-system §2), otherwise the system preference.
 */
export function currentTheme(doc: Document = document): ThemeName {
  const chosen = doc.documentElement.dataset["theme"];
  if (chosen === "light" || chosen === "dark") return chosen;
  return darkScheme.get() ? "dark" : "light";
}

function subscribeTheme(onChange: () => void): () => void {
  const unsubscribe = darkScheme.subscribe(onChange);
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => {
    unsubscribe();
    observer.disconnect();
  };
}

export function useTheme(): ThemeName {
  return useSyncExternalStore(
    subscribeTheme,
    () => currentTheme(),
    () => "light",
  );
}
