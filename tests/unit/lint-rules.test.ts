// Checks that the guard-rail lint rules of ADR-APP-05/07/10 really fire (eslint.config.js).
import { readFileSync } from "node:fs";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint();

async function ruleIds(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((message) => message.ruleId ?? "fatal");
}

describe("layer boundaries (ADR-APP-07)", () => {
  it.each([
    ['import { useState } from "react";', "react"],
    ['import { Mesh } from "three";', "three"],
    ['import { Canvas } from "@react-three/fiber";', "R3F"],
    ['import { create } from "zustand";', "zustand"],
    ['import { dispatch } from "../../state";', "state/"],
    ['import { Viewport } from "../render/index";', "render/"],
    ['import { App } from "../../app/App";', "app/"],
    ['import * as z from "zod";', "zod outside core/schema/zod.ts"],
    ['import { Button } from "react-aria-components";', "any other bare import (whitelist)"],
    ['import { readFileSync } from "node:fs";', "node built-ins"],
    ['import { it } from "vitest";', "test tools outside tests"],
    ['import desk from "../../../assets/catalog/object-types/desk.json";', "assets/"],
  ])("core/ rejects %s (%s)", async (code) => {
    expect(await ruleIds(`${code}\n`, "src/core/catalog/x.ts")).toContain("no-restricted-imports");
  });

  it.each([
    ['import { a } from "../../../node_modules/zustand";', "node_modules by relative path"],
    ['import { a } from "../../locales/en/errors.json";', "src/locales"],
    ['import { a } from "../../locales";', "src/locales entry"],
    ['import { a } from "../../../tests/unit/helpers/fixtures";', "tests/"],
    ['import { a } from "../../main";', "src/main"],
    ['import { a } from "../../main.tsx";', "src/main.tsx"],
  ])("core/ rejects the relative path %s (%s)", async (code) => {
    expect(await ruleIds(`${code}\nexport { a };\n`, "src/core/io/x.ts")).toContain(
      "no-restricted-imports",
    );
  });

  it("core/ tests may import the shared fixtures of tests/, not node_modules nor locales", async () => {
    const fixtures = 'import { a } from "../../../tests/unit/helpers/fixtures";\nexport { a };\n';
    expect(await ruleIds(fixtures, "src/core/io/x.test.ts")).toEqual([]);
    for (const path of ["../../../node_modules/three", "../../locales/en/errors.json"]) {
      const code = `import { a } from "${path}";\nexport { a };\n`;
      expect(await ruleIds(code, "src/core/io/x.test.ts")).toContain("no-restricted-imports");
    }
  });

  it.each([
    ["export const C = () => <div>hi</div>;", "JSX element (automatic runtime)"],
    ["export const C = () => <>hi</>;", "JSX fragment"],
  ])("core/ rejects %s (%s)", async (code) => {
    expect(await ruleIds(`${code}\n`, "src/core/x.tsx")).toContain("no-restricted-syntax");
  });

  it("tsconfig.core.json also refuses JSX in core/ (no implicit jsx-runtime import)", () => {
    const config = JSON.parse(readFileSync("tsconfig.core.json", "utf8")) as {
      compilerOptions: { jsx?: string; types?: string[] };
    };
    expect(config.compilerOptions.jsx).toBe("preserve");
    expect(config.compilerOptions.types).toEqual([]);
  });

  it("core/ accepts new.target (only import.meta is a meta-property to refuse)", async () => {
    const code = "export function f() {\n  return new.target;\n}\n";
    expect(await ruleIds(code, "src/core/x.ts")).toEqual([]);
  });

  it.each([
    ["src/core/x.tsx", 'import { useState } from "react";'],
    ["src/core/x.mts", 'import { Mesh } from "three";'],
    ["src/core/x.cts", 'import { create } from "zustand";'],
  ])("core/ rules also apply to %s", async (filePath, code) => {
    expect(await ruleIds(`${code}\nexport {};\n`, filePath)).toContain("no-restricted-imports");
  });

  it.each([
    ['export const load = () => import("three");', "dynamic import"],
    ["export const env = import.meta.url;", "import.meta"],
    ['export const lib: unknown = require("react");', "require"],
    ['export type FC = import("react").FC;', "import type expression"],
  ])("core/ rejects %s (%s), in .ts and .tsx", async (code) => {
    expect(await ruleIds(`${code}\n`, "src/core/x.ts")).toContain("no-restricted-syntax");
    expect(await ruleIds(`${code}\n`, "src/core/x.tsx")).toContain("no-restricted-syntax");
  });

  it("core/ has no DOM nor I/O globals", async () => {
    const code =
      "export const n = localStorage.length + window.innerWidth + globalThis.length + self.length;\n";
    const ids = await ruleIds(code, "src/core/x.ts");
    expect(ids.filter((id) => id === "no-restricted-globals")).toHaveLength(4);
  });

  it("core/ may import core/ and zod through its single entry", async () => {
    expect(
      await ruleIds('import { z } from "../schema/zod";\nexport { z };\n', "src/core/io/x.ts"),
    ).toEqual([]);
    expect(
      await ruleIds('import * as z from "zod";\nexport { z };\n', "src/core/schema/zod.ts"),
    ).toEqual([]);
  });

  it("core/ tests may import the test tools", async () => {
    const code = 'import { it } from "vitest";\nimport fc from "fast-check";\nexport { fc, it };\n';
    expect(await ruleIds(code, "src/core/io/x.test.ts")).toEqual([]);
  });

  it.each([
    ['import { x } from "../persistence";', "src/state/x.ts"],
    ['import { x } from "../state";', "src/persistence/x.ts"],
    ['import { x } from "../ui/components";', "src/render/x.ts"],
    ['import { Mesh } from "three";', "src/ui/x.ts"],
    ['import { x } from "../render/generators/desk";', "src/ui/x.ts"],
    ['import { x } from "../persistence";', "src/ui/x.ts"],
  ])("rejects %s in %s", async (code, filePath) => {
    expect(await ruleIds(`${code}\nexport { x };\n`, filePath)).toContain("no-restricted-imports");
  });

  it("ui/ may import the public entry of render/ and core/", async () => {
    const code = 'import { a } from "../render";\nimport { b } from "../core";\nexport { a, b };\n';
    expect(await ruleIds(code, "src/ui/x.ts")).toEqual([]);
  });
});

describe("no hard-coded UI text (ADR-APP-05)", () => {
  it.each([
    ["export const A = () => <p>Hello</p>;", "JSX text"],
    ['export const A = () => <p>{"Hello"}</p>;', "string expression"],
    ["export const A = () => <p>{`Hello`}</p>;", "template literal child"],
    ["export const A = () => <>{`Hello ${1}`}</>;", "template literal in a fragment"],
    ['export const A = () => <button aria-label="Close" />;', "aria-label"],
    ['export const A = () => <button aria-label={"Close"} />;', "aria-label expression"],
    ["export const A = () => <input placeholder={`Search`} />;", "placeholder template"],
    ['export const A = () => <img alt="Desk" src="x.png" />;', "alt"],
  ])("rejects %s (%s)", async (code) => {
    expect(await ruleIds(`${code}\n`, "src/ui/studio/A.tsx")).toContain("no-restricted-syntax");
  });

  it("accepts translated text and non-text attributes", async () => {
    const code =
      'declare const t: (k: string) => string;\nexport const A = () => <p className="x" aria-label={t("a")}>{t("b")} 42</p>;\n';
    expect(await ruleIds(code, "src/ui/studio/A.tsx")).toEqual([]);
  });

  it("does not report non-text attributes written as expressions", async () => {
    const code =
      'declare const n: number;\nexport const A = () => <p className={"foo"} data-id={`row-${n}`}>{`${n}`} {"-"}</p>;\n';
    expect(await ruleIds(code, "src/ui/studio/A.tsx")).toEqual([]);
  });
});
