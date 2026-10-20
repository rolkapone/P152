#!/usr/bin/env node
// Obsolète, voir les fichiers en place : ce brouillon (revue US-002) n est plus maintenu.
// Fichier actif : scripts/check-licenses.mjs. Toute modification se fait là-bas, avec revue secdevops.
// Brouillon secdevops — à copier par le devops vers `scripts/check-licenses.mjs`.
// Usage : pnpm licenses list --prod --json > licenses.json && node scripts/check-licenses.mjs licenses.json
// Sortie : code 1 si une licence de dépendance de production n'est pas autorisée.
// Format attendu (pnpm 10) : { "<licence>": [ { "name": "...", "versions": ["x.y.z"], ... } ] }.
// A VERIFIER au premier passage en CI : si pnpm change le format, adapter la lecture ci-dessous.

import { readFileSync } from "node:fs";

// Licences permissives autorisées sans revue.
const ALLOWED = new Set([
  "MIT", "MIT-0", "ISC", "0BSD", "BSD-2-Clause", "BSD-3-Clause", "Apache-2.0",
  "Zlib", "CC0-1.0", "Unlicense", "BlueOak-1.0.0", "Python-2.0",
]);

// Licences acceptables après revue secdevops (copyleft faible, attribution) : avertissement non bloquant.
const REVIEW = new Set(["MPL-2.0", "CC-BY-4.0", "CC-BY-3.0"]);

// Exceptions nominatives : "paquet": "raison ; approbateur ; date d'expiration AAAA-MM-JJ".
const EXCEPTIONS = {};

const file = process.argv[2] ?? "licenses.json";
const data = JSON.parse(readFileSync(file, "utf8"));

const clean = (s) => String(s ?? "UNKNOWN").replace(/[()]/g, "").trim();

/** Évalue une expression SPDX simple (OR / AND sans imbrication profonde). */
function verdict(expression) {
  let best = "deny";
  for (const option of clean(expression).split(/\s+OR\s+/i)) {
    const parts = option.split(/\s+AND\s+/i).map(clean);
    if (parts.every((l) => ALLOWED.has(l))) return "allow";
    if (parts.every((l) => ALLOWED.has(l) || REVIEW.has(l))) best = "review";
  }
  return best;
}

let denied = 0;
let review = 0;
for (const [license, pkgs] of Object.entries(data)) {
  for (const pkg of pkgs) {
    const versions = (pkg.versions ?? [pkg.version]).filter(Boolean).join(", ");
    const id = `${pkg.name}@${versions}`;
    const expr = pkg.license ?? license;
    if (Object.hasOwn(EXCEPTIONS, pkg.name)) {
      console.log(`EXCEPTION ${id} (${expr}) : ${EXCEPTIONS[pkg.name]}`);
      continue;
    }
    const v = verdict(expr);
    if (v === "deny") {
      denied += 1;
      console.log(`::error::Licence non autorisée : ${id} -> ${expr}`);
    } else if (v === "review") {
      review += 1;
      console.log(`::warning::Licence à revoir par secdevops : ${id} -> ${expr}`);
    }
  }
}

console.log(`Licences de production : ${denied} refusée(s), ${review} à revoir.`);
process.exit(denied > 0 ? 1 : 0);
