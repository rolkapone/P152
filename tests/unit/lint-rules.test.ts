// Checks that the guard-rail lint rules of ADR-APP-05/07/10 really fire (eslint.config.js).
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
