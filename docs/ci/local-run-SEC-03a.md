# SEC-03a : vérification locale (2026-10-20)

Poste : Windows 11, 24 threads, Git Bash, Node 24. Branche `feature/SEC-03a-headers-csp`. Aucun push.

## Contrôles

| Contrôle | Résultat |
|---|---|
| `pnpm check` (format, lint, typecheck, tests + couverture, build, bundle) | vert |
| `pnpm check:assets` | vert (284 fichiers) |
| `pnpm audit --audit-level high` | aucune vulnérabilité connue |
| `sec-build-hardening` de `ci.yml` (3 étapes `run` rejouées en Git Bash sur `dist/`) : hooks et source maps, CSP et en-têtes (HSTS compris), `index.html` | vert, sans avertissement |
| Négatifs : HSTS retiré de `dist/_headers`, puis `max-age=100` | le contrôle échoue (exit 1) |
| Négatif E2E : lien `react-aria-pressable-style` retiré de `dist-e2e/index.html` | `securitypolicyviolation: style-src-elem blocked inline`, le test échoue |
| gitleaks sur `dist/` | non exécuté en local (binaire absent), inchangé par SEC-03a |

Overrides : `rollup 4.64.7` conservé (`pnpm-workspace.yaml`) ; à retirer à partir du **2026-10-23**, puis `pnpm install` et `pnpm check`.

React Aria : `usePress` (react-aria 3.53.1, `usePress.mjs`) injecte un `<style id="react-aria-pressable-style">` sauf si l'id existe déjà dans le document ; `public/react-aria-pressable.css` reprend son `textContent` (`@layer { [data-react-aria-pressable] { touch-action: pan-x pan-y pinch-zoom; } }`). Non traité : `usePreventScroll` (modales, iOS) injecte aussi un `<style>` (`overscroll-behavior`). Le MVP n'a ni modale ni popover React Aria ; à traiter avec la première story qui en introduit (US-005/US-006 : Dialog, Popover, ListBox ouvert).

## 10 exécutions consécutives de `pnpm test:e2e` sous charge : CRITÈRE NON ATTEINT

Charge : `pnpm test` (Vitest, 24 threads) en boucle en parallèle. Config Playwright par défaut (4 workers, timeout 30 s, 44 tests, 2 projets).

| Tentative | Configuration | Runs verts / 10 |
|---|---|---|
| 1 | défaut | 9 (run 10 : 1 échec, `ERR_CONNECTION_REFUSED` sur le bundle JS) |
| 2 | `127.0.0.1` au lieu de `localhost` | 9 (run 10 : 4 échecs, `page.goto` bloqué) |
| 3 | idem | 8 (runs 5 et 7 : 4 échecs chacun) |
| 4 | timeout de test 60 s | 8 (runs 5 et 6 : 4 échecs, `page.goto` bloqué 60 s) |
| 5 | 2 workers | 8 (run 6 : le webServer n'a pas démarré en 60 s ; run 7 : 2 échecs) |

Sans charge, toutes les exécutions sont vertes (44/44 en ~1 min). Les échecs se présentent toujours comme un blocage simultané de tous les workers (4 tests à la fois, ou 2 avec 2 workers) et touchent aussi des tests qui n'ont rien de 3D (en-têtes, a11y). Sonde `curl` toutes les secondes pendant 8 min sous la même charge : le serveur `vite preview` répond toujours en moins de 60 ms (374 mesures), donc le serveur n'est pas en cause. Le démarrage du webServer ou de Chromium se bloque parfois plus de 60 s sous cette charge ; cause racine non identifiée (hypothèses : démarrage de processus ralenti par la charge ou l'antivirus Windows). Il reste 4 `waitForTimeout` dans tests/e2e/scene.spec.ts:37,39,50,53, suivis dans SEC-06. Les changements d'essai (127.0.0.1, 60 s, 2 workers) n'ont pas amélioré le résultat et ont été retirés : `playwright.config.ts` est inchangé hors commentaire.

Décision : la règle de charge est reformulée et reportée dans SEC-06 (voir la section « Critère 10 runs » de docs/reviews/SEC-03a.md) ; elle ne bloque pas SEC-03a.
