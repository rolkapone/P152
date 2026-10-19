import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

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
  { files: ["**/*.{js,mjs}"], languageOptions: { globals: globals.node } },
  prettier,
);
