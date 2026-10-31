SEC-02 — VERDICT: PASS

# Revue approfondie SEC-02 : durcissement du dépôt GitHub public (PR #17)

- Date : 2026-10-31. Branche `feature/SEC-02-durcissement-depot` contre `main` : 3 commits, 5 fichiers (`SECURITY.md`, `.github/CODEOWNERS`, docs), aucun changement dans `src/`, `package.json` ni `pnpm-lock.yaml`. Voie RENFORCÉE.
- Méthode : lecture seule (`gh api` en GET, `gh pr checks`, journaux des jobs), `pnpm why`, `pnpm audit`, revue manuelle ; référentiel : threat model §14, M-17 à M-22, SR-08, `ci-security.md` §2, §3.5, §6.
- Outils : CI de la PR #17 verte (gitleaks, Semgrep, CodeQL, zizmor, OSV, licences ; e2e en cours au relevé). gitleaks local **non vérifié** (non installé) ; Semgrep local non relancé (diff sans code).
- Commits : auteur et committer en noreply GitHub (3/3). Aucun secret, aucune adresse personnelle dans le diff.

## Findings

| Sévérité | Source (outil/manuel) | Emplacement | Problème | Correction | Confiance |
|---|---|---|---|---|---|
| MEDIUM | OSV-Scanner #11/#12, `pnpm audit` | `pnpm-lock.yaml` (minimatch 3.1.5, 10.2.6) | CVE-2026-118764 / GHSA-g3hv-75wg-m249 : DoS par motif de glob (amplification). **Dev seule** : chaîne ESLint 9 + typescript-eslint 8.72 ; absente du bundle ; motifs fournis par la config versionnée, aucune entrée attaquant. Corrigé seulement en minimatch 11.0.1 ; la branche 3.x n'a probablement pas le chemin vulnérable (`optimizationLevel` absent) | Exception ≤ 30 jours (expire 2026-11-30) dans `exceptions.md` + `osv-scanner.toml` ; correction par ESLint 10 / typescript-eslint (PR #6, #10) ; **pas** d'override vers minimatch 11 (casse ESLint 9). Non bloquant (`--audit-level high`) | Haute (dev seule), moyenne (3.x) |
| LOW | manuel | `.github/CODEOWNERS` | M-20 et `ci-security` §6.2 listent `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, absents des lignes explicites (couverts par `*`) | Ajouter les 4 lignes (cohérence avec le commentaire du fichier). Non bloquant : sans revue code owner requise, CODEOWNERS reste documentaire | Haute |
| LOW | manuel (CI PR #12) | `src/core/io/parseSetup.fuzz.test.ts:113-116` | `extensions` filtre les clés interdites au 1er niveau seulement ; `fc.jsonValue` peut en imbriquer → `forbiddenKey`, échec aléatoire (graine non fixée). Le parseur est correct (refus = sens sûr) | Générateur sans clés interdites à toute profondeur ; à faire **avant** le ruleset (sinon `ci-ok` rougit au hasard) | Haute |
| LOW | Semgrep #1-#3, #13 | `src/render/scene/PerfProbe.tsx` | Faux positifs confirmés (import paresseux sous `VITE_E2E`, `SceneCanvas.tsx:18` ; interdit dans `dist` par `check-bundle.mjs` et `sec-build-hardening`). Réapparaissent quand les lignes bougent (#4 → #13) | Fermer « used in tests » ; durable : exclure `PerfProbe.tsx` de la règle (`.semgrep/p152.yml`, secdevops) | Haute |

## Réglages (`sec-02-reglages.md`) : complets et proportionnés, 4 changements

1. **Bypass du ruleset** : rôle Admin en mode `pull_request` plutôt qu'aucun. Seul humain, CI pouvant tomber en panne : désactiver tout le ruleset est pire (force-push et suppression rouverts, oubli possible). Le mode `pull_request` laisse interdits push direct, force-push, suppression ; le contournement est explicite et journalisé ; aucun risque ajouté si le compte est compromis (un admin désactive déjà le ruleset). Garde-fou : jamais `--admin` par un agent sans accord écrit du PO.
2. **Code scanning ≥ High limité à l'outil CodeQL** (confirmé) : Scorecard #5, #8, #9 sont « high » et bloqueraient tout merge si « tous les outils » était choisi.
3. **Actions autorisées `selected`** (GitHub + 4 éditeurs utilisés) en plus de `sha_pinning_required` : applique M-17 (« actions tierces limitées aux éditeurs de référence »).
4. `delete_branch_on_merge` supprime des branches distantes : accord explicite du PO à mentionner (règle Git du PO).

Conformes : approbation de tous les contributeurs externes (M-18), private vulnerability reporting (requis par le lien de `SECURITY.md`), security updates, secret scanning et push protection déjà actifs, `GITHUB_TOKEN` en lecture, MFA à confirmer par le PO. `SECURITY.md` : canal privé seul, délais indicatifs, aucune adresse e-mail.

## Scorecard #5 à #10

#5 BranchProtection et #6 SecurityPolicy : se ferment après le ruleset et le merge de `SECURITY.md` (confiance moyenne pour #5 : lecture du ruleset par le jeton de Scorecard). #9 Maintained : dépôt de moins de 90 jours, se ferme seul, laisser ouverte. #8 CodeReview : impossible à satisfaire seul (exige l'approbation d'un autre humain) → « won't fix », compensé par `ci-ok` requis, porte CodeQL et revues reviewer/secdevops. #10 CII Best Practices : disproportionné pour un projet personnel → « won't fix ». #7 License : **décision PO** ; sans fichier `LICENSE` le code est public mais tous droits réservés (acceptable) ; fermer « won't fix » si le PO garde ce choix.

## PR Dependabot à CI rouge

- **#15** (runtime-minor : i18next, react-i18next, zustand, lucide-react ; **prod**) : seul échec `tests/unit/fonts.test.ts`, qui exige la ligne `lucide-react | 1.63.0` dans `docs/design/3d/licences-assets.md`. À merger en priorité après ce commit de doc sur la branche (developer), voie STANDARD.
- **#13** (`@vitejs/plugin-react` 6.1.2) : `ERR_PACKAGE_PATH_NOT_EXPORTED` (`vite/internal`) : exige Vite 8. Ne pas merger seule ; à grouper avec #7 (Vite 8) dans la story de mises à jour majeures.
- **#12** (`@vitest/coverage-v8` 5.0.5) : échec du test de fuzz instable, sans lien avec la montée. Relancer après la correction du générateur ; à grouper avec #8 (Vitest 5), qui doit avancer en même temps.

## Items proposés au socle:scrum-master

Exception CVE-2026-118764 et suivi ESLint 10 (MEDIUM, ≤ 30 jours) ; lignes CODEOWNERS ; correction du générateur de fuzz ; exclusion `PerfProbe.tsx` de la règle Semgrep (LOW, SEC-06 ou dette).
