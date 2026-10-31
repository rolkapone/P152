# Scan sécurité SEC-01 : Pipeline sécurité en CI

- Date : 2026-10-20. Branche `feature/SEC-01-pipeline-securite` (HEAD) contre `main`, 8 fichiers (2 workflows, docs).
- Revue d'entrée : APPROVE cycle 1 (`docs/reviews/SEC-01.md`).

## Scans exécutés

| Outil | Commande | Résultat |
|---|---|---|
| zizmor 1.31.1 (hors ligne) | `zizmor --offline .github/workflows/` | 0 finding (14 supprimés, sous le seuil par défaut) |
| zizmor 1.31.1, persona auditor | `zizmor --offline --persona auditor .github/workflows/` | 14 : 7 info (anonymous-definition), 7 low (6 undocumented-permissions, 1 concurrency-limits), 0 medium/high |
| gitleaks 8.30.1 | `gitleaks git --config .gitleaks.toml --redact --exit-code 1 .` | 47 commits, aucune fuite |
| gitleaks 8.30.1 | `gitleaks dir --config .gitleaks.toml --redact docs .github` | aucune fuite (fichiers non commités inclus) |

## Revue manuelle des workflows

- Triggers : `push` sur main, `pull_request`, `schedule`, `workflow_dispatch`. Aucun `pull_request_target` ni `workflow_run`.
- Permissions : `contents: read` au niveau workflow, élévations par job uniquement (`security-events: write`, `actions: read` pour CodeQL). `id-token: write` retiré de scorecard. Agrégateur `security` en `permissions: {}`.
- `persist-credentials: false` : 10/10 checkouts dans ci.yml, 4/4 dans security-scheduled.yml.
- Épinglage : toutes les actions par SHA de 40 caractères ; images semgrep et playwright par digest ; binaire gitleaks téléchargé avec version et SHA-256 vérifiés (`sha256sum -c`, `set -euo pipefail`).
- Injection : aucune expression `github.event.*`, `head_ref` ou `inputs` interpolée dans un `run:` ; `needs.*.result` passé par variable d'environnement.
- Contrôles silencieusement verts : l'agrégateur échoue désormais sur `failure|cancelled|skipped` (corrige un contournement possible par job sauté). `continue-on-error` sur OSV (ci.yml:229, security-scheduled.yml:23) assumé : le blocage SCA passe par `pnpm audit`. `|| true` de ci.yml:287 limité à un `grep` d'extraction, sans effet sur le verdict.

## Avis sur ci.yml:117 (config gitleaks conditionnelle)

Ligne antérieure à SEC-01 (non modifiée par ce diff). Si `.gitleaks.toml` est supprimé, gitleaks tourne avec ses règles par défaut : la règle custom p152 est perdue mais le scan reste actif. L'exploitation suppose une PR qui supprime ce fichier, visible en revue ; une PR pourrait de toute façon modifier son allowlist, donc rendre la config obligatoire ne ferme pas complètement le risque (il faut aussi un CODEOWNERS sur `.gitleaks.toml` et `.github/`). Sévérité MEDIUM (confiance élevée), non bloquant : à traiter en SEC-06.

## Findings

| Sévérité | Source | Emplacement | Problème | Correction recommandée |
|---|---|---|---|---|
| MEDIUM | manuel | .github/workflows/ci.yml:117 | Config gitleaks optionnelle : la suppression de `.gitleaks.toml` désactive la règle p152 sans faire échouer le job | `gitleaks git --config .gitleaks.toml ...` sans test `-f` (comme security-scheduled.yml) ; CODEOWNERS sur `.gitleaks.toml`, `semgrep-p152.yml`, `.github/` (SEC-06) |
| LOW | manuel | .github/workflows/security-scheduled.yml | Pas d'agrégateur ni de notification : un échec hebdomadaire peut passer inaperçu | Job d'alerte (issue automatique) en SEC-02 |
| LOW | manuel (revue) | ci.yml, upload-sarif / PR de forks | `security-events: write` inopérant sur PR de forks (token en lecture seule) : upload SARIF en échec, à confirmer au premier push | Conditionner l'upload à `github.event.pull_request.head.repo.full_name == github.repository` ; vérifier au Sprint 2 |
| LOW | zizmor (auditor) | ci.yml, security-scheduled.yml | 6 undocumented-permissions, 1 concurrency-limits | Commenter les permissions ; concurrency sur security-scheduled (SEC-06) |
| INFO | zizmor (auditor) | ci.yml, security-scheduled.yml | 7 anonymous-definition | Nommer les jobs (cosmétique) |

## Verdict

PASS : aucun finding CRITICAL/HIGH, aucun secret. Les MEDIUM/LOW sont proposés au scrum-master pour SEC-06 / SEC-02.
