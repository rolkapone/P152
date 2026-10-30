// Checks that the guard-rail lint rules of ADR-APP-05/07/10 really fire (eslint.config.js).
import { resolve } from "node:path";
import { ESLint } from "eslint";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const eslint = new ESLint();

async function ruleIds(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((message) => message.ruleId ?? "fatal");
}

const coreConfig = ts.getParsedCommandLineOfConfigFile(
  resolve("tsconfig.core.json"),
  {},
  { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} },
);
const libFiles = new Map<string, ts.SourceFile | undefined>();

/** Error codes of `tsc -p tsconfig.core.json` on an in-memory module of src/core/. */
function coreCompileErrors(code: string, extension: "ts" | "tsx"): number[] {
  if (!coreConfig) throw new Error("tsconfig.core.json unreadable");
  const options = coreConfig.options;
  const host = ts.createCompilerHost(options, true);
  const file = resolve(`src/core/__compile_probe__.${extension}`).replaceAll("\\", "/");
  const probeHost: ts.CompilerHost = {
    ...host,
    fileExists: (name) => name === file || host.fileExists(name),
    readFile: (name) => (name === file ? code : host.readFile(name)),
    getSourceFile: (name, language, ...rest) => {
      if (name === file) return ts.createSourceFile(name, code, language);
      if (!libFiles.has(name)) libFiles.set(name, host.getSourceFile(name, language, ...rest));
      return libFiles.get(name);
    },
  };
  const program = ts.createProgram({ rootNames: [file], options, host: probeHost });
  return ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .map((diagnostic) => diagnostic.code);
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

  it.each([
    ['import { a } from "..";', "src/core/catalog/x.ts", "parent index inside core/"],
    ['import { a } from "../..";', "src/core/catalog/sub/x.ts", "grand-parent inside core/"],
    ['import { a } from "../";', "src/core/catalog/x.ts", "parent with a trailing slash"],
    ['import { a } from ".";', "src/core/catalog/x.ts", "own folder index"],
    ['import { a } from "./../io";', "src/core/catalog/x.ts", "non-normalized, stays in core/"],
    ['export { a } from "..";', "src/core/catalog/x.ts", "re-export from the parent"],
    ['export * from "../io";', "src/core/catalog/x.ts", "export * from a sibling"],
  ])("core/ accepts the relative path %s in %s (%s)", async (code, filePath) => {
    const source = code.startsWith("export") ? `${code}\n` : `${code}\nexport { a };\n`;
    expect(await ruleIds(source, filePath)).toEqual([]);
  });

  it.each([
    ['import { a } from "..";', "src/core/x.ts", "parent of core/ is src/"],
    ['import { a } from "../..";', "src/core/catalog/x.ts", "src/ through '../..'"],
    ['import { a } from "./../..";', "src/core/catalog/x.ts", "non-normalized escape"],
    ['import { a } from "../io/../../..";', "src/core/catalog/x.ts", "escape after a segment"],
    ['import { a } from "../../config/security-headers.mjs";', "src/core/x.ts", "unlisted dir"],
    ['export { a } from "..";', "src/core/x.ts", "re-export from outside core/"],
    ['export * from "../..";', "src/core/catalog/x.ts", "export * from outside core/"],
  ])("core/ rejects the relative path %s in %s (%s)", async (code, filePath) => {
    const source = code.startsWith("export") ? `${code}\n` : `${code}\nexport { a };\n`;
    expect(await ruleIds(source, filePath)).toContain("p152/core-relative-imports");
  });

  it("core/ tests may leave core/ only towards tests/", async () => {
    const fixtures = 'import { a } from "../../../tests/unit/helpers/fixtures";\nexport { a };\n';
    expect(await ruleIds(fixtures, "src/core/io/x.test.ts")).toEqual([]);
    const config = 'import { a } from "../../../config/security-headers.mjs";\nexport { a };\n';
    expect(await ruleIds(config, "src/core/io/x.test.ts")).toContain("p152/core-relative-imports");
    expect(await ruleIds(fixtures, "src/core/io/x.ts")).toContain("p152/core-relative-imports");
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

  describe("tsconfig.core.json compiles core/ as pure TypeScript (real compilation)", () => {
    it("refuses JSX: error TS7026, no implicit react/jsx-runtime import", () => {
      const codes = coreCompileErrors("export const C = () => <div>hi</div>;\n", "tsx");
      expect(codes).toContain(7026);
    });

    it("refuses DOM globals (no DOM lib nor ambient types)", () => {
      expect(coreCompileErrors("export const t = document.title;\n", "ts")).not.toEqual([]);
    });

    it("compiles plain TypeScript without error (the harness itself works)", () => {
      const code = "export const n: number = [1, 2].at(-1) ?? 0;\n";
      expect(coreCompileErrors(code, "ts")).toEqual([]);
      expect(coreCompileErrors(code, "tsx")).toEqual([]);
    });
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

  it.each([
    ['import x = require("..");', "src/core/x.ts", "outside core/"],
    ['import x = require("../io");', "src/core/catalog/x.ts", "even inside core/"],
  ])("core/ rejects the TypeScript import-equals %s in %s (%s)", async (code, filePath) => {
    expect(await ruleIds(`${code}\nexport { x };\n`, filePath)).toContain(
      "@typescript-eslint/no-require-imports",
    );
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

  it.each([
    ['import { Vector3 as x } from "three";', "three"],
    ['import { MathUtils as x } from "three/src/math/MathUtils.js";', "three subpath"],
    ['import { useMemo as x } from "react";', "react"],
    ['import { useFrame as x } from "@react-three/fiber";', "R3F"],
    ['import { Bounds as x } from "@react-three/drei";', "drei"],
    ['import x from "camera-controls";', "camera-controls"],
    ['import { ViewRig as x } from "../scene/viewRig";', "render/scene"],
    ['import { x } from "../../ui/components";', "ui/ (render boundary kept)"],
  ])("render/math/ stays pure: rejects %s (%s)", async (code) => {
    expect(await ruleIds(`${code}\nexport { x };\n`, "src/render/math/x.ts")).toContain(
      "no-restricted-imports",
    );
  });

  it("render/math/ may import core/, state/ and its own modules; render/scene may use three", async () => {
    const math =
      'import { a } from "../../core";\nimport { b } from "./units";\nimport { c } from "../../state";\nexport { a, b, c };\n';
    expect(await ruleIds(math, "src/render/math/x.ts")).toEqual([]);
    const scene = 'import { Vector3 } from "three";\nexport { Vector3 };\n';
    expect(await ruleIds(scene, "src/render/scene/x.ts")).toEqual([]);
  });

  it("ui/ may import the public entry of render/ and core/", async () => {
    const code = 'import { a } from "../render";\nimport { b } from "../core";\nexport { a, b };\n';
    expect(await ruleIds(code, "src/ui/x.ts")).toEqual([]);
  });
});

// Free identifiers of the samples (components and helpers), declared so that only the rule
// under test can report.
const DECLARATIONS = [
  'import type { FC } from "react";',
  "declare const t: () => string;",
  "declare const f: (id: string) => string;",
  "declare const Panel: FC<Record<string, unknown>>;",
  "declare const Tooltip: FC<Record<string, unknown>>;",
  "declare const Empty: FC<Record<string, unknown>>;",
  "declare const Note: FC<Record<string, unknown>>;",
  "declare const Card: FC<Record<string, unknown>>;",
  "declare const Aria: { Tab: FC<Record<string, unknown>> };",
  "export { t, f, Panel, Tooltip, Empty, Note, Card, Aria };",
  "",
].join("\n");

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
    ['export const A = ({ c }: { c: boolean }) => <p>{c ? "Yes" : "No"}</p>;', "ternary"],
    ["export const A = ({ c }: { c: boolean }) => <p>{c ? t() : `No`}</p>;", "ternary template"],
    ['export const A = ({ c }: { c: boolean }) => <p>{c && "Yes"}</p>;', "&&"],
    ['export const A = ({ s }: { s?: string }) => <p>{s || "None"}</p>;', "||"],
    ['export const A = ({ s }: { s?: string }) => <p>{s ?? "None"}</p>;', "??"],
    ['export const A = ({ n }: { n: number }) => <p>{"Total: " + n}</p>;', "concatenation"],
    ['export const A = ({ n }: { n: number }) => <p>{n + " items"}</p>;', "concatenation right"],
    ['export const A = () => <p>{"Hello" as string}</p>;', "type assertion"],
    ['export const A = ({ c }: { c: boolean }) => <p>{`${c ? "on" : "off"}`}</p>;', "in template"],
    [
      'export const A = ({ a, b }: { a: boolean; b: boolean }) => <p>{a ? t() : b ? "B" : t()}</p>;',
      "nested ternary",
    ],
    [
      'export const A = ({ c }: { c: boolean }) => <img alt={c ? "On" : "Off"} src="x" />;',
      "alt ternary",
    ],
    [
      'export const A = ({ s }: { s?: string }) => <button aria-label={s ?? "Close"} />;',
      "aria ??",
    ],
    ['export const A = ({ n }: { n: number }) => <button title={"Item " + n} />;', "title concat"],
    ['export const A = ({ xs }: { xs: number[] }) => <ul>{xs.map(() => "Item")}</ul>;', "callback"],
    [
      'export const A = ({ xs }: { xs: number[] }) => <ul>{xs.map(() => { return "Item"; })}</ul>;',
      "callback with a block body",
    ],
    ['export const A = () => <p>{["Hello"]}</p>;', "array"],
    ['export const A = () => <p>{[t(), ...["Hello"]]}</p>;', "spread array"],
    ['export const A = () => <p>{String("Hello")}</p>;', "String()"],
    ['export const A = ({ n }: { n: number }) => <p>{"Total ".concat(String(n))}</p>;', "concat"],
    ['export const A = () => <p>{["a", "b"].join(" and ")}</p>;', "join"],
    ['export const A = () => <p>{"hello".toUpperCase()}</p>;', "string method"],
    ['export const A = () => <p>{(() => "Hello")()}</p>;', "IIFE"],
    ["export const A = () => <p>{String.raw`Hello`}</p>;", "tagged template"],
    ['export const A = () => <Card>{() => "Open"}</Card>;', "render prop"],
    ['export const A = () => <p>{"Été"}</p>;', "accented letters"],
    ['export const A = () => <p>{"日本語"}</p>;', "CJK"],
    ["export const A = () => <p>é</p>;", "accented JSX text"],
    ['export const A = () => <button aria-label="Fermer à droite" />;', "non-ASCII aria-label"],
    ['export const A = () => <Panel heading="Desk" />;', "component heading"],
    ['export const A = () => <Tooltip content="Reset view" />;', "component content"],
    ['export const A = () => <Panel toggleLabel="Hide sidebar" />;', "prefixed text prop"],
    ['export const A = () => <Empty emptyTitle={"No objects"} />;', "prefixed title"],
    ['export const A = ({ c }: { c: boolean }) => <Note message={c ? "A" : "B"} />;', "message"],
    ['export const A = () => <Aria.Tab textValue="Desk" />;', "member component textValue"],
    ["export const A = () => <Card description={`Wide`} />;", "description template"],
    ['export const A = () => <Card children="Hi" />;', "children prop"],
  ])("rejects %s (%s)", async (code) => {
    const source = `${DECLARATIONS}${code}\n`;
    expect(await ruleIds(source, "src/ui/studio/A.tsx")).toContain("p152/no-literal-text");
    expect(await ruleIds(source, "src/app/A.tsx")).toContain("p152/no-literal-text");
    expect(await ruleIds(source, "src/render/scene/A.tsx")).toContain("p152/no-literal-text");
  });

  it.each([
    [
      'export const A = ({ c }: { c: boolean }) => <p>{c === "open" ? t() : t()}</p>;',
      "test of a ternary",
    ],
    [
      'export const A = ({ s }: { s: string }) => <p>{s === "ready" && t()}</p>;',
      "condition of &&",
    ],
    [
      'export const A = ({ c }: { c: boolean }) => <p className={c ? "on" : "off"}>{t()}</p>;',
      "className ternary",
    ],
    [
      'export const A = ({ n }: { n: number }) => <p data-id={"row-" + n}>{n - 1}</p>;',
      "data-* concat, minus",
    ],
    ["export const A = ({ c }: { c: boolean }) => <p>{c ? t() : null}</p>;", "translated ternary"],
    ['export const A = ({ n }: { n: number }) => <p>{n + " / " + n}</p>;', "punctuation only"],
    ['export const A = () => <img alt="" src="x.png" />;', "decorative image (empty alt)"],
    [
      "export const A = ({ xs }: { xs: string[] }) => <ul>{xs.map((x) => <li key={x}>{t()}</li>)}</ul>;",
      "callback rendering elements",
    ],
    ['export const A = () => <p>{f("id")}</p>;', "plain literal argument of a call"],
    ['export const A = ({ xs }: { xs: string[] }) => <p>{xs.join(", ")}</p>;', "join separator"],
    ['export const A = () => <p>{[t(), " / "]}</p>;', "array of translated text"],
    [
      'export const A = () => <Panel icon="check" variant="primary" placement="top start" id="desk" />;',
      "non-text component props",
    ],
    [
      'export const A = () => <Panel labelId="desk-title" titleClassName="x" />;',
      "text word not at the end",
    ],
    [
      'export const A = () => <meta content="width=device-width" />;',
      "DOM element, not a component",
    ],
    ["export const A = () => <Panel heading={t()} toggleLabel={t()} />;", "translated text props"],
  ])("accepts %s (%s)", async (code) => {
    const source = `${DECLARATIONS}${code}\n`;
    expect(await ruleIds(source, "src/ui/studio/A.tsx")).toEqual([]);
  });

  it.each(["src/ui/x.ts", "src/app/x.ts", "src/render/scene/x.tsx", "src/render/x.tsx"])(
    "is enabled on %s",
    async (filePath) => {
      const config = (await eslint.calculateConfigForFile(filePath)) as {
        rules: Record<string, unknown>;
      };
      expect(config.rules["p152/no-literal-text"]).toBeDefined();
    },
  );

  it("does not apply to component tests", async () => {
    const code = "export const A = () => <p>Hello</p>;\n";
    expect(await ruleIds(code, "src/ui/studio/A.test.tsx")).not.toContain("p152/no-literal-text");
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
