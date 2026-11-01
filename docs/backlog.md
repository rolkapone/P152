# Backlog — P152 (nom provisoire du produit : « Deskfit »)

## Plan de release

| Indicateur | Valeur |
|---|---|
| Points MVP (Must + Should) | **99** (Must 89, Should 10) ; +1 pt : SEC-03a passe de 1 à 2 pts (correctif CSP React Aria, finding MEDIUM US-004) ; **+3 pts le 2026-10-20 : US-005 passe de 5 à 8 pts** (design natif v0.4, décision 32) |
| Dont stories sécurité (SEC-01 à SEC-05) | 9 (Must 8, Should 1) |
| Points « Could » MVP (hors total, bonus) | 9 (US-021, US-023, SEC-06) |
| Maintenance et licence hors total MVP (ajoutées le 2026-11-01) | SEC-07 1, SEC-08 2, SEC-09 3, SEC-13 5, SEC-06a 3 (extrait de SEC-06 : SEC-06 passe à 2) = 14 pts, comptés dans la vitesse mais pas dans les 99 |
| Points livrés | **32 / 99 = 32,3 %** (Sprint 1 : US-001 3, US-002 2, US-003 3, SEC-01 3, US-004 5, toutes DONE = 16 ; Sprint 2 : SEC-03a 2, US-005 8, US-006 5, SEC-02 1, DONE) |
| Vitesse moyenne | **16 pts/sprint** (Sprint 1 : 16, Sprint 2 : 16 ; prévision prudente de 15 pts conservée pour le planning) |
| Sprint en cours | **Sprint 2** (ouvert le 2026-10-20) : SEC-03a 2 (DONE) + US-005 **8** (DONE, PR #14) + US-006 **5** (DONE, PR #16) + SEC-02 1 (DONE, PR #17 et #20) = **16 pts livrés** sur 16 engagés (capacité prudente 15 : dépassement de 1 pt, accepté) ; livrés 32 / 99 (32,3 %), restants 67 |
| Sprints restants estimés avant MVP | **5** après le Sprint 2 (67 pts restants / 16 = 4,2, arrondi à 5 ; 5 aussi à 15 pts/sprint), soit les Sprints 3 à 7 |
| Dernière mise à jour | 2026-10-31 (SEC-02 DONE, PR #17 et #20, comptée dans les 32 pts ; US-006 DONE, PR #16, comptée dans les 31 pts ; US-005 DONE, PR #14 ; SEC-03a DONE, comptée dans les 18 précédents ; voies attribuées au Sprint 2 dans `docs/sprints/sprint-2.md`). Aucun SHA de commit dans les docs : les numéros de PR font foi |

Détail du recalcul : 83 pts (kickoff) + SEC-01 (3) + SEC-02 (1) + SEC-03a (2 depuis la fin du Sprint 1) + SEC-03b (1) + SEC-04 (1) + SEC-05 (1) + US-024 (2, réglages d'alertes) + US-025 (2, Help et préférences d'affichage) = 96, puis +3 (US-005 5 → 8, restylage natif v0.4) = **99**. Les autres éléments issus de US-004 (dette, mineurs QA) sont des critères ajoutés à des stories existantes ou à SEC-06 (Could), sans point supplémentaire ; à réestimer au planning du Sprint 2 s'ils pèsent.
Hypothèse : le premier déploiement public n'a lieu qu'à la fin du MVP (SEC-03a avant le premier push, SEC-03b avant ce déploiement, SEC-05 juste avant la release).

Légende : priorité MoSCoW, estimation en points (1, 2, 3, 5, 8). Tags `[UI]` = écran, `[3D]` = scène/rendu/assets.
Convention de langue : documents en français ; textes visibles dans l'app en **anglais** (libellés cités entre guillemets = texte UI anglais). Unités métriques (mm/cm), **sauf la diagonale d'écran affichée en pouces avec son équivalent en mm** (décision 8).
Les critères UX/UI de ce document viennent de `docs/design/ux/principes.md`, `docs/design/ux/wireframes-mvp.md` (W1 à W11) et `docs/design/ui/design-system.md`. Maquettes : `docs/design/ui/maquettes/index.html` ; DA 3D : `docs/design/3d/direction-artistique.md` ; catalogue : `docs/design/3d/assets-mvp.md` et `assets/catalog/`.

## Questions pour le PO

Questions A à F de fin de Sprint 1 : **répondues le 2026-10-20** (voir [decisions.md](decisions.md), n° 22 à 28) ; G reste ouverte. Détail dans `docs/sprints/sprint-1.md`, section « Questions pour le PO ») : A. dépôt GitHub et premier push ; B. e-mail nominatif ou noreply dans les commits ; C. Docker pour Semgrep ; D. ombre de contact ; E. texte de l'état `failed` ; F. contenu du Sprint 2 ; G. questions long terme.

Aucune question ouverte pour le Sprint 2 : la question 1 (bornes du bureau) est **tranchée par le PO le 2026-10-20** ([décision 30](decisions.md) : rectangulaire 800–2400 × 500–1000 × 600–1300 mm ; angle 1200–2400 × 1000–2000 mm).

### Questions ouvertes à long terme (non bloquantes pour le MVP, issues du threat model §12)
- **Affiliation (R5)** : des liens d'affiliation sont-ils compatibles avec la promesse de neutralité vis-à-vis des marques ? Si oui, déclaration « affiliate links » et classement indépendant de la commission ?
- **Âge minimum des comptes (R6)** : 13, 15 ou 16 ans ?
- **Hébergement des données dans l'UE (R6/R7)** : exigé pour le backend et le fournisseur IA, même à coût supérieur ?

---


## Stories

Statuts au 2026-10-31 (fin du Sprint 2). Les stories DONE sont archivées dans `docs/archive/stories/` ; les stories ouvertes ont une fiche dans `docs/stories/`. Voie « — » = à attribuer au planning (voies : CLAUDE.md). Dette et suivi : [dette.md](dette.md). Décisions du PO : [decisions.md](decisions.md). Vision long terme (R2 à R8, option i18n) : [backlog-plus-tard.md](backlog-plus-tard.md).

| Id | Titre | Tags | Voie | Pts | Statut | Sprint | Fiche |
|---|---|---|---|---|---|---|---|
| US-001 | Setup repo, build et CI | — | — | 3 | DONE | S1 | [fiche](archive/stories/US-001.md) |
| US-002 | Threat model initial | — | — | 2 | DONE | S1 | [fiche](archive/stories/US-002.md) |
| US-003 | Architecture socle et modèle de données du setup | — | — | 3 | DONE | S1 | [fiche](archive/stories/US-003.md) |
| SEC-01 | Pipeline sécurité en CI | — | — | 3 | DONE | S1 | [fiche](archive/stories/SEC-01.md) |
| SEC-02 | Durcissement du dépôt GitHub public | — | RENFORCÉE | 1 | DONE | S2 | [fiche](archive/stories/SEC-02.md) |
| SEC-03a | Génération des en-têtes de sécurité (`_headers`, CSP) et CSP de React Aria | — | — | 2 | DONE | S2 | [fiche](archive/stories/SEC-03a.md) |
| SEC-03b | Déploiement sécurisé sur Cloudflare Pages | — | — | 1 | TODO | — | [fiche](stories/SEC-03b.md) |
| SEC-06 | Durcissement CI (reste, après extraction de SEC-06a) | — | — | 2 | TODO | — | [fiche](stories/SEC-06.md) |
| SEC-06a | Garde CodeQL, fuzz hebdomadaire, ancrage Semgrep | — | RENFORCÉE | 3 | TODO | S3 | [fiche](stories/SEC-06a.md) |
| SEC-07 | Licence propriétaire du dépôt | — | EXPRESS | 1 | TODO | S3 | [fiche](stories/SEC-07.md) |
| SEC-08 | Maintenance des dépendances, lot 1 | — | STANDARD | 2 | TODO | S3 | [fiche](stories/SEC-08.md) |
| SEC-09 | Maintenance, lot 2a : ESLint 10 (avant le 30/11) | — | RENFORCÉE | 3 | TODO | S3 | [fiche](stories/SEC-09.md) |
| SEC-13 | Maintenance, lot 2b : autres majeures | — | RENFORCÉE | 5 | TODO | S3 (marge) ou S4 | [fiche](stories/SEC-13.md) |
| SEC-04 | Mention « vos données restent dans ce navigateur » | [UI] | — | 1 | TODO | — | [fiche](stories/SEC-04.md) |
| SEC-05 | Revue de sécurité avant la release MVP | — | — | 1 | TODO | — | [fiche](stories/SEC-05.md) |
| US-004 | Scène 3D de base et caméra orbitale | [UI][3D] | — | 5 | DONE | S1 | [fiche](archive/stories/US-004.md) |
| US-005 | Shell de l'application en anglais | [UI] | RENFORCÉE | 8 | DONE | S2 | [fiche](archive/stories/US-005.md) |
| US-006 | Choisir un bureau dans un catalogue | [UI][3D] | STANDARD | 5 | DONE | S2 | [fiche](archive/stories/US-006.md) |
| US-007 | Dimensions personnalisées du bureau | [UI] | STANDARD | 3 | TODO | S3 | [fiche](stories/US-007.md) |
| US-008 | Bibliothèque d'objets paramétrables, lot 1 | [3D] | — | 8 | TODO | — | [fiche](stories/US-008.md) |
| US-009 | Bibliothèque d'objets paramétrables, lot 2 | [3D] | — | 5 | TODO | — | [fiche](stories/US-009.md) |
| US-010 | Ajouter un objet à la scène | [UI][3D] | — | 3 | TODO | — | [fiche](stories/US-010.md) |
| US-011 | Panneau de propriétés de l'objet | [UI] | — | 5 | TODO | — | [fiche](stories/US-011.md) |
| US-012 | Déplacer un objet à la souris | [3D] | — | 5 | TODO | — | [fiche](stories/US-012.md) |
| US-013 | Sélectionner, pivoter, dupliquer, supprimer | [UI][3D] | — | 3 | TODO | — | [fiche](stories/US-013.md) |
| US-014 | Détection de débordement du bureau | [3D] | — | 3 | TODO | — | [fiche](stories/US-014.md) |
| US-015 | Détection d'encombrement et collisions | [3D] | — | 5 | TODO | — | [fiche](stories/US-015.md) |
| US-016 | Alertes de profondeur utile | [3D] | — | 3 | TODO | — | [fiche](stories/US-016.md) |
| US-017 | Affichage des alertes | [UI][3D] | — | 5 | TODO | — | [fiche](stories/US-017.md) |
| US-024 | Réglages des alertes (écran « Alert settings ») | [UI] | — | 2 | TODO | — | [fiche](stories/US-024.md) |
| US-018 | Sauvegarde locale et restauration | [UI] | — | 3 | TODO | — | [fiche](stories/US-018.md) |
| US-019 | Annuler / rétablir | [UI] | — | 3 | TODO | — | [fiche](stories/US-019.md) |
| US-020 | Écran d'accueil et démarrage guidé | [UI] | — | 3 | TODO | — | [fiche](stories/US-020.md) |
| US-025 | Help, thème et préférences d'affichage | [UI] | — | 2 | TODO | — | [fiche](stories/US-025.md) |
| US-022 | Budgets de performance et tests E2E de référence | — | — | 3 | TODO | — | [fiche](stories/US-022.md) |
| US-021 | Utilisation tactile et mobile | [UI] | — | 5 | TODO | — | [fiche](stories/US-021.md) |
| US-023 | Capture d'écran du setup | [UI][3D] | — | 2 | TODO | — | [fiche](stories/US-023.md) |

## Notes par epic

- **Epic F — Alertes « ça rentre ? »** (US-014 à US-017, US-024) : seules les alertes de niveau **Error** rendent le verdict « Doesn't fit » ; les **Warning** et **Info** sont des conseils ("tips"). Error = débordement, chevauchement, profondeur de bureau insuffisante ; Warning = encombrement > seuil, zone libre insuffisante ; Info = confort (décision 8, [decisions.md](decisions.md)).
