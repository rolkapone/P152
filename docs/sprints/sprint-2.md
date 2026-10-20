# Sprint 2 — Sécuriser le dépôt, shell de l'application et choix du bureau

**Dates** : démarrage le 2026-10-20 (lancement `/sprint 2` par le PO).
**Objectif du sprint** : rendre le dépôt publiable (en-têtes, CSP et correctif React Aria, puis premier push avec l'accord du PO) et livrer le shell de l'application en anglais avec le choix d'un bureau dans un catalogue.

## Capacité et engagement

Vitesse de référence : 16 pts (Sprint 1) ; capacité prudente 15 pts. Contenu accepté par le PO (décision 28).

| Ordre | Story | Tags | Priorité | Points | Remarque |
|---|---|---|---|---|---|
| 1 | SEC-03a En-têtes de sécurité, CSP, correctif React Aria | | Must | 2 | en tête : conditionne le premier push |
| 2 | US-005 Shell de l'application en anglais | [UI] | Must | 5 | design d'abord ; inclut texte `failed`, maquette §9/§14, budget de taille |
| 3 | US-006 Choisir un bureau dans un catalogue | [UI][3D] | Must | 5 | dépend de US-005 ; design + technical-artist (catalogue) |
| 4 | SEC-02 Durcissement du dépôt GitHub public | | Must | 1 | suppose le push ; le PO réalise ou valide chaque réglage |
| **Total engagé** | | | | **13** | |
| Marge | SEC-06 (dette de test) ou SEC-03b | | | 2 | prise seulement si de la place ; sinon reportée |

Ombre de contact (décision 26) : technical-artist ; rattachée à US-008 (Sprint 3) ; traitée dans la marge de ce sprint **seulement si c'est trivial** (réglage de `assets/catalog/scene/studio.json`, aperçu au PO). Sinon reste au Sprint 3.
Reports du Sprint 1 : US-001 T6 (CI distante), SEC-01 T5/T6 (PR de test, SARIF) : après le push, 0 pt, tâches du devops/secdevops.

## Conditions et décisions du PO applicables

- **Premier push** : seulement (1) SEC-03a mergée, (2) MFA du PO activée, (3) réglages du dépôt (SEC-02) validés par le PO, (4) **accord explicite du PO à ce moment-là**. Historique déjà réécrit avec l'adresse noreply GitHub (règle permanente : jamais l'e-mail pro). Le remote `origin` = https://github.com/rolkapone/P152.git (public, vide) est ajouté ; **rien n'est poussé**. Aucun agent ne pousse sans cet accord.
- Docker tourne : Semgrep exécutable ce sprint.
- Texte neutre de l'état `failed` accepté (décision 27) ; ombre de contact à alléger (26).
- **SHA périmés** : l'historique ayant été réécrit, tous les SHA cités dans les docs (sprint-1, backlog, `docs/reviews/`, `docs/security/scans/`, `docs/ci/`) sont périmés ; la source de vérité est `git log --merges --oneline main`.

## Les 5 actions de la rétro du Sprint 1, appliquées

| # | Action | Consigne concrète pour ce sprint | Responsable |
|---|---|---|---|
| 1 | Aucun test dépendant du temps réel | Ni `waitForTimeout` ni délai réel : `page.clock` ou attente d'un état observable (signal « scène prête »). Le reviewer vérifie la règle à chaque revue. Critère de sortie de toute story qui ajoute des tests E2E (US-005, US-006, SEC-03a) : **10 exécutions consécutives de `pnpm test:e2e` sous charge CPU, 0 échec**, consignées dans le rapport QA. Même critère pour les tests unitaires ajoutés (fuzz : graine fixe). | developer, qa-tester, reviewer |
| 2 | CSP de production dès SEC-03a | `preview` et `dist-e2e` servent les en-têtes générés par `config/security-headers.mjs`. Tous les E2E échouent sur `securitypolicyviolation` ou erreur console CSP. Aucun `'unsafe-inline'`. US-005 (polices Inter, verre) et US-006 sont donc testées sous CSP stricte. | devops, secdevops |
| 3 | Règles de lint relues avant le code | Première tâche de US-005 : écrire les règles (`boundaries`, `i18next`/ternaire-logique-concaténation) et leur test dans `tests/unit/lint-rules.test.ts`, les **commiter seules** ; le reviewer les relit avant tout code applicatif (revue courte, hors décompte des 3 cycles de la story si possible, à confirmer par l'orchestrateur). Même principe pour le seuil de couverture de `src/state` (US-005/US-006). Dette de lint `from ".."` de `core` corrigée dans cette tâche. | developer, reviewer |
| 4 | Environnement | Orchestrateur : Docker Desktop vérifié démarré avant SEC-03a (Semgrep) ; chaque agent recharge le PATH machine+user au démarrage (Node 24, pnpm 10.34.7). | orchestrateur |
| 5 | Tâches courtes | Chaque tâche ci-dessous = un commit (Conventional Commits) ; un agent ne reçoit qu'une ou deux tâches à la fois ; en cas d'interruption, reprise depuis le dernier commit. | orchestrateur, scrum-master |

## Design requis avant le développement (à montrer au PO en une fois)

Pour US-005 et US-006 ; SEC-03a et SEC-02 n'en ont pas.

- **ux-designer** (US-005, puis US-006), à produire d'abord :
  - US-005 : wireframe détaillé de W2 (panneaux flottants gauche/droite repliables, top bar, astuce en pied), W11 (états vide, chargement, erreur) ; **texte neutre de l'état `failed`** (titre, message, action "Try again", différent de WebGL indisponible) ; ordre de tabulation et liens "Skip to 3D view" / "Skip to alerts" ; textes anglais ; critères UX testables à ajouter à la story.
  - US-006 : W3 affiné (onglet "Desk", cartes avec dimensions cm/mm, carte active contour 2 px + coche, annonce du choix, état sans bureau d'angle si non produit, modale "Choose your desk" seulement si US-020 livrée : hors sprint) ; question des bornes du bureau (question 1 du backlog : bornes catalogue 800–2400 mm appliquées par défaut, textes UX à corriger).
- **ui-designer**, après l'ux-designer : maquettes HTML de US-005 (shell complet : verre 86 % avec repli, thèmes clair/sombre, reduced-motion, Inter auto-hébergée, icônes Lucide) ; mise à jour de `docs/design/ui/maquettes/US-004.html` et de `design-system.md` §9 et §14 (info-bulle immédiate au focus clavier) ; maquette du panneau Desk (cartes, états normal/survol/actif/focus) de US-006.
- **technical-artist** (US-006 [3D]) : catalogue de bureaux d'au moins 5 modèles (120×60, 140×70, 160×80, 180×80 cm, **bureau d'angle `desk.corner` à produire**), presets dans `assets/catalog/object-types/desk.json`, plateau et pieds lisibles, hauteur 720-750 mm, budget de triangles, aperçu pour le PO ; **ombre de contact allégée** (proposition chiffrée sur `studio.json`, aperçu avant/après) ; aucun asset externe (procédural), sinon licence consignée.

Après validation du PO, le scrum-master ajoute les critères UX aux stories dans le backlog. **Le développement de US-005 et US-006 ne commence qu'après cette validation** ; SEC-03a démarre immédiatement (pas de dépendance au design).

## Stories et tâches

### 1. SEC-03a — En-têtes de sécurité, CSP, correctif React Aria [devops + secdevops + developer] — 2 pts
Branche : `feature/SEC-03a-headers-csp`. Démarre en premier, en parallèle du design.
- [ ] T1 (devops) Script de build qui génère `public/_headers` depuis `config/security-headers.mjs` ; `dist/_headers` présent après build (CSP stricte, `nosniff`, Referrer-Policy, Permissions-Policy, COOP, HSTS).
- [ ] T2 (devops) Test unitaire : contenu de `dist/_headers` = sortie de `config/security-headers.mjs` ; contrôle `dist/_headers` de `sec-build-hardening` vert, sans avertissement toléré.
- [ ] T3 (devops) `preview` et `dist-e2e` servent ces en-têtes (action 2).
- [ ] T4 (developer) Correctif React Aria : `<link rel="stylesheet" id="react-aria-pressable-style" href="/react-aria-pressable.css">` dans `index.html`, `public/react-aria-pressable.css`, jamais `'unsafe-inline'`.
- [ ] T5 (qa-tester / developer) Test E2E sous CSP de production : échec sur `securitypolicyviolation` et erreur console CSP ; aucun `<style>` injecté par React Aria ; 10 runs consécutifs sous charge (action 1).
- [ ] T6 (secdevops) Scan (dont Semgrep via Docker), clôture du finding MEDIUM du scan US-004.
- [ ] T7 (devops) Retirer l'override `rollup: 4.64.7` si possible (R8, dès le 2026-10-23), sinon le noter.
Cycle : revue, secdevops, merge `--no-ff`. Pas de contrôle design ; QA seulement pour le E2E CSP.

### 2. US-005 — Shell de l'application en anglais [UI] [developer] — 5 pts
Branche : `feature/US-005-shell-app`. Après design validé. Implémenteur : developer.
- [ ] T0 (developer, reviewer) **Règles avant code (action 3)** : règles `boundaries` et `i18next` (texte en dur dans ternaire, `&&`/`||`/`??`, concaténation) + tests dans `tests/unit/lint-rules.test.ts` ; correction de `from ".."` dans `core` ; commit isolé, relu par le reviewer avant la suite.
- [ ] T1 Tokens générés depuis `docs/design/ui/tokens.css`, thèmes clair/sombre (suit `prefers-color-scheme`), `lang="en"`, i18n complet.
- [ ] T2 Inter auto-hébergée (`public/fonts/inter-latin-wght-normal.woff2`, `font-display: swap`, précharge, `OFL.txt`, licence consignée dans `docs/design/3d/licences-assets.md` / `THIRD_PARTY_LICENSES`) ; icônes Lucide (licence ISC).
- [ ] T3 Mise en page W2 : top bar (mot-symbole), panneau gauche (onglets Desk / Objects), panneau droit (Properties, Alerts), astuce en pied ; panneaux repliables ; verre 86 % + repli opaque (`.no-glass`, `prefers-reduced-transparency`, sans `backdrop-filter`).
- [ ] T4 Ordre de tabulation, liens "Skip to 3D view" / "Skip to alerts", focus visible, reflow 200 %, valide dès 1366×768, `prefers-reduced-motion`.
- [ ] T5 États vide / chargement / erreur (W11), dont **texte neutre de `failed`** (i18n, test du texte et de `role="alert"`).
- [ ] T6 Premier module `src/state` : seuil de couverture de `src/state` dans la config Vitest (dette US-003).
- [ ] T7 Budget de taille vérifié par `check:bundle` (seuil proposé par developer + graphics-engineer, validé par le PO ; chunk 3D en `lazy()`).
- [ ] T8 (ui-designer) Mise à jour de la maquette US-004 et du design-system §9/§14 (info-bulle immédiate au focus clavier).
- [ ] T9 Tests unitaires, E2E sous CSP de production, 10 runs sous charge ; contrôle design ; QA ; secdevops.

### 3. US-006 — Choisir un bureau dans un catalogue [UI][3D] [graphics-engineer puis developer] — 5 pts
Branche : `feature/US-006-choix-bureau`. Après design et assets validés, et après le merge de US-005 (ou sur sa base). Même branche, deux implémenteurs.
- [ ] T1 (technical-artist) Catalogue de bureaux (≥ 5, dont `desk.corner`), validé par le schéma de catalogue (bornes `min ≤ défaut ≤ max`).
- [ ] T2 (graphics-engineer) Génération du bureau depuis le preset choisi (plateau + pieds, échelle 1 m = 1 unité, hauteur 720-750 mm), remplacement du bureau dans la scène, objets conservés ; tessellation bornée.
- [ ] T3 (graphics-engineer) Test : bornes du bureau et boîte englobante = dimensions du preset (tolérance 1 mm) ; le cadrage caméra reste valide pour chaque bureau.
- [ ] T4 (developer) État du bureau choisi dans `src/state` (couverture), sérialisation au schéma `SetupV1`, bureau par défaut 140×70.
- [ ] T5 (developer) Onglet "Desk" (cartes, carte active contour + coche, clic = application immédiate, annonce `aria-live`) ; recalcul des alertes branché sur le changement (point d'appel seulement, les règles arrivent avec US-014 à US-016).
- [ ] T6 Tests unitaires et E2E (sélection clavier/souris, annonce), 10 runs sous charge ; contrôle design ; QA (FPS 1366×768, captures) ; secdevops.
- Hors sprint : modale "Choose your desk" au premier lancement (US-020).

### 4. SEC-02 — Durcissement du dépôt GitHub public [devops] — 1 pt
Branche : `feature/SEC-02-durcissement-depot` (fichiers du dépôt : `SECURITY.md`, `CODEOWNERS`). Les réglages du compte/dépôt GitHub sont appliqués **uniquement avec l'accord explicite du PO**, qui réalise ou valide chaque action.
- [ ] T1 (devops) `SECURITY.md`, `CODEOWNERS` (`.github/`, `config/security-headers.mjs`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, `.gitleaks.toml`, `.semgrep/`) ; prêts avant le push.
- [ ] T2 (PO) MFA activée sur le compte.
- [ ] T3 (devops + PO) Liste pas à pas des réglages (ruleset `main`, `ci-ok` requis, Code scanning ≥ High bloquant, secret scanning + push protection, Dependabot alerts, private vulnerability reporting, `GITHUB_TOKEN` en lecture seule, approbation des workflows externes, épinglage SHA) ; le PO les applique ou les valide.
- [ ] T4 (devops) **Premier push, après accord explicite du PO** (SEC-03a mergée, MFA faite, réglages validés) ; vérification que `ci.yml` et `ci-ok` passent.
- [ ] T5 (devops, secdevops) Reports Sprint 1 : US-001 T6, SEC-01 T5 (PR de test distante, 4 cas) et T6 (SARIF dans Code scanning) ; consignés dans `docs/ci/`.

### Marge (2 pts, non engagés)
Par ordre : (a) SEC-06 dette de test (parseSetup.fuzz instable, `waitForTimeout` restants de `scene.spec.ts`, `open()` de `scene-ui.spec.ts`, 10 runs sous charge) ; (b) ombre de contact si triviale ; (c) SEC-03b, seulement si SEC-02 est terminée (pas de déploiement prévu). Aucune n'est prise avant que SEC-03a, US-005 et US-006 soient en revue.

## Moment du premier push

1. SEC-03a mergée dans `main` (build-hardening local vert, scan secdevops PASS).
2. SEC-02 T1 prête, MFA du PO faite, réglages validés par le PO.
3. Le scrum-master signale ces conditions à l'orchestrateur ; **l'orchestrateur demande l'accord explicite du PO à ce moment-là** ; le devops pousse `main` seulement ensuite. Vérification préalable : aucun commit ne contient l'ancienne adresse, `git log` en noreply.
Le push est prévu en cours de sprint (pas à la fin) afin que la CI distante tourne sur US-005 et US-006.

## Board

| Story | Statut (TODO / IN PROGRESS / IN REVIEW / SECURITY / DONE / BLOCKED) | Cycles de review | Notes |
|---|---|---|---|
| SEC-03a | TODO | 0 / 3 | Démarre en premier ; conditionne le push |
| US-005 | TODO | 0 / 3 | Attend le design validé par le PO ; T0 règles de lint relues avant le code |
| US-006 | TODO | 0 / 3 | Attend design et catalogue de bureaux ; dépend de US-005 |
| SEC-02 | TODO | 0 / 3 | Réglages avec le PO ; suppose le push |

## Risques

| # | Risque | Probabilité / impact | Parade |
|---|---|---|---|
| R1 | Push différé (MFA, réglages) : CI distante, SARIF et SEC-02 T4/T5 bloqués | Moyenne / Moyen | SEC-02 T1 prête tôt ; demander au PO la MFA dès le début du sprint ; sinon SEC-02 glisse au Sprint 3 (1 pt) |
| R2 | CSP stricte casse un comportement (Inter, verre, R3F, React Aria) | Moyenne / Moyen | Preview/E2E sous CSP dès SEC-03a (action 2) |
| R3 | US-005 déborde (shell + Inter + verre + lint + budget = 5 pts chargés) | Moyenne / Moyen | T0 courte et isolée ; US-006 peut démarrer sa partie 3D (T1 à T3) en parallèle ; la marge sert de tampon |
| R4 | Bureau d'angle : géométrie, empreinte et alertes futures (footprint non rectangulaire) | Moyenne / Moyen | Technical-artist précise la forme d'empreinte ; sinon livrer 5 bureaux rectangulaires et reporter l'angle (décision PO) |
| R5 | Bornes du bureau (question 1) divergentes entre UX et catalogue | Faible / Faible | Bornes du catalogue appliquées par défaut ; textes UX corrigés |
| R6 | Cycles de review (US-003 en a eu 3) | Moyenne / Moyen | Action 3 ; revue des règles avant le code |
| R7 | Interruptions par limites d'usage | Moyenne / Faible | Action 5 : commits par tâche |
| R8 | Override `rollup: 4.64.7` | Certaine / Faible | Retrait à partir du 2026-10-23 (SEC-03a T7) |
| R9 | Mesure FPS limitée à un GPU haut de gamme, pas de Firefox | Moyenne / Faible | Réserve maintenue, traitée par US-021/US-022 |

## Questions pour le PO

1. **Bornes du bureau** (question 1 du backlog, avant US-006) : valider les bornes du catalogue (largeur 800–2400, profondeur 500–1000, hauteur 600–1300 mm) ? Défaut appliqué sans réponse.
2. **Bureau d'angle** : si sa géométrie ou son empreinte non rectangulaire pèse trop, accepter 5 bureaux rectangulaires et reporter l'angle ?
3. **Budget de taille du shell** : valider le seuil proposé par le developer et le graphics-engineer (mesures actuelles : 153,8 Ko gz principal, 266 Ko gz chunk 3D).
4. **Premier push** : l'accord sera demandé quand SEC-03a sera mergée et la MFA faite ; le PO peut déjà confirmer la date de la MFA.

## Revue du sprint
(à rédiger en fin de sprint)

## Rétro
(à rédiger en fin de sprint)
