# Sprint 3 — Licence, dépendances à jour, garde CI et bureau sur mesure

**Dates** : planning le 2026-11-01 ; **validé par le PO le 2026-11-01** (décisions 52 à 58) ; en cours.
**Objectif du sprint** : protéger le dépôt (licence, dépendances, garde CodeQL) avant le 30/11, puis livrer les dimensions personnalisées du bureau (US-007), en ménageant le quota hebdomadaire.

## Capacité, quota et ordre

Vitesse de référence 16 pts (prévision prudente 15). **Quota contraint** : 42 % de la semaine déjà utilisés au 2026-11-01 (session 14 %), remise à zéro le **2026-11-06 à 16 h**, part P152 / P153 de 50 / 50 par défaut (décision 49 ; `budget.md` et devis par `socle:ressources`, **budget à confirmer par le PO**). Engagement ferme : **12 pts** (sous la capacité) ; marge de 4 pts.

| Phase | Ordre | Story | Voie | Pts | Coût | Pourquoi là |
|---|---|---|---|---|---|---|
| Avant le 6/11 | 0 | Mode direct : style (tokens, `:where(.pane *)`, fonts.css, boutons carte d'erreur) + repli `crypto.randomUUID` | direct, reviewer sonnet | 0 | très faible | petit, sans agent lourd |
| Avant le 6/11 | 1 | [SEC-07](../stories/SEC-07.md) LICENSE | EXPRESS | 1 | très faible | doc seule, décision 48 |
| Avant le 6/11 | 2 | Design de US-007 : ux-designer (UX-7, UX-n) puis ui-designer | — | 0 | faible (sonnet / court) | prépare l'après-6/11 |
| Avant le 6/11 | 3 | [SEC-08](../stories/SEC-08.md) maintenance lot 1 | STANDARD | 2 | moyen | débloque le bruit Dependabot ; CI à ne lancer qu'une fois |
| Après le 6/11 | 4 | [SEC-09](../stories/SEC-09.md) ESLint 10 | RENFORCÉE | 3 | moyen | échéance 30/11 ; marge de 3 semaines |
| Après le 6/11 | 5 | [SEC-06a](../stories/SEC-06a.md) garde CodeQL, fuzz, Semgrep | RENFORCÉE | 3 | moyen | CI seule, peu de code |
| Après le 6/11 | 6 | [US-007](../stories/US-007.md) taille du bureau | STANDARD | 3 | moyen-élevé | seule story MVP du sprint |
| Marge | 7 | [SEC-13](../stories/SEC-13.md) autres majeures (5), sinon Sprint 4 | RENFORCÉE | 5 | élevé | à engager seulement si le quota le permet |
| **Engagé** | | SEC-07 1 + SEC-08 2 + SEC-09 3 + SEC-06a 3 + US-007 3 | | **12** | | MVP : seulement 3 pts sur 12 |

Choix assumé : US-008 (8 pts, [3D], coûteuse) n'est **pas** engagée ; son design (technical-artist, catalogue lot 1) peut commencer en fin de sprint si quota restant, pour un Sprint 4 centré sur US-008 et US-010. MVP attendu après S3 : **35 / 99** (les 9 autres pts sont hors total MVP). Sprints restants : 64 pts / 16 = 4 (S4 à S7) ; peu de changement si SEC-13 passe en S4.

## Décisions applicables
Budget bundle 195 / 295 kB gz (43) ; « 10 runs » reformulé (44) ; maintenance groupée (45) ; minimatch jusqu'au 2026-11-30 (46) ; licence propriétaire (47, 48) ; économies (50). Voir [decisions.md](../decisions.md).

## Actions de la rétro du Sprint 2, appliquées
1. **Appels courts** : 3-4 tâches par appel, un commit chacune, une PASSATION ; aucun appel à 120 tours (tâches ci-dessous découpées en conséquence).
2. **Jamais deux E2E en parallèle** : le reviewer ne lance pas d'E2E (il se fie à `pnpm check`), le qa-tester lance seul les E2E ciblés, la CI lance la suite complète.
3. **Coût CI** : une seule vérification de la CI par PR ; cache des navigateurs Playwright / sharding et E2E limités aux specs touchées pour EXPRESS et docs, **ajoutés à SEC-06a ou à une PR CI dédiée, accord du PO requis** (touche la CI).
4. **Garde-fou de merge** : le mandat du devops cite le **numéro de PR** à merger ; il ne merge jamais une PR « DO NOT MERGE » ni une PR hors story (à inscrire dans le mandat de chaque appel de merge ; tâche T0 ci-dessous).

## Design requis (montré au PO en une fois, avant le code)
- **US-007 uniquement** : ux-designer reformule UX-7 (dock et zone libre à l'ouverture d'un volet, arbitrage avec UX-21) et fournit les UX-n de « Custom size » (états, erreurs sous le champ, focus) à partir de W3 et W7 ; ui-designer contrôle la maquette du NumberField et du « cm » sur une ligne.
- SEC-07/08/09/06a/13 : aucun design. Aucun asset 3D ce sprint.

## Stories et tâches (un commit chacune, 3-4 par appel)

| Id | Tâche | Agent |
|---|---|---|
| T0 | Mandat de merge : n° de PR obligatoire, interdit « DO NOT MERGE » (note dans la PASSATION du devops) | orchestrateur |
| D1-D2 | Direct : `tokens.css` en mouvement réduit `0s !important` ; retrait de `:where(.pane *)` ; `fonts.css` en `url()` seul ; boutons de la carte d'erreur en pleine largeur. Constat : [dette.md](../dette.md) les disait faits, le code ne le confirme pas (à vérifier) | session principale |
| D3 | Repli de `crypto.randomUUID` (`src/app/App.tsx`, `crypto.getRandomValues`) + test | session principale |
| SEC-07 | T1 `LICENSE` + `package.json` ; T2 README, check-licenses, dette Scorecard #7 | developer, reviewer |
| US-007 design | T1 UX-7 + UX-n ; T2 contrôle maquette | ux-designer, ui-designer |
| SEC-08 | T1 actions #11 ; T2 runtime #15 + mesure bundle ; T3 fermeture des PR | developer, devops |
| SEC-09 | T1 ESLint 10 et config ; T2 règle de couches (`from ".."`) + tests de lint ; T3 ADR + clôture de l'exception | developer, secdevops |
| SEC-06a | T1 job garde CodeQL (SARIF) ; T2 fuzz hebdomadaire ; T3 ancrage Semgrep + zizmor ; T4 doc « 10 runs » | devops, secdevops |
| US-007 | T1 modèle : params complets dans `deskSpec`, test `preset.name` ; T2 UI Custom size ; T3 « cm » sur une ligne, alertes recalculées ; T4 E2E ciblé (qa) | developer, qa-tester |

## Board

| Story | Voie | Statut (TODO / IN PROGRESS / IN REVIEW / QA / SECURITY / DONE / BLOCKED) | Cycles | Prochain agent | PR |
|---|---|---|---|---|---|
| Direct D1-D3 + repli `randomUUID` | direct | DONE (revue EXPRESS APPROVE) | n.d. | — | #23 |
| SEC-07 | EXPRESS | DONE | n.d. | — | #24 |
| US-007 (design) | — | TODO (statut à confirmer) | 0 / 3 | ux-designer | — |
| SEC-08 | STANDARD | DONE (revue APPROVE, secdevops PASS) | n.d. | — | #26 |
| SEC-09 | RENFORCÉE | TODO (après le 6/11) | 0 / 3 | developer | — |
| SEC-06a | RENFORCÉE | TODO (après le 6/11) | 0 / 3 | devops | — |
| US-007 | STANDARD | TODO (après le 6/11) | 0 / 3 | developer | — |
| SEC-13 | RENFORCÉE | TODO (marge) | 0 / 3 | developer | — |

Hors story : CI cache et raccourci E2E docs-only, DONE (PR #25, EXPRESS, cycle 1 ; à confirmer sur la première PR purement documentaire).

**Bilan avant le 6/11 (2026-11-01)** : 3 pts livrés sur 12 (SEC-07 1, SEC-08 2). Reste après le 6/11 : SEC-09, SEC-06a, US-007 (9 pts). Cycles « n.d. » : nombre de cycles non transmis par la passation, à compléter par le devops.

## Risques

| # | Risque | Prob. / impact | Parade | Responsable |
|---|---|---|---|---|
| R14 | Quota hebdomadaire épuisé avant le 6/11 (42 % déjà, part 50 / 50 avec P153) | Moyenne / Élevé | Ordre « peu coûteux d'abord » ; stop si > 80 % du budget du sprint ; devis `socle:ressources` | ressources (transmis) |
| R15 | ESLint 10 incompatible avec un plugin : minimatch toujours là le 30/11 | Moyenne / Moyen | SEC-09 engagée tôt après le 6/11 ; décision de prolongation au PO le 25/11 | developer |
| R16 | Une majeure (Vite 8) dépasse le budget du bundle ou casse la CSP | Moyenne / Moyen | Une famille par PR, mesure avant/après, retour arrière simple | developer |
| R17 | CI E2E de 15 à 18 min par PR sur 5 PR : coût CI et quota | Élevée / Moyen | Une vérification par PR ; E2E limités aux specs touchées (accord PO) | devops |
| R18 | Merge d'une mauvaise PR (incident #19) | Faible / Élevé | T0 : n° de PR dans le mandat, jamais « DO NOT MERGE » | orchestrateur |
| R19 | Écart de dette : style « fait » dans `dette.md`, absent du code | Moyenne / Faible | Vérifier avant D1 ; corriger `dette.md` | scrum-master (clos : constat confirmé, corrigé en PR #23) |

## Questions pour le PO
1. Valider l'engagement de 12 pts (SEC-13 en marge) et l'ordre avant / après le 6/11.
2. Budget de quota du sprint (devis de `socle:ressources` à venir, `budget.md`).
3. Accord pour modifier la CI (cache Playwright, E2E ciblés sur PR EXPRESS / docs) : traité en PR dédiée (#25) ; reste à confirmer sur une PR purement documentaire.
4. Texte de `LICENSE` : relire l'avis ajouté après la phrase imposée (pas un avis juridique).
