import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

// Layer boundaries (ADR-APP-07), enforced with core ESLint rules (no extra plugin):
// core -> core only; state, persistence -> core; render -> core, state; ui -> core, state,
// render's public entry; app -> everything.
const UI_PACKAGES = "^(react|react-dom|react-i18next|react-aria-components|i18next|zustand)(/|$)";
const THREE_PACKAGES = "^(three|@react-three/[^/]+)(/|$)";
const layers = (...names) => `(^|/)(${names.join("|")})(/|$)`;
const forbid = (regex, message) => ({ regex, message });
const boundary = (...patterns) => ["error", { patterns }];

const coreImports = [
  forbid(UI_PACKAGES, "core/ is pure TypeScript: no UI or state library (ADR-APP-07)."),
  forbid(THREE_PACKAGES, "core/ is pure TypeScript: no three.js (ADR-APP-07)."),
  forbid(
    layers("app", "ui", "render", "state", "persistence"),
    "core/ imports only core/ (ADR-APP-07).",
  ),
];
const CORE_FORBIDDEN_GLOBALS = [
  ...["window", "document", "navigator", "location", "localStorage", "sessionStorage"],
  ...["indexedDB", "fetch", "XMLHttpRequest", "File", "Blob", "FileReader"],
].map((name) => ({ name, message: "core/ has no DOM nor I/O (ADR-APP-07)." }));
const ZOD_ENTRY = {
  name: "zod",
  message: "Import z from core/schema/zod (jitless configuration, ADR-APP-03).",
};

// Visible UI text goes through i18n (ADR-APP-05). Core-rule substitute for
// eslint-plugin-i18next/no-literal-string until that plugin is adopted.
const TEXT_ATTRIBUTES =
  "alt|aria-label|aria-description|aria-placeholder|aria-roledescription|aria-valuetext|label|placeholder|title";
const noLiteralText = [
  "error",
  {
    selector: "JSXText[value=/[A-Za-z]/]",
    message: "Visible text must come from i18n: use t('key') (ADR-APP-05).",
  },
  {
    selector: "JSXExpressionContainer > Literal[value=/[A-Za-z]/]",
    message: "Visible text must come from i18n: use t('key') (ADR-APP-05).",
  },
  {
    selector: `JSXAttribute[name.name=/^(${TEXT_ATTRIBUTES})$/] > Literal`,
    message: "Accessible text must come from i18n: use t('key') (ADR-APP-05).",
  },
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
    files: ["src/core/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: [ZOD_ENTRY], patterns: coreImports }],
      "no-restricted-globals": ["error", ...CORE_FORBIDDEN_GLOBALS],
    },
  },
  {
    files: ["src/core/schema/zod.ts"],
    rules: { "no-restricted-imports": ["error", { patterns: coreImports }] },
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
    rules: {
      "no-restricted-imports": boundary(
        forbid(
          layers("app", "ui", "persistence"),
          "render/ imports core/ and state/ only (ADR-APP-07).",
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
    rules: { "no-restricted-syntax": noLiteralText },
  },
  { files: ["**/*.{js,mjs}"], languageOptions: { globals: globals.node } },
  prettier,
);
