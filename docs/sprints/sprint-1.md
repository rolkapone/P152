# Sprint 1 — Fondations et premier rendu

**Dates** : à fixer avec le PO au lancement (le sprint démarre quand les prérequis ci-dessous sont remplis).
**Objectif du sprint** : disposer d'une chaîne de livraison vérifiée (build, CI, sécurité, threat model, architecture et schéma de données) et afficher une première scène 3D navigable avec un bureau, en studio.

## Capacité et engagement

| Story | Titre | Tags | Priorité | Points | Remarque |
|---|---|---|---|---|---|
| US-001 | Setup repo, build et CI | | Must | 3 | partiellement faite, reste l'exécution et la vérification |
| US-002 | Threat model initial | | Must | 2 | livrable produit, reste la boucle DoD |
| US-003 | Architecture socle et modèle de données du setup | | Must | 3 | |
| SEC-01 | Pipeline sécurité en CI | | Must | 3 | |
| US-004 | Scène 3D de base et caméra orbitale | [UI][3D] | Must | 5 | **engagement conditionnel** (voir risques) |
| **Total** | | | | **16** | capacité par défaut : 15 |

Le total dépasse la capacité de 1 point : US-001 et US-002 sont déjà largement produites (CI et threat model écrits), leur reste à faire est de la vérification. Si US-001 est retardé par l'installation de Node/pnpm, **US-004 est la première story retirée du sprint** (retour dans le backlog, sans impact sur les autres). US-005 (shell, 5 pts) ouvre le Sprint 2, avec US-006, SEC-02 et SEC-03.

Vitesse : aucun historique, 15 pts/sprint par défaut. Plan de release : 95 pts MVP, 7 sprints estimés (`docs/backlog.md`).

## Prérequis du PO (avant le démarrage)

1. Installer **Node 24 LTS** (version épinglée dans `.nvmrc`) et **pnpm 10.34.7** (`corepack enable` puis `corepack prepare pnpm@10.34.7 --activate`, ou installation officielle) sur le poste.
2. Installer **Git LFS** si absent (`git lfs install`).
3. Créer le dépôt GitHub **public** et autoriser un premier `push` : action réservée au PO, nécessaire pour vérifier la CI (US-001) et activer le durcissement (SEC-02, Sprint 2). Sans cet accord, la CI reste vérifiable seulement par lecture du workflow et la vérification est reportée.
4. Répondre à la question ouverte « bornes du bureau » (`docs/backlog.md`) avant le Sprint 2 (US-006/US-007) ; non bloquant pour ce sprint.

## Revue du design avant développement (règle CLAUDE.md)

Produits avant le sprint ; à montrer au PO en une fois au lancement :
- Maquettes UI : `docs/design/ui/maquettes/index.html`, design system `docs/design/ui/design-system.md`, tokens `docs/design/ui/tokens.css`.
- DA 3D et aperçu : `docs/design/3d/direction-artistique.md`, `docs/design/3d/apercu/index.html`, catalogue `docs/design/3d/assets-mvp.md` et `assets/catalog/` (10 types, matériaux, styles).
- UX : `docs/design/ux/wireframes-mvp.md` (W2 pour ce sprint), `docs/design/ux/principes.md`.

## Stories et tâches

### US-001 — Setup repo, build et CI [devops] — 3 pts
Branche : `feature/US-001-setup-ci`.
- [ ] T1 (PO) Installer Node 24 + pnpm 10.34.7 (prérequis).
- [ ] T2 `pnpm install` ; corriger les erreurs d'installation ; commiter `pnpm-lock.yaml`.
- [ ] T3 `pnpm check` (lint, types, tests unitaires, build) vert en local ; corriger les écarts.
- [ ] T4 Vérifier `.npmrc` / `pnpm-workspace.yaml` : `onlyBuiltDependencies`, `minimumReleaseAge` (3 jours) ; `sourcemap: false` en production (déjà dans `vite.config.ts`).
- [ ] T5 Vérifier `.gitignore` (`.env`, `.env.*`), `.env.example` factice, `.gitattributes` (LFS), `check:assets` vert.
- [ ] T6 Après création du dépôt par le PO : pousser, vérifier que `ci.yml` s'exécute et que `ci-ok` est vert ; consigner les écarts.
- [ ] T7 Mettre à jour la doc d'installation (README) si nécessaire.
Références : ADR-OPS-01/02/03 dans `docs/architecture.md`.

### US-002 — Threat model initial [secdevops] — 2 pts
Branche : `feature/US-002-threat-model` (docs uniquement).
- [x] T1 Threat model et définition des scans produits (`docs/security/`).
- [ ] T2 Relecture reviewer (cohérence avec `architecture.md`, exhaustivité des surfaces) ; verdict APPROVE / CHANGES_REQUESTED.
- [ ] T3 Validation secdevops (auto-revue : aucun secret, liens exacts).
- [ ] T4 Commit des documents sur la branche et merge `--no-ff` par le devops. Pas de contrôle design ni QA (aucun écran, aucune scène).

### US-003 — Architecture socle et modèle de données du setup [developer + graphics-engineer] — 3 pts
Branche : `feature/US-003-architecture-schema`.
- [ ] T1 Créer l'ossature `src/core/` (`schema`, `catalog`, `io`) conforme aux règles de dépendance (ADR-APP-07).
- [ ] T2 Schéma Zod `SetupV1` (jitless) et types dérivés ; `parseSetup` minimal (taille, JSON, enveloppe, validation stricte).
- [ ] T3 Chargement et validation du catalogue `assets/catalog/` par schéma (clés de prototype rejetées, `min ≤ défaut ≤ max`) + tests.
- [ ] T4 Tests unitaires du schéma (cas valides, invalides, limites) et fixtures `tests/fixtures/setups/`.
- [ ] T5 i18n : mise en place d'i18next, fichier `en` et clé typée (aucun texte en dur).
- [ ] T6 Vérifier que `docs/architecture.md` reste à jour (ADR) ; ajouter les ADR manquants.
Références : ADR-3D-02, ADR-APP-03/05/07.

### SEC-01 — Pipeline sécurité en CI [devops + secdevops] — 3 pts
Branche : `feature/SEC-01-ci-security`. Dépend de US-001 (T3 au minimum).
- [ ] T1 Intégrer les jobs gitleaks, CodeQL, Semgrep, zizmor, SCA + licences, `build-hardening` dans le slot `# SECDEVOPS-SLOT` ; job agrégateur `security` requis par `ci-ok`.
- [ ] T2 Installer `.gitleaks.toml`, `.semgrep/p152.yml`, `scripts/check-licenses.mjs` depuis `docs/security/ci/`.
- [ ] T3 Épingler actions et images (SHA / digest) ; vérifier `dependabot.yml` et `security-scheduled.yml`.
- [ ] T4 `build-hardening` : `dist/_headers` n'existe pas encore (génération livrée par SEC-03, Sprint 2). Le contrôle des en-têtes passe en **avertissement documenté** pour ce seul point tant que SEC-03 n'est pas mergé ; les autres contrôles (hooks de test, `index.html`, gitleaks `dist`) restent bloquants. Alternative si le PO préfère : avancer la partie « génération `_headers`/CSP » de SEC-03 dans ce sprint (+1 à 2 pts).
- [ ] T5 Vérification des 4 cas négatifs (faux secret, `innerHTML`, dépendance HIGH, `__p152test` dans `dist`) sur une PR de test, puis annulation.
- [ ] T6 Vérifier la remontée SARIF dans Code scanning.
Références : `docs/security/ci-security.md`, `docs/security/ci/`.

### US-004 — Scène 3D de base et caméra orbitale [UI][3D] [graphics-engineer + technical-artist] — 5 pts
Branche : `feature/US-004-scene-camera`. Dépend de US-001 et US-003.
- [ ] T1 Canvas R3F en `lazy()` derrière l'écran de chargement ; `frameloop="demand"` ; renderer WebGL2.
- [ ] T2 Bureau par défaut généré depuis `assets/catalog/object-types/desk.json` (140×70, plateau + pieds, mètres, origine au sol).
- [ ] T3 Studio : sol, fond continu, éclairage doux neutre, ombres de contact douces, tokens `--scene-*` (clair / sombre).
- [ ] T4 `CameraControls` : tourner (clic gauche sur le vide), zoom molette borné, déplacer (clic droit) borné, jamais sous le plateau.
- [ ] T5 Vues "Reset view", "Top", "Front" et barre flottante de scène minimale (verre à 86 % avec repli, `aria-pressed`, info-bulles, clavier) ; transitions désactivées sous `prefers-reduced-motion`. Composants de la barre : ui-designer / developer (version minimale du shell, le shell complet est US-005).
- [ ] T6 Astuce "Drag to turn the view, scroll to zoom, right-drag to move the view" (masquable).
- [ ] T7 Tests unitaires (limites de caméra, conversion mm → m) ; mesure ≥ 60 FPS, draw calls et triangles via `window.__p152perf` (build de test uniquement).
- [ ] T8 Contrôle design (ui-designer) sur la barre de scène ; QA E2E : captures, FPS à 1366×768 ; accessibilité des boutons de vue.
Références : maquette `docs/design/ui/maquettes/index.html` (barre de scène), aperçu `docs/design/3d/apercu/index.html`, DA `docs/design/3d/direction-artistique.md` §3 et §10, wireframe W2, ADR-3D-01/07/08.

## Board

| Story | Statut (TODO / IN PROGRESS / IN REVIEW / SECURITY / DONE / BLOCKED) | Cycles de review | Notes |
|---|---|---|---|
| US-001 | TODO | 0 / 3 | Partiellement faite (3 commits, CI écrite, rien exécuté). Bloquée tant que Node 24 + pnpm ne sont pas installés (prérequis PO). |
| US-002 | TODO | 0 / 3 | Livrable produit ; reste relecture reviewer, validation secdevops, merge devops. |
| US-003 | TODO | 0 / 3 | Démarre après US-001 T3 (`pnpm check` vert). |
| SEC-01 | TODO | 0 / 3 | Démarre après US-001 T3 ; contrôle `_headers` en avertissement jusqu'à SEC-03. |
| US-004 | TODO | 0 / 3 | Engagement conditionnel (capacité). Dépend de US-001 et US-003. |

## Risques

| # | Risque | Probabilité / impact | Parade |
|---|---|---|---|
| R1 | Node 24 / pnpm non installés : tout le sprint est bloqué (rien n'a jamais été exécuté) | Élevée / Élevé | Prérequis PO en premier ; sinon passer les stories en BLOCKED et le signaler dès le jour 1 |
| R2 | Première exécution de `pnpm install` / `pnpm check` : écarts d'outillage (versions ESLint 9.39, TS 5.9, Vite 7, Vitest 3 jamais testées ensemble) | Moyenne / Moyen | Time-box d'une journée en T2/T3 ; ajuster les versions par ADR |
| R3 | Dépôt GitHub non créé : CI et CodeQL non vérifiables, SEC-01 partiellement validable | Moyenne / Moyen | Demander l'accord du PO pour la création et le premier push dès le début |
| R4 | `build-hardening` rouge faute de `dist/_headers` | Élevée / Faible | Avertissement documenté en SEC-01 (T4) ou avancer la génération des en-têtes |
| R5 | Sprint à 16 pts (capacité 15) | Moyenne / Faible | US-004 retirée en premier si retard |
| R6 | Performances WebGL sur la machine du PO non connues (≥ 60 FPS sur milieu de gamme) | Faible / Moyen | Mesure dès T7 de US-004 ; paliers de qualité ADR-3D-08 |
| R7 | Les 5 pts de US-005 (shell + Inter + verre) sont chargés pour le Sprint 2 ; US-004 en livre déjà une partie (barre de scène) | Moyenne / Faible | Coordonner le périmètre de la barre entre US-004 et US-005 |

## Définition de terminé (rappel)
Critères d'acceptation vérifiés, tests verts sans baisse de couverture, revue APPROVE (3 cycles maximum, puis escalade au PO), contrôle design CONFORME et QA PASS pour US-004, aucun finding CRITICAL/HIGH ouvert, CI verte, merge `--no-ff` dans `main`.

## Revue du sprint
*(à rédiger en fin de sprint : livré / non livré, démonstration au PO)*

## Rétro
*(à rédiger en fin de sprint : ce qui a marché, ce qui a coincé, 1 à 3 actions pour le Sprint 2)*
