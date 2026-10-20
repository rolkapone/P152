# Sprint 1 — Fondations et premier rendu

**Dates** : démarrage le 2026-10-19 (lancement `/sprint 1` par le PO). Premier sprint, aucune rétro précédente.
**Ordre de priorité** : 1. US-001 (débloque tout) ; 2. US-002 (parallélisable, docs seulement) ; 3. US-003 ; 4. SEC-01 (après US-001 T3, parallélisable avec US-003) ; 5. US-004 (conditionnelle, après US-001 et US-003).
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

Le total dépasse la capacité de 1 point : US-001 et US-002 sont déjà largement produites (CI et threat model écrits), leur reste à faire est de la vérification. Si US-001 est retardé par l'installation de Node/pnpm, **US-004 est la première story retirée du sprint** (retour dans le backlog, sans impact sur les autres). US-005 (shell, 5 pts) ouvre le Sprint 2, avec US-006, SEC-02, SEC-03a et SEC-03b.

Vitesse : aucun historique, 15 pts/sprint par défaut. Plan de release : 95 pts MVP, 7 sprints estimés (`docs/backlog.md`).

## Prérequis et décisions du PO

1. **Levé** : Node v24.20.0 et pnpm 10.34.7 installés (le PATH des shells déjà ouverts peut être périmé ; les agents rechargent le PATH machine+user).
2. Git LFS : à vérifier par le devops en US-001 T5 (`git lfs install`).
3. **Conditions avant le premier push (décision PO à prendre, finding LOW du scan US-002)** : les commits contiennent l'e-mail nominatif de l'auteur dans leurs métadonnées, qui sera publié avec le dépôt public. Choisir : (a) le garder ; (b) passer à une adresse noreply GitHub et réécrire l'historique avant le push. À trancher avant tout push (SEC-03a également requis avant).
3bis. **Dépôt GitHub et push : NON pendant ce sprint (décision PO, 2026-10-19, sprint validé).** US-001 T6 et SEC-01 T5/T6 sont **reportées au Sprint 2**. **Écart consigné** : tant que le push n'est pas fait, la « CI verte » de la DoD se vérifie **en local** avec les mêmes commandes que les jobs CI (`pnpm check`, build, E2E, scans disponibles). US-001 T6 et SEC-01 T5/T6 (exécution réelle de la CI, SARIF, PR de test) restent ouvertes jusqu'à l'accord ; si non obtenu avant la fin du sprint, elles sont reportées au Sprint 2 et signalées en revue.
4. **Décisions par défaut confirmées tacitement** : bornes du bureau = catalogue du technical-artist (800–2400 mm). **Révisé le 2026-10-19 (décision secdevops, scan US-001)** : le contrôle `dist/_headers` de `build-hardening` reste **bloquant** (plus d'avertissement) ; SEC-03 est découpée et SEC-03a (génération de `public/_headers`, CSP, 1 pt) est livrée en tête du Sprint 2, avant le premier push.

## Revue du design avant développement (règle CLAUDE.md)

Produits avant le sprint ; à montrer au PO en une fois au lancement :
- Maquettes UI : `docs/design/ui/maquettes/index.html`, design system `docs/design/ui/design-system.md`, tokens `docs/design/ui/tokens.css`.
- DA 3D et aperçu : `docs/design/3d/direction-artistique.md`, `docs/design/3d/apercu/index.html`, catalogue `docs/design/3d/assets-mvp.md` et `assets/catalog/` (10 types, matériaux, styles).
- UX : `docs/design/ux/wireframes-mvp.md` (W2 pour ce sprint), `docs/design/ux/principes.md`.

## Design requis pour US-004 (seule story [UI][3D] du sprint)

Les autres stories n'ont pas d'étape de design. Avant le développement de US-004, à montrer au PO en une fois :
- **ux-designer** : wireframe détaillé de W2 limité à la scène et à la barre flottante de vue (Reset view, Top, Front) ; états (chargement, scène prête, bouton actif, focus clavier, info-bulle, astuce visible / masquée, WebGL indisponible) ; textes en anglais (astuce, libellés, info-bulles) ; parcours clavier et critères UX proposés (le scrum-master les ajoute ensuite à la story).
- **ui-designer** : maquette HTML de la barre de scène (verre 86 % avec repli, `aria-pressed`, tailles de cibles, thèmes clair / sombre, `prefers-reduced-motion`) et de l'astuce, cohérente avec `design-system.md` et `tokens.css` ; la maquette existante `docs/design/ui/maquettes/index.html` est à confirmer ou compléter pour ces états.
- **technical-artist** : assets déjà produits (bureau `desk.json` 140×70, sol, fond studio, éclairage doux, tokens `--scene-*`, aperçu `docs/design/3d/apercu/index.html`) ; à confirmer prêts à l'emploi pour le graphics-engineer, et à compléter seulement si un manque est identifié (ombres de contact, budget triangles).

## Stories et tâches

### US-001 — Setup repo, build et CI [devops] — 3 pts
Branche : `feature/US-001-repo-build-ci` (implémenteur : devops). Démarrée le 2026-10-19.
- [x] T1 (PO) Installer Node 24 + pnpm 10.34.7 (prérequis).
- [x] T2 `pnpm install` ; corriger les erreurs d'installation ; commiter `pnpm-lock.yaml`.
- [x] T3 `pnpm check` (lint, types, tests unitaires, build) vert en local ; corriger les écarts.
- [x] T4 Vérifier `.npmrc` / `pnpm-workspace.yaml` : `onlyBuiltDependencies`, `minimumReleaseAge` (3 jours) ; `sourcemap: false` en production (déjà dans `vite.config.ts`).
- [x] T5 Vérifier `.gitignore` (`.env`, `.env.*`), `.env.example` factice, `.gitattributes` (LFS), `check:assets` vert.
- [ ] T6 **Reportée au Sprint 2** (décision PO : pas de dépôt ni de push ce sprint). Remplacée au Sprint 1 par : exécuter en local les mêmes commandes que les jobs de `ci.yml` (lint, types, tests, build, `check:assets`) et consigner le résultat. Reste pour le Sprint 2 : pousser, vérifier `ci.yml` et `ci-ok`. Résultats : `docs/ci/local-run-US-001.md`.
- [x] T7 Mettre à jour la doc d'installation (README) si nécessaire.
Références : ADR-OPS-01/02/03 dans `docs/architecture.md`.

### US-002 — Threat model initial [secdevops] — 2 pts
Branche : `feature/US-002-threat-model` (docs uniquement). **DONE**, mergée dans `main` (55a93a6).
Démarrée le 2026-10-19, implémenteur : secdevops. Le threat model a été commité directement sur `main` au kickoff (304e3f9) ; la branche portait les mises à jour.
- [x] T1 Threat model et définition des scans produits (`docs/security/`).
- [x] T2 Relecture/MAJ par secdevops selon les décisions PO et le scan US-001 ; cohérence, aucun secret, liens exacts.
- [x] T3 Revue reviewer : APPROVE au cycle 2/3.
- [x] T4 Merge `--no-ff` par le devops. Pas de contrôle design ni QA.

### US-003 — Architecture socle et modèle de données du setup [developer + graphics-engineer] — 3 pts
Branche : `feature/US-003-architecture-socle`. Implémenteur : developer (graphics-engineer si une tâche touche à la scène). Démarrée le 2026-10-20.
**DONE**, mergée dans `main` (10af92a). Revue APPROVE au cycle 3/3 ; secdevops PASS. Tâches T0 à T6 réalisées. Dette tracée dans `docs/backlog.md` (« Dette issue de US-003 »).
- [x] T0 **Avant SEC-03a** : corrections de `docs/architecture.md` demandées par la revue US-002 : CSP de « Sécurité transverse » (~l.608) alignée sur ADR-OPS-06 (`form-action 'none'`, `upgrade-insecure-requests`) ; HSTS ajouté à ADR-OPS-06 ; ADR-OPS-03 : génération des en-têtes par SEC-03a (pas encore faite) ; « Vitest 3 » → « Vitest 4.1 » (~l.853).
- [x] T1 Créer l'ossature `src/core/` (`schema`, `catalog`, `io`) conforme aux règles de dépendance (ADR-APP-07).
- [x] T2 Schéma Zod `SetupV1` (jitless) et types dérivés ; `parseSetup` minimal (taille, JSON, enveloppe, validation stricte).
- [x] T3 Chargement et validation du catalogue `assets/catalog/` par schéma (clés de prototype rejetées, `min ≤ défaut ≤ max`) + tests.
- [x] T4 Tests unitaires du schéma (cas valides, invalides, limites) et fixtures `tests/fixtures/setups/`.
- [x] T5 i18n : mise en place d'i18next, fichier `en` et clé typée (aucun texte en dur).
- [x] T6 Vérifier que `docs/architecture.md` reste à jour (ADR) ; ajouter les ADR manquants.
Références : ADR-3D-02, ADR-APP-03/05/07.

### SEC-01 — Pipeline sécurité en CI [devops + secdevops] — 3 pts
Branche : `feature/SEC-01-pipeline-securite`. **IN PROGRESS** (devops + secdevops). Dépend de US-001 (DONE).
Périmètre du sprint 1 (décision PO : pas de push) : les jobs sont déjà dans `ci.yml` depuis le kickoff (304e3f9) ; il reste la vérification locale. CI distante, SARIF et PR de test sont reportés au Sprint 2.
- [x] T1 (fait au kickoff, 304e3f9) Jobs gitleaks, CodeQL, Semgrep, zizmor, SCA + licences, `build-hardening` dans `ci.yml` ; agrégateur `security` requis par `ci-ok`. Reste : relecture rapide de cohérence.
- [ ] T2 Vérifier que `.gitleaks.toml`, `.semgrep/p152.yml`, `scripts/check-licenses.mjs` sont en place à la racine et identiques aux sources de `docs/security/ci/`.
- [ ] T3 Vérifier l'épinglage SHA / digest des actions et images, `dependabot.yml` et `security-scheduled.yml`.
- [ ] T3a Exécuter en local chaque job (gitleaks, SCA + licences, zizmor, `build-hardening`, Semgrep) avec les mêmes commandes que `ci.yml` ; consigner dans `docs/ci/local-run-SEC-01.md`. Semgrep : Docker est arrêté, démarrer Docker Desktop (demander au PO) ou binaire local ; sinon marquer « non vérifié ». CodeQL : non exécutable en local, consigné comme tel.
- [ ] T3b Bandeau « obsolète » en tête des fichiers de `docs/security/ci/` (revue US-002), avec renvoi vers les fichiers actifs.
- [ ] T3c (optionnel, si le temps le permet) Absorber les findings LOW de SEC-06 sans migration ESLint : `persist-credentials: false`, retrait de `id-token: write`, `skipped` = échec dans l'agrégateur `security`, gitleaks et CodeQL hebdomadaires. Cocher les critères correspondants de SEC-06.
- [ ] T4 `build-hardening` : `dist/_headers` n'existe pas encore (génération livrée par SEC-03a, Sprint 2 en tête). Décision secdevops : le contrôle **reste bloquant** (pas d'avertissement) ; il ne s'exécute réellement qu'au premier push, qui n'aura lieu qu'après SEC-03a. Les autres contrôles (hooks de test, `index.html`, gitleaks `dist`) restent bloquants. Les findings LOW du scan US-001 sont tracés dans SEC-06 (backlog), hors Sprint 1.
- [ ] T5 (aligné) Rejouer en **local** les 4 cas négatifs (faux secret, `innerHTML`, dépendance HIGH, `__p152test` dans `dist`) sur une copie jetable, vérifier l'échec de chaque commande, tout annuler. Cas non faisables consignés. La **PR de test distante est reportée au Sprint 2** (décision PO).
- [ ] T6 **Reportée au Sprint 2** : remontée SARIF dans Code scanning (exige le dépôt distant).
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
Références de design (validation PO en attente) : UX `docs/design/ux/stories/US-004.md` ; maquette `docs/design/ui/maquettes/US-004.html` (section 7 = consignes developer, `design-system.md` §14) ; `assets/catalog/scene/studio.json` ; `docs/design/3d/US-004-scene.md` (transition 480 ms, cible (0 ; 0,72 ; 0), caméra jamais sous Y = 0,9 ni dans le bureau).
Critères UX : les 15 critères UX-1 à UX-15 sont dans `docs/backlog.md` (US-004), à vérifier en T8 (QA/ui-designer) ; ajouts aux tâches : T4/T5 clavier (flèches, +/-, Maj+flèches, 0/1/2, annonces à 600 ms), T6 mémorisation locale de l'astuce, écran WebGL indisponible / contexte perdu.
Décisions UX **VALIDÉES par le PO le 2026-10-19** : astuce masquée définitivement avant US-025 ; raccourcis 0/1/2 pour Reset/Top/Front ; message WebGL indisponible neutre, sans nom d'application.

## Board

| Story | Statut (TODO / IN PROGRESS / IN REVIEW / SECURITY / DONE / BLOCKED) | Cycles de review | Notes |
|---|---|---|---|
| US-001 | DONE | 2 / 3 | Mergée dans `main` (merge `--no-ff` dfdfcfe). Revue APPROVE au cycle 2 (`docs/reviews/US-001.md` ; cycle 1 bloqué sur l'audit tinypool/vitest, corrigé par Vitest 4.1.12). Secdevops PASS (`docs/security/scans/US-001.md`). Checks locaux verts ; CI distante (T6) reportée au Sprint 2 (décision PO). |
| US-002 | DONE | 2 / 3 | Mergée dans `main` (55a93a6). Revue APPROVE au cycle 2 (cycle 1 : critères SEC-10 à SEC-50 perdus, remis dans le backlog). Secdevops PASS (`docs/security/scans/US-002.md`, `.gitleaksignore` pour un faux positif). Finding LOW : e-mail nominatif dans les commits, décision PO avant push. |
| US-003 | DONE | 3 / 3 | Mergée dans `main` (10af92a). Revue APPROVE au cycle 3 (`docs/reviews/US-003.md` ; cycles 1 et 2 : frontières de couches du lint). Secdevops PASS (`docs/security/scans/US-003.md`, findings LOW). Dette tracée dans le backlog. |
| SEC-01 | IN PROGRESS | 0 / 3 | Branche `feature/SEC-01-pipeline-securite`, devops + secdevops. Jobs déjà dans `ci.yml` (304e3f9) ; reste vérification locale, Semgrep (Docker arrêté), bandeau « obsolète », 4 cas négatifs en local. T5 (PR de test) et T6 (SARIF) reportés au Sprint 2 (décision PO). `dist/_headers` absent = erreur bloquante maintenue : SEC-03a avant le premier push. |
| US-004 | TODO | 0 / 3 | Graphics-engineer (+ developer pour la barre). Conditionnelle (capacité). Design requis d'abord (voir section). Dépend de US-001 et US-003. |

## Risques

| # | Risque | Probabilité / impact | Parade |
|---|---|---|---|
| R1 | ~~Node/pnpm absents~~ levé ; risque résiduel : PATH périmé dans des shells ouverts | Faible / Faible | Les agents rechargent le PATH machine+user |
| R2 | Première exécution de `pnpm install` / `pnpm check` : écarts d'outillage (versions ESLint 9.39, TS 5.9, Vite 7, Vitest 4.1 jamais testées ensemble) | Moyenne / Moyen | Time-box d'une journée en T2/T3 ; ajuster les versions par ADR. **Matérialisé en partie** : audit tinypool/vitest en revue US-001, corrigé par Vitest 4.1.12 ; ESLint 9 déprécié tracé en SEC-06 |
| R3 | Dépôt GitHub non autorisé : CI distante et CodeQL non vérifiables, SEC-01 partiellement validable | Élevée / Moyen | Vérification locale (mêmes commandes que la CI) ; demander l'accord du PO pendant le sprint ; sinon reporter US-001 T6 et SEC-01 T5/T6 au Sprint 2 |
| R4 | `build-hardening` rouge faute de `dist/_headers` | Élevée / Faible | SEC-03a avant le premier push (le job échoue sans `dist/_headers`) ; contrôle maintenu bloquant, pas d'avertissement (décision secdevops) |
| R5 | Sprint à 16 pts (capacité 15) | Moyenne / Faible | US-004 retirée en premier si retard |
| R6 | Performances WebGL sur la machine du PO non connues (≥ 60 FPS sur milieu de gamme) | Faible / Moyen | Mesure dès T7 de US-004 ; paliers de qualité ADR-3D-08 |
| R7 | Les 5 pts de US-005 (shell + Inter + verre) sont chargés pour le Sprint 2 ; US-004 en livre déjà une partie (barre de scène) | Moyenne / Faible | Coordonner le périmètre de la barre entre US-004 et US-005 |
| R8 | Override `rollup: 4.64.7` dans `pnpm-workspace.yaml` (rollup 4.64.8+ trop récent pour `minimumReleaseAge`) | Certaine / Faible | Retirer l'override quand la version a plus de 3 jours (dès le 2026-10-23), puis `pnpm install` et `pnpm check` (devops) |

## Définition de terminé (rappel)
Critères d'acceptation vérifiés, tests verts sans baisse de couverture, revue APPROVE (3 cycles maximum, puis escalade au PO), contrôle design CONFORME et QA PASS pour US-004, aucun finding CRITICAL/HIGH ouvert, CI verte, merge `--no-ff` dans `main`.

## Revue du sprint
*(à rédiger en fin de sprint : livré / non livré, démonstration au PO)*

## Rétro
*(à rédiger en fin de sprint : ce qui a marché, ce qui a coincé, 1 à 3 actions pour le Sprint 2)*

Notes en cours :
- **US-003 a atteint la limite de 3 cycles de review** (cycles 1 et 2 sur les frontières de couches du lint, cycle 3 APPROVE). Point à creuser en rétro : définir les règles de lint des frontières avant le code, ou les faire relire plus tôt par le reviewer.
- US-001 et US-002 ont chacune pris 2 cycles.
