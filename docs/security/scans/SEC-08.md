SEC-08 — VERDICT: PASS

Date : 2026-11-01. Voie STANDARD, scan ciblé sur le diff de la PR #26 (`feature/SEC-08-deps-lot1`, 2 commits, e-mails auteur/committer noreply uniquement). Remplace les PR Dependabot #11 (actions) et #15 (runtime). Aucun code applicatif touché ; aucun Playwright lancé.

## Vérifications
- **Épinglage des actions** (API GitHub) : `codeql-action` v4.39.1 → tag annoté déréférencé en `9b32540…` ; `setup-uv` v10.3.2 → `07a047e…` ; `dependency-review-action` v5.0.0 → `a1d282b…` : conformes au diff. Aucune permission, déclencheur ni `persist-credentials` modifié (zizmor PASS).
- **Avis de sécurité** (GitHub Advisory + OSV, versions exactes) : aucun pour i18next 26.5.11, react-i18next 17.1.9, lucide-react 1.63.0, zustand 5.0.16, ni pour les 3 actions (le seul GHSA connu de codeql-action, GHSA-vqf5-2xx6-9wfm, vise ≤ 3.28.2).
- **Intégrité et signatures npm** : les 4 signatures ECDSA du registre vérifiées contre `/-/npm/v1/keys` (2/2 OK chacune) ; `integrity` du registre identique au lockfile. Provenance SLSA v1 : lucide-react et zustand (publiés par GitHub Actions) ; i18next et react-i18next sans provenance (publication manuelle du mainteneur `adrai`, habituelle). Aucun script `install`/`postinstall`. Publications du 22 au 28/10 : délai `minimumReleaseAge` de 3 jours respecté.
- **Lockfile** : seules les 4 entrées et leurs références changent ; aucune dérive transitive.
- **pnpm audit** (local sur la branche et CI) : les 2 « moderate » = **GHSA-g3hv-75wg-m249** (minimatch < 11.0.1, dev seul, via `eslint` et `typescript-eslint`), couvertes par l'exception jusqu'au 2026-11-30 (`docs/security/exceptions.md`, `osv-scanner.toml`). Rien de nouveau ; correctif attendu avec SEC-09 (ESLint 10).
- **dependency-review v5 comme garde** : `action.yml` v4.9.0 → v5.0.0 identique hormis `using: node24` (mêmes entrées, mêmes valeurs par défaut). Nos entrées inchangées (`fail-on-severity: high`, `fail-on-scopes: runtime, development`, liste `allow-licenses`, Scorecard). Exécutée sur la PR : 0 vulnérabilité ≥ high, 0 licence refusée, 0 paquet refusé. **Garde conservée à l'identique.**
- **Jobs sécurité de la PR** : gitleaks, semgrep (CI + Semgrep OSS), codeql (actions, js-ts), dependencies & licences (`check-licenses` inclus), build hardening (CSP, en-têtes), zizmor : tous PASS. `CodeQL` / `osv-scanner` « skipping » = workflow planifié, normal. e2e encore en cours au moment du scan (hors périmètre sécurité, requis par `ci-ok`).
- **Licences** : MIT / ISC inchangées ; `licences-assets.md` mis à jour pour lucide-react 1.63.0.

## Findings
| Sévérité | Source | Emplacement | Problème | Correction | Confiance |
|---|---|---|---|---|---|
| MEDIUM | pnpm audit / OSV | `minimatch` (dev) | GHSA-g3hv-75wg-m249, déjà connu, exception au 2026-11-30 | SEC-09 (ESLint 10) avant l'échéance | haute |
| INFO | dependency-review | i18next, react-i18next | Scorecard 4,6 et 4,3 (au-dessus du seuil d'alerte 3), sans provenance npm | Aucune ; signatures registre vérifiées | haute |
| INFO | Scorecard | `codeql-action` | Score « undefined » (action GitHub officielle) | Aucune | haute |
