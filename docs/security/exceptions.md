# Exceptions de sécurité

| Id | Cible | Justification | Approbateur | Expire |
|---|---|---|---|---|
| CVE-2026-118764 / GHSA-g3hv-75wg-m249 | minimatch 3.1.5 et 10.2.6 (OSV #11, #12, medium) | DoS par motif de glob, dépendance de dev seule (lint ESLint 9 / typescript-eslint), motifs versionnés, absente du bundle ; correctif seulement en minimatch 11 (incompatible ESLint 9). Correction : montée ESLint 10 / typescript-eslint. | secdevops, accord PO 2026-10-31 | 2026-11-30 |

Outil : `osv-scanner.toml` (`[[IgnoredVulns]]` avec `ignoreUntil`, seule façon de faire accepter l'avis par le job OSV).
