# ETAT — P152 « Deskfit » (point d'entrée unique)

Mis à jour le 2026-10-31 (ménage de fin de Sprint 2). Lire ce fichier en premier, puis uniquement les fichiers de sa story.

## Sprint en cours
**Sprint 2 terminé** (ouvert le 2026-10-20) : 16 pts livrés sur 16 engagés ; MVP **32 / 99 pts (32,3 %)**, vitesse 16 pts/sprint ; **en attente de la revue du PO**. Sections « Revue du sprint » et « Rétro » de [sprint-2](sprints/sprint-2.md) à rédiger par `socle:scrum-master`. Sprint 3 non planifié. La branche `docs/menage-sprint-2` (ce ménage) est poussée, **PR à ouvrir par le devops** après revue et rétro.

## Stories
| Story | Statut | Voie | Prochain agent | PR |
|---|---|---|---|---|
| SEC-03a | DONE (S2) | — | — | mergée avant le premier push |
| US-005 Shell | DONE (S2) | RENFORCÉE | — | #14 |
| US-006 Bureaux | DONE (S2) | STANDARD | — | #16 |
| SEC-02 Dépôt GitHub | DONE (S2) | RENFORCÉE | — | #17, #20 |
| Stabiliser `parseSetup.fuzz` | DONE (marge) | EXPRESS | — | #18 |
| 23 stories ouvertes (SEC-03b, SEC-04, SEC-05, SEC-06, US-007 à US-025) | TODO | à attribuer au planning | `socle:scrum-master` (planning Sprint 3) | — |

Index complet : [backlog.md](backlog.md). Fiches ouvertes : [stories/](stories/). Fiches DONE : [archive/stories/](archive/stories/). Dette : [dette.md](dette.md). Reste du Sprint 1 : 16 pts DONE (US-001 à US-004, SEC-01).

## 10 dernières décisions ([decisions.md](decisions.md))
- 40 — Règle CodeQL ≥ High retirée du ruleset de `main` ; garde à remettre en CI (SEC-06).
- 39 — Merge commit seul, sans suppression auto des branches ; bypass Admin `pull_request` ; exception minimatch.
- 38 — Premier push : SEC-03a, MFA, réglages SEC-02 validés, accord explicite.
- 37 — Pas de push pendant le Sprint 1 (levée par 23).
- 36 — Jamais versionnés : `.claude/`, `CLAUDE.md`, `LISEZMOI-EQUIPE.md`.
- 35 — Workflow : branche poussée, PR du devops, merge via la PR.
- 34 — Ordre produit inchangé : MVP « ça rentre ? », puis R2 à R4 ; Blender en R4, PO prévenu avant.
- 33 — Liquid Glass plus tard (US-025).
- 32 — Design v0.4 « Natif · Premium · Précis » validé ; US-005 à 8 pts.
- 31 — Ombre de contact allégée (0,24 ; bureau − 200×140 mm), dans US-006.

## Seuils actifs
- **Budget du bundle shell : 195 kB gz (index) / 295 kB gz (SceneCanvas)**, mesuré 176,6 / 267,1 : **à confirmer par le PO**.
- Perf : ≥ 60 FPS desktop milieu de gamme, ≥ 30 FPS smartphone récent (FPS mobile réel non mesuré) ; écran minimal 1366×768 (zone libre 806 px).
- Règle d'équipe : jamais `waitForTimeout` ; jamais deux Playwright ou `pnpm check` en parallèle. Exception sécurité : minimatch (dev), jusqu'au 2026-11-30 ([exceptions](security/exceptions.md)).
- Docs : ETAT ≤ 8 Ko, fiche de story ≤ 8 Ko, autres ≤ 40 Ko.

## Blocages et points en attente du PO
- Budget du bundle (ci-dessus) et critère de sortie « 10 runs » de US-005 / US-006 (5 et 2 runs faits) : [sprint-2](sprints/sprint-2.md), Questions n° 1 et 3.
- MFA du compte : [sprint-2](sprints/sprint-2.md) la dit à confirmer, [sec-02-reglages](security/sec-02-reglages.md) la dit confirmée (à rapprocher).
- Hors story : alertes Scorecard #5, #6, #7 (licence, décision PO), #9 ; 11 PR Dependabot ouvertes (#4 à #13, #15), dont #12, #13, #15 en CI rouge.
- Garde CodeQL ≥ High à remettre en CI : SEC-06 ([fiche](stories/SEC-06.md)).
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
