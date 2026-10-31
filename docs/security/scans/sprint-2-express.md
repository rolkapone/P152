Sprint-2 lot EXPRESS — VERDICT: PASS

Date : 2026-10-31. Périmètre : PR #2 (`fix/ci-e2e-runner-timeouts`, déjà scannée : `fix-ci-e2e-runner.md`, PASS) et PR #18 (`fix/ci-stability`), diffs de merge relus ; puis état de sécurité du dépôt après SEC-02 (API GitHub en lecture seule). Aucun Playwright lancé.

## Outils
- gitleaks (Docker `zricethezav/gitleaks:v8.30.0`, CI en 8.30.1, `.gitleaks.toml`) sur les 51 commits de la plage PR #2 → PR #18 : **0 fuite**.
- Semgrep (Docker, image épinglée de la CI, `p/typescript` `p/react` `p/javascript` `.semgrep/`) sur les 8 fichiers de code touchés : **0 finding**.
- E-mails auteur et committer des commits des deux PR : `81617903+rolkapone@users.noreply.github.com` uniquement.
- SCA : aucun `package.json` / lockfile dans les deux diffs (sans objet).

## Revue manuelle des diffs (confiance haute)
- **CI** (`ci.yml`) : seul `timeout-minutes` du job e2e passe de 20 à 30. Permissions inchangées (`contents: read` global, e2e sans permission propre), actions et image Playwright toujours épinglées par SHA / digest, `persist-credentials: false` conservé, aucun `pull_request_target`.
- **CSP E2E** : `config/security-headers.mjs`, son plugin dans `vite.config.ts`, `global-setup.ts` et `webServer` (preview `dist-e2e`) non touchés ; `retries: 0` intact ; PR #2 n'élargit que des délais.
- **Assertions de sécurité** : aucune supprimée. PR #18 en **ajoute** une : rejet `forbiddenKey` d'une clé interdite (`__proto__`, etc.) à n'importe quelle profondeur de `extensions` (anti-pollution de prototype renforcée). Le test de fuite (5 changements de bureau) garde l'égalité stricte des compteurs mémoire : il détecte toujours un bureau non libéré (disponibilité, pas sécurité). `waitForScene` dans `shell.spec.ts` n'assouplit rien.
- **`tests/unit/setup/fastCheck.ts` et `FC_SEED`** : chargé uniquement par Vitest (`test.setupFiles`), absent du build (la section `test` est ignorée par `vite build`) ; `FC_SEED` validé (entier, sinon erreur), lu dans le seul processus de test, aucun secret ni réseau. N'ouvre rien.

## Findings
| Sévérité | Source | Emplacement | Problème | Correction | Confiance |
|---|---|---|---|---|---|
| MEDIUM | manuel (config dépôt) | ruleset 26280126 / `ci.yml` job `sec-codeql` | Règle `code_scanning` retirée (décision PO) : une alerte CodeQL high/critical sur une PR ne bloque plus le merge (CodeQL ne fait que téléverser) | Garde CodeQL ci-dessous (SEC-06) | haute |
| MEDIUM | Dependabot #1 | `minimatch` (dev) | GHSA-g3hv-75wg-m249, exception jusqu'au 2026-11-30 (`exceptions.md`) | Montée ESLint 10 / typescript-eslint (PR Dependabot #6, #10) avant l'échéance | haute |
| LOW | manuel | `tests/unit/setup/fastCheck.ts` | Graine fixe : le fuzz de `parseSetup` explore toujours les mêmes 200 entrées, il ne découvre plus de régression nouvelle | Job hebdomadaire `security-scheduled` : fuzz avec `FC_SEED` aléatoire journalisé, non bloquant, issue si échec (SEC-06) | moyenne |
| INFO | Semgrep | `.semgrep/p152.yml` (`p152-insecure-random`, `p152-plain-http-url`) | Motifs `src/**` bientôt ancrés (Semgrepignore v2) | Écrire `/src/...` explicitement (secdevops, SEC-06) | haute |

## État global après SEC-02
- **Ruleset 26280126 `main`** : `active`, branche par défaut ; suppression et force-push interdits, PR obligatoire (0 approbation, merge commit seul), check requis `ci-ok` (non strict) ; bypass rôle Admin en mode `pull_request` uniquement. Pas de règle `code_scanning` (retirée, PO, `sec-02-reglages.md` l. 73).
- **Secret scanning** : 0 alerte ouverte. **Dependabot** : 1 alerte ouverte (minimatch ci-dessus) ; alertes désormais actives (LOW de PR #2 clos).
- **Code scanning** : 0 alerte CodeQL / Semgrep ouverte (PerfProbe #1-#4 closes). 4 alertes Scorecard (posture, hors lot, triées dans `SEC-02.md`) : #5 BranchProtection (high) et #6 SecurityPolicy (medium) datent du run du 2026-10-26, **avant** le ruleset et `SECURITY.md` : à revérifier après le run du lundi 2026-11-02 ; #9 Maintained (high, dépôt < 90 jours, se ferme seule) ; #7 License (low, décision PO).
- **PR Dependabot** (aucune ne corrige une alerte ouverte ; `ci-ok` rouge, donc non mergeables) : **#15** runtime mineures (i18next 26.5.11, react-i18next 17.1.9, lucide-react 1.63.0, zustand 5.0.16) : dans le bundle, risque faible (délai de 3 jours `minimumReleaseAge`), `unit` rouge à diagnostiquer, voie STANDARD. **#13** `@vitejs/plugin-react` 6 (majeure, chaîne de build) : `build` et `unit` rouges, build-hardening (CSP) **non exécuté** ; à grouper avec Vite 8 (#7), voie RENFORCÉE. **#12** `@vitest/coverage-v8` 5 : exige Vitest 5 (#8), à grouper ; dev seul, risque faible.

## Proposition SEC-06 : garde CodeQL ≥ high dans la CI
- Où : job `sec-codeql` (matrice, déjà agrégé par `security` puis `ci-ok`, donc bloquant sans toucher au ruleset). Ajouter à `analyze` : `output: sarif-results`, puis une étape :
  `jq -e '[.runs[] | ([.tool.driver.rules[]?, .tool.extensions[]?.rules[]?] | map({key: .id, value: ((.properties["security-severity"] // "0") | tonumber)}) | from_entries) as $s | .results[] | select((.suppressions // []) == [] and ($s[.ruleId] // 0) >= 7.0)] | length == 0' sarif-results/*.sarif`
  (high ≥ 7.0, critical ≥ 9.0 : barème GitHub ; échec = liste `ruleId` + emplacement dans le log).
- Permissions : **aucune nouvelle** (lecture du SARIF local ; `security-events: write` existe déjà pour le téléversement).
- Forks : la garde ne dépend ni de l'API ni du téléversement (jeton en lecture seule sur une PR de fork) : même résultat. Ne jamais passer à `pull_request_target`.
- Variante API écartée : `gh api .../code-scanning/alerts?ref=refs/pull/<n>/merge&tool_name=CodeQL&state=open` demande `security-events: read`, dépend du délai de traitement et compte aussi les alertes de `main`. Test d'acceptation : fixture vulnérable sur une branche jetable → `ci-ok` rouge.
