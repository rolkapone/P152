import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

// Layer boundaries (ADR-APP-07), enforced with core ESLint rules (no extra plugin):
// core -> core only; state, persistence -> core; render -> core, state; ui -> core, state,
// render's public entry; app -> everything.
const THREE_PACKAGES = "^(three|@react-three/[^/]+)(/|$)";
const layers = (...names) => `(^|/)(${names.join("|")})(/|$)`;
const forbid = (regex, message) => ({ regex, message });
const boundary = (...patterns) => ["error", { patterns }];

// core/ uses a whitelist (ADR-APP-10): relative core/ modules only, plus zod through
// core/schema/zod.ts and the test tools in its own tests. Any other bare import fails.
const coreImports = (allowedBare) => [
  forbid(
    `^(?!\\.{1,2}/${allowedBare.map((name) => `|${name}$`).join("")})`,
    "core/ imports only core/ modules; zod only through core/schema/zod.ts (ADR-APP-07, ADR-APP-03).",
  ),
  forbid(
    layers("app", "ui", "render", "state", "persistence", "assets"),
    "core/ imports only core/ (ADR-APP-07).",
  ),
];
// Complements tsconfig.core.json (no DOM lib, no ambient types), which is the main guard.
const CORE_FORBIDDEN_GLOBALS = [
  ...["window", "document", "navigator", "location", "localStorage", "sessionStorage"],
  ...["indexedDB", "fetch", "XMLHttpRequest", "File", "Blob", "FileReader"],
  ...["globalThis", "self", "crypto", "process"],
].map((name) => ({ name, message: "core/ has no DOM nor I/O (ADR-APP-07)." }));
// Dynamic import, import.meta (bundler-specific) and require would bypass the import rules.
const CORE_FORBIDDEN_SYNTAX = [
  "error",
  { selector: "ImportExpression", message: "core/ has no dynamic import (ADR-APP-07)." },
  { selector: "MetaProperty", message: "core/ does not depend on the bundler (ADR-APP-07)." },
  { selector: "CallExpression[callee.name='require']", message: "core/ has no require." },
];
const CORE_FILES = "src/core/**/*.{ts,tsx,mts,cts}";
const CORE_TESTS = "src/core/**/*.test.{ts,tsx,mts,cts}";

// Visible UI text goes through i18n (ADR-APP-05). Core-rule substitute for
// eslint-plugin-i18next/no-literal-string until that plugin is adopted.
const TEXT_ATTRIBUTES =
  "alt|aria-label|aria-description|aria-placeholder|aria-roledescription|aria-valuetext|label|placeholder|title";
const TEXT_MESSAGE = "Visible text must come from i18n: use t('key') (ADR-APP-05).";
const ACCESSIBLE_TEXT_MESSAGE = "Accessible text must come from i18n: use t('key') (ADR-APP-05).";
// Only element children are visible text: `className={"foo"}` is not reported.
const JSX_CHILD = ":matches(JSXElement, JSXFragment) > JSXExpressionContainer";
const TEXT_ATTRIBUTE = `JSXAttribute[name.name=/^(${TEXT_ATTRIBUTES})$/]`;
const LETTERS = "/[A-Za-z]/";
const TEXT_LITERAL = `:matches(Literal[value=${LETTERS}], TemplateLiteral:has(TemplateElement[value.raw=${LETTERS}]))`;
const noLiteralText = [
  "error",
  { selector: `JSXText[value=${LETTERS}]`, message: TEXT_MESSAGE },
  { selector: `${JSX_CHILD} > ${TEXT_LITERAL}`, message: TEXT_MESSAGE },
  { selector: `${TEXT_ATTRIBUTE} > Literal`, message: ACCESSIBLE_TEXT_MESSAGE },
  {
    selector: `${TEXT_ATTRIBUTE} > JSXExpressionContainer > ${TEXT_LITERAL}`,
    message: ACCESSIBLE_TEXT_MESSAGE,
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
    files: [CORE_FILES],
    rules: {
      "no-restricted-imports": boundary(...coreImports([])),
      "no-restricted-globals": ["error", ...CORE_FORBIDDEN_GLOBALS],
      "no-restricted-syntax": CORE_FORBIDDEN_SYNTAX,
    },
  },
  {
    files: [CORE_TESTS],
    rules: { "no-restricted-imports": boundary(...coreImports(["vitest", "fast-check"])) },
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
