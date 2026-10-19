# Exécution locale des commandes de CI - US-001

Date : 2026-10-19. Windows 11, Git Bash, Node v24.20.0, pnpm 10.34.7. Les mêmes commandes que `.github/workflows/ci.yml`. La vérification sur PR réelle est reportée au Sprint 2 (aucun remote).

| Commande (job CI)                                                         | Résultat                                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` (clone propre de la branche)             | OK                                                                        |
| `pnpm build` (clone propre)                                               | OK (`tsc --noEmit` + `vite build`, sourcemap désactivée)                  |
| `pnpm format:check` (lint)                                                | OK après `pnpm format` (19 fichiers existants reformatés)                 |
| `pnpm lint`                                                               | OK (0 warning)                                                            |
| `pnpm typecheck`                                                          | OK après correction de `playwright.config.ts` (`exactOptionalPropertyTypes`) |
| `pnpm test:cov`                                                           | OK (1 test ; couverture v8 configurée, 5,88 % : socle vide)               |
| `pnpm build` + `pnpm check:bundle`                                        | OK                                                                        |
| `pnpm check:assets`                                                       | OK (92 fichiers suivis, aucun > 1 Mio hors LFS)                           |
| `pnpm exec playwright install chromium`, `pnpm build:e2e`, `pnpm test:e2e` | OK : 4 passés, 2 ignorés (perf.spec)                   |
| `pnpm check` (chaîne complète)                                            | OK                                                                        |

Non exécutés en local : jobs sécurité (gitleaks, CodeQL, semgrep, zizmor, OSV) et `build-hardening` (`dist/_headers` absent jusqu'à SEC-03, avertissement accepté).

## Corrections et constats

- `pnpm-lock.yaml` commité.
- pnpm 10.34.7 **ignore** `minimumReleaseAge` placé dans `package.json > pnpm` (vérifié par un test avec une valeur démesurée : installation non bloquée). Les réglages `onlyBuiltDependencies` (esbuild, simple-git-hooks) et `minimumReleaseAge: 4320` (3 jours) sont donc dans `pnpm-workspace.yaml` (vérifié : l'installation est bloquée avec une valeur démesurée).
- Avec `minimumReleaseAge`, la résolution complète échouait sur `rollup@4.64.10` (publié depuis moins de 3 jours). Au lieu d'exclure le paquet de la protection, `overrides: rollup: 4.64.7` (version mature) est épinglé dans `pnpm-workspace.yaml` ; à retirer quand la fenêtre est passée.
- `build.sourcemap: false` confirmé dans `vite.config.ts`.
- `.env` / `.env.*` ignorés, `.env.example` factice (`VITE_E2E=false`), `.gitattributes` LFS pour les binaires.
