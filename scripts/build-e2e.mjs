// Build E2E : identique au build de production, mais avec les hooks de test
// (window.__p152test / __p152perf) activés via VITE_E2E. Sortie : dist-e2e/ (jamais déployé).
// Script Node pour rester portable Windows / Linux (pas de syntaxe VAR=val).
import { build } from "vite";

process.env.VITE_E2E = "true";
await build({ build: { outDir: "dist-e2e", emptyOutDir: true } });
