// Single source of truth for the HTTP security headers (ADR-OPS-06, SEC-03a).
// Used by: the Vite plugin below (dist/_headers at build, same headers on `vite preview`
// and on the E2E server), tests/unit/security-headers.test.ts and the CI check
// (sec-build-hardening). Any change goes first in ADR-OPS-06 (docs/architecture.md).
// Plain JS (.mjs) so that it loads without a TS toolchain; types in security-headers.d.mts.

export const CSP_DIRECTIVES = Object.freeze({
  "default-src": ["'self'"],
  "script-src": ["'self'"],
  "style-src": ["'self'"],
  "img-src": ["'self'", "blob:", "data:"],
  "connect-src": ["'self'"],
  "worker-src": ["'self'", "blob:"],
  "object-src": ["'none'"],
  "base-uri": ["'none'"],
  "form-action": ["'none'"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": [],
});

export const CSP = Object.entries(CSP_DIRECTIVES)
  .map(([name, sources]) => [name, ...sources].join(" "))
  .join("; ");

/** Headers sent on every response. */
export const SECURITY_HEADERS = Object.freeze({
  "Content-Security-Policy": CSP,
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Strict-Transport-Security": "max-age=31536000",
});

/** Cloudflare Pages `_headers` rules (path -> headers), in addition to the global ones. */
export const CACHE_RULES = Object.freeze([
  ["/assets/*", { "Cache-Control": "public, max-age=31536000, immutable" }],
  ["/index.html", { "Cache-Control": "no-cache" }],
]);

/** Content of the `_headers` file (LF line endings, trailing newline). */
export function renderHeadersFile() {
  const block = (path, headers) =>
    [path, ...Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`)].join("\n");
  return (
    [
      "# Generated from config/security-headers.mjs (SEC-03a). Do not edit.",
      block("/*", SECURITY_HEADERS),
      ...CACHE_RULES.map(([path, headers]) => block(path, headers)),
    ].join("\n") + "\n"
  );
}

/**
 * Vite plugin: emits `_headers` in the build output and applies the global headers to
 * `vite preview` (production build and dist-e2e). Not applied to `vite dev`: HMR needs inline
 * script (ADR-OPS-06). HSTS is sent too (browsers ignore it over http://localhost).
 */
export function securityHeadersPlugin() {
  return {
    name: "p152-security-headers",
    apply: () => true,
    config: () => ({ preview: { headers: { ...SECURITY_HEADERS } } }),
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "_headers", source: renderHeadersFile() });
    },
  };
}
