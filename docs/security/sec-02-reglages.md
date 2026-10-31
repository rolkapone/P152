# SEC-02 — Réglages du dépôt GitHub : état et proposition

Relevé en lecture seule le 2026-10-31 (`gh api`, dépôt `rolkapone/P152`, public). **Rien n'est appliqué** : chaque ligne attend l'accord écrit du PO. `R=repos/rolkapone/P152`.

| # | Réglage | État actuel | Valeur proposée | Pourquoi |
|---|---|---|---|---|
| 1 | Ruleset `main` | aucun ruleset, branche non protégée | actif : PR obligatoire (0 approbation : dépôt à un seul humain), check requis `ci-ok`, force-push et suppression interdits, code scanning (CodeQL Security ≥ High, Alerts ≥ Errors), **historique non linéaire** (merge commit imposé par la décision PO 32-36) ; bypass : aucun | un push direct ou un `ci-ok` rouge ne doit plus atteindre `main` |
| 2 | Secret scanning | activé | inchangé | déjà conforme |
| 3 | Push protection | activée | inchangée | déjà conforme |
| 4 | Dependabot alerts | activées (204) ; 0 alerte ouverte | inchangé | déjà conforme |
| 5 | Dependabot security updates | désactivées | activer | correctifs de sécurité automatiques (PR passant par la CI) |
| 6 | Private vulnerability reporting | désactivé | activer | canal de `SECURITY.md` ; sans lui le lien de signalement ne marche pas |
| 7 | `GITHUB_TOKEN` par défaut | `read`, ne peut pas approuver de PR | inchangé | déjà conforme |
| 8 | Approbation des workflows externes | `first_time_contributors` | `all_external_contributors` | moindre privilège, dépôt public |
| 9 | Épinglage SHA obligatoire | `sha_pinning_required: false` | `true` | refuse toute action non épinglée (déjà épinglées dans `ci.yml`) |
| 10 | Modes de merge | merge, squash, rebase tous permis | merge commit seul ; suppression auto des branches fusionnées | cohérence avec la règle du PO (commit de merge) |
| 11 | 4 alertes `semgrep.p152-test-hook-reference` (#1, #2, #3, #13, `PerfProbe.tsx`) | ouvertes | fermer, motif « used in tests » | crochet de test volontaire, retiré du build de production (`__p152test` contrôlé en CI) |
| 12 | Alertes Scorecard #5-#10 (BranchProtection, CodeReview, Maintained, SecurityPolicy, License, CII) et CVE-2026-118764 (#11, #12, medium, `pnpm-lock.yaml`) | ouvertes | ne pas fermer à la main : #5, #6 se résorbent avec 1 et `SECURITY.md` ; #11/#12 à examiner par secdevops | pas de fermeture sans analyse |
| 13 | PR Dependabot #12, #13, #15 | ouvertes, CI rouge (`unit`, #13 aussi `build` et `security`) | les laisser ouvertes, ne pas les merger ; les confier à une story de mises à jour majeures (vitest 5, plugin-react 6, runtime-minor) | échecs réels, hors périmètre SEC-02 ; fermer #12 et #13 si #8 (vitest 5) les remplace |
| 14 | MFA | non vérifiable par l'API | le PO confirme (passkey) | prérequis |

Note #1 : le bypass « admin » est refusé volontairement ; en urgence le PO désactive le ruleset (journalisé), plutôt que de laisser un contournement permanent.

## Commandes qui appliqueront les réglages (après accord)

```bash
# 1. ruleset (JSON dans le fichier ruleset.json)
gh api -X POST $R/rulesets --input ruleset.json
#  {"name":"main","target":"branch","enforcement":"active","bypass_actors":[],
#   "conditions":{"ref_name":{"include":["~DEFAULT_BRANCH"],"exclude":[]}},
#   "rules":[{"type":"deletion"},{"type":"non_fast_forward"},
#    {"type":"pull_request","parameters":{"required_approving_review_count":0,"dismiss_stale_reviews_on_push":false,
#      "require_code_owner_review":false,"require_last_push_approval":false,"required_review_thread_resolution":false,
#      "allowed_merge_methods":["merge"]}},
#    {"type":"required_status_checks","parameters":{"strict_required_status_checks_policy":false,
#      "required_status_checks":[{"context":"ci-ok"}]}},
#    {"type":"code_scanning","parameters":{"code_scanning_tools":[{"tool":"CodeQL",
#      "security_alerts_threshold":"high_or_higher","alerts_threshold":"errors"}]}}]}
# 5. security updates + 4. alerts (déjà actives)
gh api -X PUT $R/automated-security-fixes
# 6. private vulnerability reporting
gh api -X PUT $R/private-vulnerability-reporting
# 8. approbation des contributeurs externes
gh api -X PUT $R/actions/permissions/fork-pr-contributor-approval -f approval_policy=all_external_contributors
# 9. épinglage SHA
gh api -X PUT $R/actions/permissions -F enabled=true -f allowed_actions=all -F sha_pinning_required=true
# 10. modes de merge
gh api -X PATCH $R -F allow_squash_merge=false -F allow_rebase_merge=false -F allow_merge_commit=true -F delete_branch_on_merge=true
# 11. fermer les alertes
for n in 1 2 3 13; do gh api -X PATCH $R/code-scanning/alerts/$n -f state=dismissed -f dismissed_reason="used in tests" -f dismissed_comment="Intentional test hook, absent from production build (checked in CI)"; done
```

Ordre conseillé : merger cette PR (`CODEOWNERS`, `SECURITY.md`), puis 6, 5, 8, 9, 10, 11, et le ruleset (1) en dernier. Le champ `context` de `ci-ok` et l'option `sha_pinning_required` sont à confirmer à l'application (API récente) ; `code_scanning` exige que CodeQL ait déjà produit un résultat sur `main`.
Rejouer la PR de test à 4 cas négatifs (T5) après le ruleset.
