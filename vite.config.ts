/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { securityHeadersPlugin } from "./config/security-headers.mjs";

// Pure code (src/core, src/render/math, tests/unit) runs in Node, UI code in jsdom (ADR-APP-08).
const NODE_TESTS = [
  "src/core/**/*.test.ts",
  "src/render/math/**/*.test.ts",
  "tests/unit/**/*.test.ts",
];

export default defineConfig({
  plugins: [react(), securityHeadersPlugin()],
  build: { target: "es2023", sourcemap: false },
  test: {
    projects: [
      { extends: true, test: { name: "node", environment: "node", include: NODE_TESTS } },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/core/**", "src/render/math/**"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts"],
      // Ratchet (ADR-APP-08): never lowered. Global threshold added with the first UI (US-005).
      thresholds: {
        "src/core/**": { lines: 95, statements: 95, functions: 95, branches: 90 },
        "src/persistence/**": { lines: 90, statements: 90, functions: 90, branches: 90 },
        // First state/ module in US-004 (US-003 debt): same threshold as persistence/.
        "src/state/**": { lines: 90, statements: 90, functions: 90, branches: 90 },
        // Pure maths of the 3D view (camera limits, views, generators): same as core/.
        "src/render/math/**": { lines: 95, statements: 95, functions: 95, branches: 90 },
      },
    },
  },
});
