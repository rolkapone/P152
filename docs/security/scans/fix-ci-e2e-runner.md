# Scan sécurité : PR #2 `fix/ci-e2e-runner-timeouts` vers main

Date : 2026-10-20. Revue : APPROVE (docs/reviews/fix-ci-e2e-runner.md).

## Périmètre du diff (`git diff main...HEAD`)

| Fichier | Changement | Impact sécurité |
|---|---|---|
| `playwright.config.ts` | `timeout` 90 s et `expect.timeout` 15 s en CI (inchangés en local) | Aucun. Pas de retry, pas d'assertion assouplie, `globalSetup` inchangé. |
| `tests/e2e/scene-ui.spec.ts` | helper `pauseClock` (marge 60 s), découpage des tests UX-14 et UX-12 par taille / thème | Aucun. Assertions identiques (axe serious/critical toujours bloquants). |
| `docs/qa/ci-e2e-runner.md` | documentation | Aucun. |

Vérifications manuelles (confiance haute) :
- Aucun secret, token ou identifiant dans le diff (grep + gitleaks CI vert).
- Fixture CSP E2E non touchée : aucun fichier CSP / fixture / `global-setup.ts` dans le diff, aucune occurrence de `csp` dans le diff.
- Aucun changement de workflow (`.github/` absent du diff).

## Jobs sécurité de la PR (`gh pr checks 2`)

gitleaks, semgrep (job + Semgrep OSS), CodeQL (actions, javascript-typescript), zizmor, build hardening : **pass**.
`security / dependencies & licences` : **pending** au moment du scan (relancé après activation du Dependency graph). Le diff n'ajoute ni ne modifie de dépendance (`package.json` / lockfile non touchés), le résultat n'est donc pas lié à cette PR ; il doit toutefois être vert avant le merge (règle CI verte, devops).

## Alertes GitHub du dépôt

| Source | Résultat |
|---|---|
| Dependabot alerts | Non lisible : « Dependabot alerts are disabled for this repository » (HTTP 403). Le Dependency graph est actif mais les alertes Dependabot ne le sont pas. |
| Secret scanning | 0 alerte |
| Code scanning | 4 alertes **ouvertes**, toutes sur `refs/heads/main` (préexistantes, pas introduites par la PR) |

Détail code scanning : #1 à #4, règle maison `semgrep.p152-test-hook-reference` (WARNING, confiance LOW par conception), `src/render/scene/PerfProbe.tsx` lignes 2, 36, 86, 112. Vérifié : `PerfProbe` n'est chargé que si `import.meta.env.VITE_E2E === "true"` (`SceneCanvas.tsx:17`), et l'absence du hook dans `dist/` est contrôlée de façon bloquante par le job build-hardening (vert). Règle informative (M-12) : faux positif fonctionnel, confiance haute.

## Findings

| Sévérité | Source | Emplacement | Problème | Correction recommandée |
|---|---|---|---|---|
| LOW | GitHub code scanning (Semgrep) | `src/render/scene/PerfProbe.tsx` (alertes #1-#4, main) | 4 alertes ouvertes de la règle informative `p152-test-hook-reference` ; hook correctement gardé par `VITE_E2E` | Les fermer en « Used in tests » / « Won't fix » avec renvoi à M-12, ou ne pas téléverser en SARIF les règles de sévérité INFO/WARNING de confiance LOW, pour garder l'onglet Security lisible. Backlog. |
| LOW | GitHub (config dépôt) | Settings > Code security | Alertes Dependabot désactivées (API 403) | Le PO active « Dependabot alerts » (le Dependency graph seul ne suffit pas). Backlog. |
| INFO | CI | job `security / dependencies & licences` | En attente au moment du scan | Attendre le vert avant merge (devops). |

## Verdict

**PASS** : aucun finding CRITICAL/HIGH, aucun secret. Merge conditionné au passage au vert du job dependencies & licences (règle CI verte).
