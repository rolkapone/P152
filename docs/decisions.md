# Décisions du PO

Une ligne par décision, numérotation d'origine conservée (1 à 36 : ancien `backlog.md`, section « Décisions du PO »). Les n° 37 à 40 sont extraites de `docs/sprints/sprint-1.md`, `docs/sprints/sprint-2.md` et `docs/security/sec-02-reglages.md`. Une décision n'est écrite qu'ici ; ailleurs, un lien.

## Périmètre produit (kickoff)
| N° | Date | Décision | Voir |
|---|---|---|---|
| 1 | 2026-10-19 | **Compte utilisateur au MVP :** non, aucun compte, aucun backend. | |
| 2 | 2026-10-19 | **Mobile au MVP :** desktop d'abord, tactile en « Could », mise en page responsive minimale. | US-021 |
| 3 | 2026-10-19 | **Sauvegarde :** locale dans le navigateur, avec export/import JSON, pas de cloud. | US-018 |
| 4 | 2026-10-19 | **Unités affichées :** millimètres et centimètres, système métrique uniquement ; une seule exception : la diagonale d'écran (décision 8). | |
| 5 | 2026-10-19 | **Réalisme visuel du MVP :** objets génériques simples, détails minimaux, avant les matières de R2. | |
| 6 | 2026-10-19 | **Langue de l'interface :** anglais ; le français pourra être ajouté comme langue secondaire plus tard (option US-100, non engagée). | [plus tard](backlog-plus-tard.md) |
| 7 | 2026-10-19 | **Seuils d'alerte par défaut** (70 % d'occupation, 100 mm de marge de profondeur, 150 mm de zone libre devant le clavier) acceptés comme valeurs par défaut ajustables. | US-024 |

## UX
| N° | Date | Décision | Voir |
|---|---|---|---|
| 8 | 2026-10-19 | **Verdict :** seules les alertes Error rendent « Doesn't fit » ; les Warning (et Info) sont des conseils (« It fits · N tips »). | US-014 à US-017 |
| 9 | 2026-10-19 | **Diagonale d'écran en pouces** avec l'équivalent en mm affiché ; seule exception au système métrique. | US-008, US-011 |
| 10 | 2026-10-19 | **Vues « Top » et « Front »** en plus de « Reset view ». | US-004 |
| 11 | 2026-10-19 | **Magnétisme aux bords activé par défaut**, Maj = déplacement libre. | US-012 |
| 12 | 2026-10-19 | **Taille d'écran minimale supportée : 1366×768** (desktop). | US-004, US-005, US-022 |
| 13 | 2026-10-19 | **Personas validés** (`docs/design/ux/personas.md`). | |

## Opérations
| N° | Date | Décision | Voir |
|---|---|---|---|
| 14 | 2026-10-19 | **GitHub + Cloudflare Pages**, dépôt public, pas de domaine personnalisé (`*.pages.dev`) ; SEC-37 reste en « Plus tard » ; aucun push ni déploiement sans ordre explicite du PO. | US-001, SEC-02, SEC-03a, SEC-03b |

## Style
| N° | Date | Décision | Voir |
|---|---|---|---|
| 15 | 2026-10-19 | **Direction visuelle inspirée du langage visuel d'Apple sans rien copier de protégé :** Inter auto-hébergée + Lucide ; pas de SF Pro, SF Symbols, logo ni mise en page Apple. | US-005 |
| 16 | 2026-10-19 | **Verre à 86 % d'opacité minimum** avec repli opaque. | US-005 |
| 17 | 2026-10-19 | **Option « Reduce transparency » dans Help**, en plus de la préférence système `prefers-reduced-transparency`. | US-025 |
| 18 | 2026-10-19 | **Style « Cosy » plus chaud et plus sombre conservé** (R2). | US-103 |
| 19 | 2026-10-19 | **Nom provisoire « Deskfit ».** | |
| 20 | 2026-10-19 | **Thème par défaut = système** (clair/sombre). | US-005, US-025 |
| 21 | 2026-10-19 | **Rendu 3D « photo produit en studio ».** | US-004 |

## Fin du Sprint 1
| N° | Date | Décision | Voir |
|---|---|---|---|
| 22 | 2026-10-20 | **Sprint 1 validé** par le PO. | [sprint-1](sprints/sprint-1.md) |
| 23 | 2026-10-20 | **Dépôt GitHub public** sur le compte personnel du PO (le privé bloquerait CodeQL, SARIF, dependency-review et la protection de branche en plan gratuit). Le PO crée le dépôt vide et donne l'URL. Premier push après SEC-03a et MFA activée (threat model §14). | SEC-02, SEC-03a |
| 24 | 2026-10-20 | **E-mail professionnel jamais utilisé.** Avant le premier push : historique réécrit avec l'adresse noreply GitHub du PO, `user.email` configuré localement, vérification qu'aucun commit ne contient l'ancienne adresse. Condition bloquante. | |
| 25 | 2026-10-20 | **Docker autorisé** pour Semgrep. | |
| 26 | 2026-10-20 | **Ombre de contact à alléger** (avec le technical-artist). | US-004, décision 31 |
| 27 | 2026-10-20 | **Texte neutre de l'état `failed`** accepté. | US-005 |
| 28 | 2026-10-20 | **Sprint 2 accepté :** SEC-03a, US-005, US-006, SEC-02 (+ marge SEC-06 ou SEC-03b). **MVP à 96 points** confirmé. | [sprint-2](sprints/sprint-2.md) |

## Design du Sprint 2
| N° | Date | Décision | Voir |
|---|---|---|---|
| 29 | 2026-10-20 | **Shell (US-005) :** Undo/Redo masqués jusqu'à US-019 ; verdict vide « Nothing to check yet » ; onglet Objects visible avec état vide ; nom affiché « Deskfit » ; texte `failed` neutre avec « Reload page » au 2e échec ; `tooManyObjects` reformulé ; `tooLarge` gardé en « 1 MB ». | US-005, US-018 |
| 30 | 2026-10-20 | **Bureaux (US-006) :** catalogue de 7 bureaux (5 rectangulaires 100×60, 120×60, 140×70, 160×80, 180×80 ; 2 d'angle 160×140 et 180×160) ; angle orienté à droite ce sprint et sans « Custom size » ; flèches du clavier appliquent directement le bureau ; vignettes SVG dessinées par l'UI ; bornes rect 800–2400 × 500–1000 × 600–1300 mm, angle 1200–2400 × 1000–2000 mm. | US-006, US-007 |
| 31 | 2026-10-20 | **Ombre de contact allégée :** opacité 0,24, empreinte = bureau − 200×140 mm, dérivée du bureau ; keep-out de la caméra dérivé du bureau. | US-006 (et non US-008) |

## Design natif et workflow
| N° | Date | Décision | Voir |
|---|---|---|---|
| 32 | 2026-10-20 | **Design « app native Apple premium » v0.4 « Natif · Premium · Précis » VALIDÉ** (le v0.3 ne convenait pas) : fenêtre macOS (barre d'outils unifiée, barre latérale, inspecteur), repli iPadOS et iOS, 4 matériaux translucides, échelle typographique Apple avec Inter, Lucide ; toujours sans SF Pro, SF Symbols ni logo Apple. Écarts UX validés : bascules de volets dans la barre d'outils (Tab : droite juste après gauche) ; liste des bureaux en groupe unique avec filets, coche pour la ligne active. **US-005 réestimée à 8 pts** (restylage de US-004 inclus). | US-005, US-006, `design-system.md` |
| 33 | 2026-10-20 | **Liquid Glass :** apparence optionnelle plus tard, rattachée à US-025 (ou story R2/R3) ; exploration `docs/design/ui/maquettes/explorations/liquid-glass.html`. | US-025 |
| 34 | 2026-10-20 | **Ordre produit inchangé :** le MVP reste sur « ça rentre ? » ; le design suit en R2 (styles, matières), R3 (ambiance), R4 (modèles 3D libres CC0/CC-BY). Blender servira en R4 (préparation des modèles) ; **le PO sera prévenu avant**. | |
| 35 | 2026-10-20 | **Workflow GitHub :** chaque story = branche poussée + PR ouverte par le devops (description : story, critères, liens vers revue / design / QA / sécurité) ; CI sur la PR ; merge via la PR (commit de merge). | |
| 36 | 2026-10-20 | **Jamais versionnés :** `.claude/`, `CLAUDE.md`, `LISEZMOI-EQUIPE.md` (purge de l'historique et force-push de `main` alors en cours). Premier push fait ; première CI : 12 jobs verts, e2e rouge (timeouts du runner), correction par le qa-tester sur `fix/ci-e2e-runner-timeouts`. | |

## Ajouts extraits des documents de sprint
| N° | Date | Décision | Voir |
|---|---|---|---|
| 37 | 2026-10-19 | **Pas de dépôt GitHub ni de push pendant le Sprint 1** (sprint validé) ; US-001 T6 et SEC-01 T5/T6 reportées au Sprint 2 ; « CI verte » vérifiée en local avec les mêmes commandes que les jobs CI (écart consigné). Levée par 23. | [sprint-1](sprints/sprint-1.md) |
| 38 | 2026-10-20 | **Premier push** seulement si : SEC-03a mergée, MFA du PO activée, réglages du dépôt (SEC-02) validés par le PO, accord explicite du PO à ce moment-là. Remote `origin` = `github.com/rolkapone/P152` (public). Précise 23. | [sprint-2](sprints/sprint-2.md) |
| 39 | 2026-10-31 | **Modes de merge :** merge commit seul, sans suppression automatique des branches. Réglages SEC-02 appliqués hors ruleset, bypass Admin `pull_request`, exception minimatch (voir `docs/security/exceptions.md`), licence reportée. | [sec-02-reglages](security/sec-02-reglages.md) |
| 40 | 2026-10-31 | **Règle `code_scanning` (CodeQL ≥ High) retirée du ruleset de `main`** (elle bloquait toute PR, même verte) ; la garde est à remettre dans la CI (SEC-06). | [sec-02-reglages](security/sec-02-reglages.md), SEC-06 |

## Questions ouvertes (long terme, non bloquantes)
Voir [backlog.md](backlog.md).
