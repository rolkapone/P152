# ETAT — P152 « Deskfit » (point d'entrée unique)

Mis à jour le 2026-11-01 (Sprint 3 en cours : fins de story avant le 6/11 faites). Lire ce fichier en premier, puis uniquement les fichiers de sa story.

## Sprint en cours
**Sprint 3 en cours** ([sprint-3](sprints/sprint-3.md), validé le 2026-11-01, décisions 52 à 58). Engagement 12 pts : SEC-07 (EXPRESS 1), SEC-08 (STANDARD 2), SEC-09 ESLint 10 (RENFORCÉE 3), SEC-06a (RENFORCÉE 3), US-007 (STANDARD 3). SEC-13 reportée au Sprint 4. Budget 28 M unités (8 M avant le 6/11). **Avant le 6/11, livré : D1-D3 + repli `randomUUID` (PR #23), SEC-07 (PR #24), SEC-08 (PR #26) ; 3 pts sur 12.** Design US-007 : statut à confirmer. MVP 32 / 99 inchangé (SEC-07 et SEC-08 hors total MVP ; 35 attendus après S3). **Prochain, après la remise à zéro du quota le 2026-11-06 à 16 h (Paris) : SEC-09 (ESLint 10, échéance minimatch 30/11), puis SEC-06a, puis US-007.**

## Stories
| Story | Statut | Voie | Prochain agent | PR |
|---|---|---|---|---|
| SEC-03a | DONE (S2) | — | — | mergée avant le premier push |
| US-005 Shell | DONE (S2) | RENFORCÉE | — | #14 |
| US-006 Bureaux | DONE (S2) | STANDARD | — | #16 |
| SEC-02 Dépôt GitHub | DONE (S2) | RENFORCÉE | — | #17, #20 |
| Stabiliser `parseSetup.fuzz` | DONE (marge) | EXPRESS | — | #18 |
| Correctifs D1-D3 + repli `randomUUID` (mode direct) | DONE (S3) | direct | — | #23 |
| SEC-07 LICENSE | DONE (S3) | EXPRESS | — | #24 |
| CI : cache et E2E docs-only (hors story) | DONE (S3) | EXPRESS | — | #25 |
| SEC-08 maintenance lot 1 | DONE (S3) | STANDARD | — | #26 |
| SEC-09 ESLint 10 | TODO (S3, après le 6/11) | RENFORCÉE | developer | — |
| SEC-06a garde CodeQL, fuzz, Semgrep | TODO (S3, après le 6/11) | RENFORCÉE | devops | — |
| US-007 taille du bureau | TODO (S3, après le 6/11) | STANDARD | developer | — |
| SEC-13 (Sprint 4, décision 54) | TODO | RENFORCÉE | developer | — |
| Autres ouvertes (SEC-03b, SEC-04, SEC-05, SEC-06 reste, US-008 à US-025) | TODO | à attribuer | `socle:scrum-master` | — |

Index complet : [backlog.md](backlog.md). Fiches ouvertes : [stories/](stories/). Fiches DONE : [archive/stories/](archive/stories/) (SEC-07 et SEC-08 à archiver par `socle:archiviste`). Dette : [dette.md](dette.md). Reste du Sprint 1 : 16 pts DONE (US-001 à US-004, SEC-01).

## Dernières décisions ([decisions.md](decisions.md))
- 52 à 58 — planification du Sprint 3 : plan, budget 28 M, SEC-13 au S4, PR CI, US-007 (UX), cm insécable, texte LICENSE.
- 42 à 51 — revue du Sprint 2 : Sprint 2 validé, bundle 195/295, « 10 runs » reformulé, maintenance groupée, minimatch au 30/11, app lucrative, LICENSE propriétaire (dépôt public), budget.md, 3 économies, Liquid Glass à part (US-170).
- 41 — MFA et réglages du dépôt confirmés le 2026-10-20.
- 40 — Règle CodeQL ≥ High retirée du ruleset de `main` ; garde à remettre en CI (SEC-06).
- 39 — Merge commit seul, sans suppression auto des branches ; bypass Admin `pull_request` ; exception minimatch.
- 38 — Premier push : SEC-03a, MFA, réglages SEC-02 validés, accord explicite.
- 37 — Pas de push pendant le Sprint 1 (levée par 23).
- 36 — Jamais versionnés : `.claude/`, `CLAUDE.md`, `LISEZMOI-EQUIPE.md`.
- 35 — Workflow : branche poussée, PR du devops, merge via la PR.
- 34 — Ordre produit inchangé : MVP « ça rentre ? », puis R2 à R4 ; Blender en R4, PO prévenu avant.
- 33 — Liquid Glass plus tard (US-025).
- 32 — Design v0.4 « Natif · Premium · Précis » validé ; US-005 à 8 pts.

## Seuils actifs
- **Budget du bundle shell : 195 kB gz (index) / 295 kB gz (SceneCanvas)**, mesuré 176,6 / 267,1 : accepté (décision 43), à réduire si possible.
- Perf : ≥ 60 FPS desktop milieu de gamme, ≥ 30 FPS smartphone récent (FPS mobile réel non mesuré) ; écran minimal 1366×768 (zone libre 806 px).
- Règle d'équipe : jamais `waitForTimeout` ; jamais deux Playwright ou `pnpm check` en parallèle. Exception sécurité : minimatch (dev), jusqu'au 2026-11-30 ([exceptions](security/exceptions.md)).
- Docs : ETAT ≤ 8 Ko, fiche de story ≤ 8 Ko, autres ≤ 40 Ko.

## Blocages et points en attente du PO
- Sprint 3 : plan, budget et CI validés (décisions 52 à 55). Reste : budget de quota à confirmer dans `equipe/ressources/budget.md` (non versionné) par `socle:ressources`.
- Hors story : alertes Scorecard #5, #6, #9 ; #7 (licence) acceptée comme choix du PO ([dette](dette.md)). 9 PR Dependabot ouvertes (#4 à #10, #12, #13) ; #11 et #15 fermées au profit de #26 ; #12 et #13 signalées en CI rouge.
- Garde CodeQL ≥ High à remettre en CI : [SEC-06a](stories/SEC-06a.md).
- Questions long terme (affiliation, âge minimum, hébergement UE) : [backlog.md](backlog.md).

## Où trouver quoi
| Besoin | Fichier |
|---|---|
| Décisions du PO | [decisions.md](decisions.md) |
| Backlog (index, plan de release), vision R2 à R8 | [backlog.md](backlog.md), [backlog-plus-tard.md](backlog-plus-tard.md) |
| Une story | [stories/](stories/) (ouvertes), [archive/stories/](archive/stories/) (DONE) |
| Dette et suivi | [dette.md](dette.md) |
| Architecture (un fichier par ADR) | [architecture/index.md](architecture/index.md), [transverse](architecture/transverse.md) |
| Sprints (plan, board, revue, rétro) | [sprints/](sprints/) |
| Sécurité | [threat-model](security/threat-model.md) (MVP), [long terme](security/threat-model-long-terme.md), [annexes](security/threat-model-annexes.md), [ci-security](security/ci-security.md), [scans/](security/scans/) |
| Revues, QA, design, CI | [reviews/](reviews/), [qa/](qa/), [design/](design/), [ci/](ci/) |
| Produit | [vision.md](vision.md) |
