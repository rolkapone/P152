import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import p152 from "./config/eslint-plugin-p152.mjs";

// Layer boundaries (ADR-APP-07), enforced with core ESLint rules (no extra plugin):
// core -> core only; state, persistence -> core; render -> core, state; ui -> core, state,
// render's public entry; app -> everything.
const THREE_PACKAGES = "^(three|@react-three/[^/]+)(/|$)";
const layers = (...names) => `(^|/)(${names.join("|")})(/|$)`;
const forbid = (regex, message) => ({ regex, message });
const boundary = (...patterns) => ["error", { patterns }];
const RENDER_BOUNDARY = forbid(
  layers("app", "ui", "persistence"),
  "render/ imports core/ and state/ only (ADR-APP-07).",
);
const RENDER_MATH_FORBIDDEN =
  "^(three|react|react-dom|@react-three/[^/]+|camera-controls)(/|$)|(^|/)render/scene(/|$)|^\\.\\./scene(/|$)";

// core/ uses a whitelist (ADR-APP-10): relative core/ modules only, plus zod through
// core/schema/zod.ts and the test tools in its own tests. Any other bare import fails.
// Relative paths ("./x", "../x", "." and "..") are checked on their resolved path by
// p152/core-relative-imports: they must stay in src/core (core/ tests may also reach the
// shared fixtures of tests/). The text patterns below are a second line of defence:
// relative paths may not name node_modules, the other layers, src/locales, tests/, src/main.
const coreImports = (allowedBare, { isTest = false } = {}) => [
  forbid(
    `^(?!\\.{1,2}(/|$)${allowedBare.map((name) => `|${name}$`).join("")})`,
    "core/ imports only core/ modules; zod only through core/schema/zod.ts (ADR-APP-07, ADR-APP-03).",
  ),
  forbid(
    layers("app", "ui", "render", "state", "persistence", "assets"),
    "core/ imports only core/ (ADR-APP-07).",
  ),
  forbid("(^|/)node_modules(/|$)", "core/ imports packages by name only (ADR-APP-10)."),
  forbid(
    `(^|/)(locales|${isTest ? "" : "tests|"}main)(/|\\.|$)`,
    "core/ imports only core/ (ADR-APP-07).",
  ),
];
// Complements tsconfig.core.json (no DOM lib, no ambient types), which is the main guard.
const CORE_FORBIDDEN_GLOBALS = [
  ...["window", "document", "navigator", "location", "localStorage", "sessionStorage"],
  ...["indexedDB", "fetch", "XMLHttpRequest", "File", "Blob", "FileReader"],
  ...["globalThis", "self", "crypto", "process"],
].map((name) => ({ name, message: "core/ has no DOM nor I/O (ADR-APP-07)." }));
// Dynamic import, `import("x").T` types, import.meta (bundler-specific) and require would
// bypass the import rules.
// JSX compiles to an implicit react/jsx-runtime import (also refused by tsconfig.core.json).
// Known limit: an aliased require (`const r = require; r("x")`) is not caught (ADR-APP-10).
const CORE_FORBIDDEN_SYNTAX = [
  "error",
  { selector: "ImportExpression", message: "core/ has no dynamic import (ADR-APP-07)." },
  { selector: "TSImportType", message: "core/ imports only core/ (ADR-APP-07)." },
  {
    selector: "MetaProperty[meta.name='import']",
    message: "core/ does not depend on the bundler (ADR-APP-07).",
  },
  { selector: "CallExpression[callee.name='require']", message: "core/ has no require." },
  { selector: "JSXElement, JSXFragment", message: "core/ has no JSX nor React (ADR-APP-07)." },
];
const CORE_FILES = "src/core/**/*.{ts,tsx,mts,cts}";
const CORE_TESTS = "src/core/**/*.test.{ts,tsx,mts,cts}";

// Visible UI text goes through i18n (ADR-APP-05): local rule p152/no-literal-text
// (ADR-APP-10). Element children and these attributes are text, also through a ternary,
// `&&`, `||`, `??` or a `+` concatenation; other attributes (`className={"foo"}`) are free.
const TEXT_ATTRIBUTES = [
  ...["alt", "aria-label", "aria-description", "aria-placeholder", "aria-roledescription"],
  ...["aria-valuetext", "label", "placeholder", "title"],
];

export default tseslint.config(
  {
    ignores: [
      "dist",
      "dist-e2e",
      "playwright-report",
      "test-results",
      "coverage",
      "docs",
      ".claude",
      "_claude-setup",
      "assets",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  },
  { files: ["**/*.tsx"], ...jsxA11y.flatConfigs.recommended },
  {
    files: [CORE_FILES],
    plugins: { p152 },
    rules: {
      "p152/core-relative-imports": "error",
      "no-restricted-imports": boundary(...coreImports([])),
      "no-restricted-globals": ["error", ...CORE_FORBIDDEN_GLOBALS],
      "no-restricted-syntax": CORE_FORBIDDEN_SYNTAX,
    },
  },
  {
    files: [CORE_TESTS],
    rules: {
      "p152/core-relative-imports": ["error", { allowOutside: ["tests"] }],
      "no-restricted-imports": boundary(...coreImports(["vitest", "fast-check"], { isTest: true })),
    },
  },
  {
    files: ["src/core/schema/zod.ts"],
    rules: { "no-restricted-imports": boundary(...coreImports(["zod"])) },
  },
  {
    files: ["src/state/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": boundary(
        forbid(THREE_PACKAGES, "state/ never touches three.js (ADR-APP-07)."),
        forbid(
          layers("app", "ui", "render", "persistence"),
          "state/ imports only core/ (ADR-APP-07).",
        ),
      ),
    },
  },
  {
    files: ["src/persistence/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": boundary(
        forbid(THREE_PACKAGES, "persistence/ never touches three.js (ADR-APP-07)."),
        forbid(
          layers("app", "ui", "render", "state"),
          "persistence/ imports only core/ (ADR-APP-07).",
        ),
      ),
    },
  },
  {
    files: ["src/render/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": boundary(RENDER_BOUNDARY) },
  },
  {
    // render/math is pure (ADR-3D-07): tested in Node, no three.js, React nor camera-controls.
    files: ["src/render/math/**/*.{ts,tsx,mts,cts}"],
    rules: {
      "no-restricted-imports": boundary(
        RENDER_BOUNDARY,
        forbid(
          RENDER_MATH_FORBIDDEN,
          "render/math/ is pure: no three.js, React nor camera-controls.",
        ),
      ),
    },
  },
  {
    files: ["src/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": boundary(
        forbid(THREE_PACKAGES, "ui/ never touches three.js objects (ADR-APP-07)."),
        forbid(layers("app", "persistence"), "ui/ does not import app/ nor adapters (ADR-APP-07)."),
        forbid("(^|/)render/.+", "ui/ uses only the public entry of render/ (ADR-APP-07)."),
      ),
    },
  },
  {
    files: ["src/ui/**/*.tsx", "src/app/**/*.tsx"],
    ignores: ["**/*.test.tsx"],
    plugins: { p152 },
    rules: { "p152/no-literal-text": ["error", { textAttributes: TEXT_ATTRIBUTES }] },
  },
  { files: ["**/*.{js,mjs}"], languageOptions: { globals: globals.node } },
  prettier,
);
