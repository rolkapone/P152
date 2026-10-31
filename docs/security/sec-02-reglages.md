# SEC-02 — Réglages du dépôt GitHub : état et proposition

Relevé en lecture seule le 2026-10-31 (`gh api`, dépôt `rolkapone/P152`, public). **Rien n'est appliqué** : chaque ligne attend l'accord écrit du PO. `R=repos/rolkapone/P152`. Revue secdevops : [`scans/SEC-02.md`](scans/SEC-02.md) (lignes 1, 9, 10, 12, 13 et 15 à 16 modifiées ou ajoutées par elle).

| # | Réglage | État actuel | Valeur proposée | Pourquoi |
|---|---|---|---|---|
| 1 | Ruleset `main` | aucun ruleset, branche non protégée | actif : PR obligatoire (0 approbation : dépôt à un seul humain), check requis `ci-ok`, force-push et suppression interdits, code scanning (**outil CodeQL seul**, Security ≥ High, Alerts ≥ Errors), historique non linéaire (merge commit, décision PO 32-36) ; **bypass : rôle Admin en mode `pull_request`** (recommandation secdevops, voir note) | un push direct ou un `ci-ok` rouge ne doit plus atteindre `main` |
| 2 | Secret scanning | activé | inchangé | déjà conforme |
| 3 | Push protection | activée | inchangée | déjà conforme |
| 4 | Dependabot alerts | activées (HTTP 204) ; 0 alerte ouverte | inchangé | déjà conforme (la CVE minimatch remonte par OSV-Scanner, pas par Dependabot) |
| 5 | Dependabot security updates | désactivées | activer | correctifs de sécurité automatiques (PR passant par la CI, sans `cooldown`) |
| 6 | Private vulnerability reporting | désactivé | activer | canal de `SECURITY.md` ; sans lui le lien de signalement ne marche pas |
| 7 | `GITHUB_TOKEN` par défaut | `read`, ne peut pas approuver de PR | inchangé | déjà conforme |
| 8 | Approbation des workflows externes | `first_time_contributors` | `all_external_contributors` | moindre privilège, dépôt public (M-18) |
| 9 | Actions autorisées et épinglage | `allowed_actions: all`, `sha_pinning_required: false` | `selected` (actions GitHub + `pnpm/action-setup`, `google/osv-scanner-action`, `ossf/scorecard-action`, `astral-sh/setup-uv`) et `sha_pinning_required: true` | M-17 : actions tierces limitées à la liste utilisée ; toute action non épinglée refusée |
| 10 | Modes de merge | merge, squash, rebase tous permis | merge commit seul ; **sans** suppression auto des branches (décision PO 2026-10-31) | cohérence avec la règle du PO (commit de merge) |
| 11 | 4 alertes `semgrep.p152-test-hook-reference` (#1, #2, #3, #13, `PerfProbe.tsx`) | ouvertes | fermer, motif « used in tests » | faux positif vérifié : module chargé seulement si `VITE_E2E === "true"` (`SceneCanvas.tsx:18`), absent de `dist` (`check-bundle.mjs`, `sec-build-hardening`) |
| 12 | Alertes Scorecard #5-#10 | ouvertes | #5 BranchProtection et #6 SecurityPolicy : se ferment seules (ligne 1, `SECURITY.md` sur `main`) ; #9 Maintained : laisser ouverte (dépôt < 90 jours, se ferme seule) ; #8 CodeReview et #10 CII : fermer « won't fix » ; #7 License : décision PO (voir rapport) | aucune ne bloque le merge tant que le ruleset vise CodeQL seul (#5, #8, #9 sont « high ») |
| 13 | OSV #11, #12 : CVE-2026-118764 (GHSA-g3hv-75wg-m249, minimatch 3.1.5 et 10.2.6, medium) | ouvertes | **exception ≤ 30 jours** (`docs/security/exceptions.md` + `osv-scanner.toml`), correction par la montée ESLint 10 / typescript-eslint | dépendance de dev seule (lint), motifs de glob versionnés, absente du bundle ; correctif seulement en minimatch 11 (majeure incompatible avec ESLint 9) |
| 14 | MFA | non vérifiable par l'API | le PO confirme (passkey) | prérequis (M-22) |
| 15 | PR Dependabot #12, #13, #15 | ouvertes, CI rouge | #15 : à merger après mise à jour de la ligne `lucide-react` 1.63.0 de `docs/design/3d/licences-assets.md` ; #13 : ne pas merger seule (plugin-react 6 exige Vite 8 : à grouper avec #7) ; #12 : relancer la CI (échec du test de fuzz instable, sans lien avec la montée) puis grouper avec #8 (vitest 5) | voir rapport |
| 16 | Test de fuzz `parseSetup` instable | — | corriger le générateur (clés interdites imbriquées dans `extensions`) avant le ruleset | sinon `ci-ok` peut rougir au hasard sur toute PR |

Note #1 (secdevops) : sans bypass, un incident CI oblige le PO à désactiver tout le ruleset (force-push et suppression compris), au risque d'oublier de le réactiver. Le bypass Admin en mode `pull_request` ne permet que le merge d'une PR malgré un check rouge, par une action explicite (case à cocher, `gh pr merge --admin`) journalisée dans *Rule insights* ; les push directs, force-push et suppressions restent interdits. Il n'ajoute pas de risque en cas de compte compromis (un admin peut déjà désactiver le ruleset). Garde-fou : aucun agent n'utilise `--admin` sans accord écrit du PO pour la PR concernée.

## Commandes qui appliqueront les réglages (après accord)

```bash
# 1. ruleset (JSON dans le fichier ruleset.json)
gh api -X POST $R/rulesets --input ruleset.json
#  {"name":"main","target":"branch","enforcement":"active",
#   "bypass_actors":[{"actor_id":5,"actor_type":"RepositoryRole","bypass_mode":"pull_request"}],
#   "conditions":{"ref_name":{"include":["~DEFAULT_BRANCH"],"exclude":[]}},
#   "rules":[{"type":"deletion"},{"type":"non_fast_forward"},
#    {"type":"pull_request","parameters":{"required_approving_review_count":0,"dismiss_stale_reviews_on_push":false,
#      "require_code_owner_review":false,"require_last_push_approval":false,"required_review_thread_resolution":false,
#      "allowed_merge_methods":["merge"]}},
#    {"type":"required_status_checks","parameters":{"strict_required_status_checks_policy":false,
#      "required_status_checks":[{"context":"ci-ok","integration_id":15368}]}},
#    {"type":"code_scanning","parameters":{"code_scanning_tools":[{"tool":"CodeQL",
#      "security_alerts_threshold":"high_or_higher","alerts_threshold":"errors"}]}}]}
gh api -X PUT $R/automated-security-fixes                      # 5
gh api -X PUT $R/private-vulnerability-reporting               # 6
gh api -X PUT $R/actions/permissions/fork-pr-contributor-approval -f approval_policy=all_external_contributors  # 8
gh api -X PUT $R/actions/permissions -F enabled=true -f allowed_actions=selected -F sha_pinning_required=true   # 9
gh api -X PUT $R/actions/permissions/selected-actions -F github_owned_allowed=true -F verified_allowed=false \
  -f 'patterns_allowed[]=pnpm/action-setup@*' -f 'patterns_allowed[]=google/osv-scanner-action/*' \
  -f 'patterns_allowed[]=ossf/scorecard-action@*' -f 'patterns_allowed[]=astral-sh/setup-uv@*'
gh api -X PATCH $R -F allow_squash_merge=false -F allow_rebase_merge=false -F allow_merge_commit=true # 10 (décision PO : pas de delete_branch_on_merge)
for n in 1 2 3 13; do gh api -X PATCH $R/code-scanning/alerts/$n -f state=dismissed -f dismissed_reason="used in tests" -f dismissed_comment="E2E-only module gated by VITE_E2E (SceneCanvas.tsx), absent from dist (check-bundle + sec-build-hardening)"; done  # 11
for n in 8 10; do gh api -X PATCH $R/code-scanning/alerts/$n -f state=dismissed -f dismissed_reason="won't fix" -f dismissed_comment="Single-maintainer personal repo; compensated by required ci-ok and CodeQL gate (SEC-02)"; done  # 12
```

Ordre conseillé : merger cette PR (`CODEOWNERS`, `SECURITY.md`), corriger le test de fuzz (16), puis 6, 5, 8, 9, 10, 11, 12 et le ruleset (1) en dernier. Le champ `context` de `ci-ok` et l'option `sha_pinning_required` sont à confirmer à l'application (API récente) ; `code_scanning` exige que CodeQL ait déjà produit un résultat sur `main` (c'est le cas). Après 9, relancer la CI d'une PR pour vérifier qu'aucune action n'est refusée.
Rejouer la PR de test à 4 cas négatifs (T5) après le ruleset.

## Urgence : désactiver le ruleset (accord écrit du PO requis)

```bash
ID=$(gh api repos/rolkapone/P152/rulesets --jq '.[] | select(.name=="main") | .id')
gh api -X PUT repos/rolkapone/P152/rulesets/$ID -f enforcement=disabled   # réactiver : -f enforcement=active
```
Préférer `gh pr merge <n> --merge --admin` (bypass `pull_request`) à la désactivation.

## Accords du PO (2026-10-31)
Réglages appliqués hors ruleset, bypass Admin `pull_request`, exception minimatch (voir `exceptions.md`), sans `delete_branch_on_merge`, licence reportée, MFA confirmée. Ruleset : après correction du test de fuzz.

## Application (2026-10-31)
- PR #18 mergée (CI verte, `sha_pinning_required` n'a refusé aucune action).
- Ruleset `main` (id 26280126) créé avec le JSON ci-dessus, `code_scanning` accepté. Le mode `evaluate` est refusé par le plan (Enterprise) : créé `disabled`, T5 jouée, puis passé `active`.
- T5 (PR #19, fermée sans merge, branche supprimée) : faux secret `github-pat` bloqué par gitleaks ; lodash 4.17.20 bloqué par `pnpm audit` ; `__p152test` bloqué par `check:bundle` ; injection de template bloquée par zizmor. Ruleset actif : PR #19 en `BLOCKED`.
- État final : ruleset `active`, bypass Admin `pull_request` seulement.
