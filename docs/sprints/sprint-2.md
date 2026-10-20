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

Ombre de contact (décisions 26 et 31) : **rattachée à US-006** (plus à la marge ni à US-008) : opacité 0,24, empreinte = bureau − 200×140 mm dérivée du bureau choisi ; le keep-out de la caméra est aussi dérivé du bureau (graphics-engineer). Pas de point supplémentaire (inclus dans les 5 pts ; à réestimer si le bureau en L pèse).
Reports du Sprint 1 : US-001 T6 (CI distante), SEC-01 T5/T6 (PR de test, SARIF) : après le push, 0 pt, tâches du devops/secdevops.

## Conditions et décisions du PO applicables

- **Premier push** : seulement (1) SEC-03a mergée, (2) MFA du PO activée, (3) réglages du dépôt (SEC-02) validés par le PO, (4) **accord explicite du PO à ce moment-là**. Historique déjà réécrit avec l'adresse noreply GitHub (règle permanente : jamais l'e-mail pro). Le remote `origin` = https://github.com/rolkapone/P152.git (public, vide) est ajouté ; **rien n'est poussé**. Aucun agent ne pousse sans cet accord.
- Docker tourne : Semgrep exécutable ce sprint.
- Texte neutre de l'état `failed` accepté (décision 27) ; ombre de contact à alléger (26).
- **SHA périmés** : l'historique ayant été réécrit, tous les SHA cités dans les docs (sprint-1, backlog, `docs/reviews/`, `docs/security/scans/`, `docs/ci/`) sont périmés ; la source de vérité est `git log --merges --oneline main`.

## Les 5 actions de la rétro du Sprint 1, appliquées

| # | Action | Consigne concrète pour ce sprint | Responsable |
|---|---|---|---|
| 1 | Aucun test dépendant du temps réel | Ni `waitForTimeout` ni délai réel : `page.clock` ou attente d'un état observable (signal « scène prête »). Le reviewer vérifie la règle à chaque revue. Critère de sortie de toute story qui ajoute des tests E2E (**US-005, US-006**) : règle **reformulée le 2026-10-20** (décision technique de l'orchestrateur, sur recommandation du reviewer ; la règle d'origine « 10 runs sous charge CPU » était mal posée : une charge sans limite la rend impossible à tenir par construction). Définition de `docs/reviews/SEC-03a.md`, consignée dans le rapport QA : (1) **référence CI** : 10 runs `CI=1 pnpm test:e2e` dans l'image Playwright épinglée limitée à `--cpus=4 --memory=8g`, 0 échec ; (2) **stress local informatif** : charge à 50 % des threads logiques, 4 workers, 10 runs, 0 échec dû à une assertion ou à une attente de test ; (3) **contrôle de conception** : `--repeat-each=10` vert sans charge et aucun `waitForTimeout` dans `tests/e2e`. Reportée dans SEC-06 et US-022 (backlog). Pour les tests unitaires ajoutés : graine fixe (fuzz). | developer, qa-tester, reviewer |
| 2 | CSP de production dès SEC-03a | `preview` et `dist-e2e` servent les en-têtes générés par `config/security-headers.mjs`. Tous les E2E échouent sur `securitypolicyviolation` ou erreur console CSP. Aucun `'unsafe-inline'`. US-005 (polices Inter, verre) et US-006 sont donc testées sous CSP stricte. | devops, secdevops |
| 3 | Règles de lint relues avant le code | Première tâche de US-005 : écrire les règles (`boundaries`, `i18next`/ternaire-logique-concaténation) et leur test dans `tests/unit/lint-rules.test.ts`, les **commiter seules** ; le reviewer les relit avant tout code applicatif (revue courte, hors décompte des 3 cycles de la story si possible, à confirmer par l'orchestrateur). Même principe pour le seuil de couverture de `src/state` (US-005/US-006). Dette de lint `from ".."` de `core` corrigée dans cette tâche. | developer, reviewer |
| 4 | Environnement | Orchestrateur : Docker Desktop vérifié démarré avant SEC-03a (Semgrep) ; chaque agent recharge le PATH machine+user au démarrage (Node 24, pnpm 10.34.7). | orchestrateur |
| 5 | Tâches courtes | Chaque tâche ci-dessous = un commit (Conventional Commits) ; un agent ne reçoit qu'une ou deux tâches à la fois ; en cas d'interruption, reprise depuis le dernier commit. | orchestrateur, scrum-master |

## Décisions du PO sur le design (validées le 2026-10-20)

Design US-005 et US-006 **validé par le PO**, toutes décisions confirmées (backlog, décisions 29 à 31) :
- Undo/Redo masqués jusqu'à US-019 ; verdict vide « Nothing to check yet » ; onglet Objects visible avec état vide ; nom affiché « Deskfit ».
- Textes US-005 : `failed` neutre avec « Reload page » au 2e échec ; `tooManyObjects` reformulé ; `tooLarge` gardé en « 1 MB » (rattachés à US-018).
- Catalogue de 7 bureaux (5 rectangulaires 100×60, 120×60, 140×70, 160×80, 180×80 ; 2 d'angle 160×140 et 180×160), angle orienté à droite ce sprint et sans « Custom size » ; flèches du clavier appliquent directement le bureau ; vignettes SVG dessinées par l'UI.
- Bornes : rectangulaire 800–2400 × 500–1000 × 600–1300 mm ; angle 1200–2400 × 1000–2000 mm.
- Ombre de contact allégée (0,24 ; bureau − 200×140 mm), dérivée du bureau, ainsi que le keep-out de la caméra → US-006.

Rattachements : les données du catalogue (`desk.json` v2, `desk-corner.json`) sont commitées sur `feature/US-006-choix-bureau` (cd27e44) et font échouer le test « a catalog without any desk » de `validate.test.ts` : **le developer le corrige dans US-006**. Le générateur du bureau en L revient au graphics-engineer dans US-006.

Références : UX `docs/design/ux/stories/US-005.md` et `US-006.md` ; maquettes `docs/design/ui/maquettes/US-005.html` et `US-006.html`, `design-system.md` §15 (shell) et §16 (bureaux) ; aperçu 3D `docs/design/3d/apercu-bureaux/` et `docs/design/3d/US-006-bureaux.md`. Les critères UX (US-005 UX-1 à UX-22 ; US-006 UX-1 à UX-17) sont dans le backlog ; UX-23 de US-005 est rattaché à US-018. Le développement peut commencer.

## Design requis avant le développement (réalisé, voir ci-dessus)

Pour US-005 et US-006 ; SEC-03a et SEC-02 n'en ont pas.

- **ux-designer** (US-005, puis US-006), à produire d'abord :
  - US-005 : wireframe détaillé de W2 (panneaux flottants gauche/droite repliables, top bar, astuce en pied), W11 (états vide, chargement, erreur) ; **texte neutre de l'état `failed`** (titre, message, action "Try again", différent de WebGL indisponible) ; ordre de tabulation et liens "Skip to 3D view" / "Skip to alerts" ; textes anglais ; critères UX testables à ajouter à la story.
  - US-006 : W3 affiné (onglet "Desk", cartes avec dimensions cm/mm, carte active contour 2 px + coche, annonce du choix, état sans bureau d'angle si non produit, modale "Choose your desk" seulement si US-020 livrée : hors sprint) ; question des bornes du bureau (question 1 du backlog : bornes catalogue 800–2400 mm appliquées par défaut, textes UX à corriger).
- **ui-designer**, après l'ux-designer : maquettes HTML de US-005 (shell complet : verre 86 % avec repli, thèmes clair/sombre, reduced-motion, Inter auto-hébergée, icônes Lucide) ; mise à jour de `docs/design/ui/maquettes/US-004.html` et de `design-system.md` §9 et §14 (info-bulle immédiate au focus clavier) ; maquette du panneau Desk (cartes, états normal/survol/actif/focus) de US-006.
- **technical-artist** (US-006 [3D]) : catalogue de bureaux d'au moins 5 modèles (120×60, 140×70, 160×80, 180×80 cm, **bureau d'angle `desk.corner` à produire**), presets dans `assets/catalog/object-types/desk.json`, plateau et pieds lisibles, hauteur 720-750 mm, budget de triangles, aperçu pour le PO ; **ombre de contact allégée** (proposition chiffrée sur `studio.json`, aperçu avant/après) ; aucun asset externe (procédural), sinon licence consignée.

Critères UX ajoutés aux stories dans le backlog le 2026-10-20. Le développement de US-005 et US-006 est autorisé ; SEC-03a est en cours (pas de dépendance au design).

## Stories et tâches

### 1. SEC-03a — En-têtes de sécurité, CSP, correctif React Aria [devops + secdevops + developer] — 2 pts
Branche : `feature/SEC-03a-headers-csp`. **DONE** : mergée dans `main` (42c15cd), revue APPROVE au cycle 1/3 (`docs/reviews/SEC-03a.md`), secdevops PASS (`docs/security/scans/SEC-03a.md`, Semgrep via Docker, 0 ERROR, finding MEDIUM de US-004 clos). Critères d'acceptation 1 à 4 cochés dans le backlog.
- [x] T1 (devops) Script de build qui génère `public/_headers` depuis `config/security-headers.mjs` ; `dist/_headers` présent après build (CSP stricte, `nosniff`, Referrer-Policy, Permissions-Policy, COOP, HSTS).
- [x] T2 (devops) Test unitaire : contenu de `dist/_headers` = sortie de `config/security-headers.mjs` ; contrôle `dist/_headers` de `sec-build-hardening` vert, sans avertissement toléré.
- [x] T3 (devops) `preview` et `dist-e2e` servent ces en-têtes (action 2).
- [x] T4 (developer) Correctif React Aria : `<link rel="stylesheet" id="react-aria-pressable-style" href="/react-aria-pressable.css">` dans `index.html`, `public/react-aria-pressable.css`, jamais `'unsafe-inline'`.
- [x] T5 (qa-tester / developer) Test E2E sous CSP de production : échec sur `securitypolicyviolation` et erreur console CSP ; aucun `<style>` injecté par React Aria. Runs sous charge : règle reformulée et reportée (SEC-06 / US-022).
- [x] T6 (secdevops) Scan (dont Semgrep via Docker), clôture du finding MEDIUM du scan US-004.
- [ ] T7 (devops) Retirer l'override `rollup: 4.64.7` si possible (R8, dès le 2026-10-23), sinon le noter. *(non fait : reste ouverte, voir R8)*
Findings LOW et suggestions : reportés dans SEC-06 ; CORP `same-origin` et règle `/index.html` : SEC-03b.

### 2. US-005 — Shell de l'application en anglais [UI] [developer] — 5 pts
Branche : `feature/US-005-shell-app`. Après design validé. Implémenteur : developer.
- [ ] T0 (developer, reviewer) **Règles avant code (action 3)** : règles `boundaries` et `i18next` (texte en dur dans ternaire, `&&`/`||`/`??`, concaténation) + tests dans `tests/unit/lint-rules.test.ts` ; correction de `from ".."` dans `core` ; commit isolé, relu par le reviewer avant la suite.
- [ ] T1 Tokens générés depuis `docs/design/ui/tokens.css`, thèmes clair/sombre (suit `prefers-color-scheme`), `lang="en"`, i18n complet.
- [ ] T2 Inter auto-hébergée (`public/fonts/inter-latin-wght-normal.woff2`, `font-display: swap`, précharge, `OFL.txt`, licence consignée dans `docs/design/3d/licences-assets.md` / `THIRD_PARTY_LICENSES`) ; icônes Lucide (licence ISC).
- [ ] T3 Mise en page W2 : top bar (mot-symbole « Deskfit », nom du setup, verdict « Nothing to check yet » ; **sans Undo/Redo, File, Help ni « Saved »**), panneau gauche (onglets Desk / Objects, Objects en état vide), panneau droit (Properties, Alerts), astuce en pied ; panneaux repliables ; verre 86 % + repli opaque (`.no-glass`, `prefers-reduced-transparency`, sans `backdrop-filter`).
- [ ] T4 Ordre de tabulation, liens "Skip to 3D view" / "Skip to alerts", focus visible, reflow 200 %, valide dès 1366×768, `prefers-reduced-motion`.
- [ ] T5 États vide / chargement / erreur (W11), dont **texte neutre de `failed`** (i18n, test du texte et de `role="alert"`), « Reload page » au 2e échec seulement, `SceneError` à 3 `kind`. Messages d'import `errors.json` : rattachés à US-018.
- [ ] T6 Premier module `src/state` : seuil de couverture de `src/state` dans la config Vitest (dette US-003).
- [ ] T7 Budget de taille vérifié par `check:bundle` (seuil proposé par developer + graphics-engineer, validé par le PO ; chunk 3D en `lazy()`).
- [ ] T8 (ui-designer) Mise à jour de la maquette US-004 et du design-system §9/§14 (info-bulle immédiate au focus clavier).
- [ ] T9 Tests unitaires, E2E sous CSP de production, 10 runs sous charge ; contrôle design ; QA ; secdevops.

### 3. US-006 — Choisir un bureau dans un catalogue [UI][3D] [graphics-engineer puis developer] — 5 pts
Branche : `feature/US-006-choix-bureau`. Après design et assets validés, et après le merge de US-005 (ou sur sa base). Même branche, deux implémenteurs.
- [x] T1 (technical-artist) Catalogue de 7 bureaux (5 rectangulaires, 2 d'angle) : **fait**, commité sur la branche (cd27e44), schéma de catalogue (`min ≤ défaut ≤ max`). Bornes rect 800–2400 × 500–1000 × 600–1300, angle 1200–2400 × 1000–2000.
- [ ] T1b (developer) Corriger le test « a catalog without any desk » de `validate.test.ts` (échoue avec les nouvelles données), premier commit du developer.
- [ ] T2 (graphics-engineer) Génération du bureau depuis le preset choisi (plateau + pieds, échelle 1 m = 1 unité, hauteur 720-750 mm), **générateur du bureau en L** (orienté à droite), remplacement du bureau dans la scène, objets conservés ; tessellation bornée.
- [ ] T2b (graphics-engineer) **Ombre de contact allégée** (opacité 0,24, empreinte = bureau − 200×140 mm) et **keep-out de la caméra** dérivés du bureau choisi.
- [ ] T3 (graphics-engineer) Test : bornes du bureau et boîte englobante = dimensions du preset (tolérance 1 mm) ; le cadrage caméra (zone libre, marge ≥ 24 px) reste valide pour chaque bureau, dont l'angle.
- [ ] T4 (developer) État du bureau choisi dans `src/state` (couverture), sérialisation au schéma `SetupV1`, bureau par défaut 140×70.
- [ ] T5 (developer) Onglet "Desk" (7 lignes, vignettes SVG dessinées à l'échelle commune, ligne active contour + coche, clic et **flèches = application immédiate**, annonce `aria-live` regroupée à 400 ms, résumé « Selected », pas de « Custom size ») ; recalcul des alertes branché sur le changement (point d'appel seulement, les règles arrivent avec US-014 à US-016).
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
**Priorité n° 1 de la marge : tâche « Stabiliser `parseSetup.fuzz` »** (developer, 0 pt, prise sur la marge), à faire **juste après le premier push, ou avant**, et au plus tard au début de US-005. Constat : `parseSetup.fuzz.test.ts` est instable (2 échecs sur 5 dans `pnpm check` sur la branche SEC-03a ; seed reproductible `-577722299`). Une fois sur GitHub, la CI rougirait au hasard. Sortie : cause identifiée et corrigée (le bug éventuel est dans `parseSetup`, pas masqué par un timeout), seed `-577722299` rejouée en test de non-régression, graine fixe pour la CI, `pnpm check` vert 10 fois (`--repeat`/boucle, sans charge artificielle).
Ensuite, par ordre : (a) SEC-06 dette de test (`waitForTimeout` restants de `scene.spec.ts`, `open()` de `scene-ui.spec.ts`, LOW de SEC-03a) ; (b) ~~ombre de contact~~ (déplacée dans US-006) ; (c) SEC-03b (dont CORP `same-origin` via ADR-OPS-06), seulement si SEC-02 est terminée (pas de déploiement prévu). Aucune n'est prise avant que US-005 et US-006 soient en revue, hormis la stabilisation de `parseSetup.fuzz`.

## Moment du premier push

Conditions restantes (selon le secdevops) :
- (a) SEC-03a mergée : **FAIT** (42c15cd, scan PASS).
- (b) gitleaks exécuté sur **tout l'historique juste avant le push** (0 finding).
- (c) MFA GitHub du PO activée.
- (d) sur `rolkapone/P152` : secret scanning et push protection, private vulnerability reporting, Dependabot alerts activés.
- Vérification préalable : aucun commit ne contient l'ancienne adresse, `git log` en noreply.
- Le scrum-master signale ces conditions à l'orchestrateur ; **l'orchestrateur demande l'accord explicite du PO à ce moment-là** ; le devops pousse `main` seulement ensuite.
Après le push : **SEC-02** (ruleset, CODEOWNERS, SECURITY.md, réglages Actions), puis la **PR de test de SEC-01** (US-001 T6, SEC-01 T5/T6). Puis la tâche « Stabiliser `parseSetup.fuzz` » si elle n'a pas été faite avant.
Le push est prévu en cours de sprint (pas à la fin) afin que la CI distante tourne sur US-005 et US-006.

## Board

| Story | Statut (TODO / IN PROGRESS / IN REVIEW / SECURITY / DONE / BLOCKED) | Cycles de review | Notes |
|---|---|---|---|
| SEC-03a | DONE | 1 / 3 | Mergée 42c15cd ; revue APPROVE cycle 1 ; secdevops PASS (Semgrep Docker, 0 ERROR, MEDIUM US-004 clos) ; LOW -> SEC-06, CORP -> SEC-03b ; T7 rollup ouverte |
| Stabiliser `parseSetup.fuzz` | TODO | n/a | Tâche developer (0 pt, marge prioritaire) ; avant ou juste après le premier push, au plus tard au début de US-005 ; seed `-577722299` |
| US-005 | TODO | 0 / 3 | Design validé par le PO (2026-10-20) ; T0 règles de lint relues avant le code |
| US-006 | TODO | 0 / 3 | Design validé ; catalogue commité (cd27e44) ; T1b correction de `validate.test.ts` ; dépend de US-005 |
| SEC-02 | TODO | 0 / 3 | Réglages avec le PO ; suppose le push |

## Risques

| # | Risque | Probabilité / impact | Parade |
|---|---|---|---|
| R1 | Push différé (MFA, réglages) : CI distante, SARIF et SEC-02 T4/T5 bloqués | Moyenne / Moyen | SEC-02 T1 prête tôt ; demander au PO la MFA dès le début du sprint ; sinon SEC-02 glisse au Sprint 3 (1 pt) |
| R2 | CSP stricte casse un comportement (Inter, verre, R3F, React Aria) | Moyenne / Moyen | Preview/E2E sous CSP dès SEC-03a (action 2) |
| R3 | US-005 déborde (shell + Inter + verre + lint + budget = 5 pts chargés) | Moyenne / Moyen | T0 courte et isolée ; US-006 peut démarrer sa partie 3D (T1 à T3) en parallèle ; la marge sert de tampon |
| R4 | Générateur du bureau en L (graphics-engineer) + ombre et keep-out dérivés : US-006 plus chargée | Moyenne / Moyen | Angle orienté à droite seulement, sans « Custom size » ; réestimer en cours de sprint ; la marge sert de tampon |
| R5 | ~~Bornes du bureau~~ | Levé | Tranché par le PO (décision 30) |
| R6 | Cycles de review (US-003 en a eu 3) | Moyenne / Moyen | Action 3 ; revue des règles avant le code |
| R7 | Interruptions par limites d'usage | Moyenne / Faible | Action 5 : commits par tâche |
| R8 | Override `rollup: 4.64.7` | Certaine / Faible | Retrait à partir du 2026-10-23 (SEC-03a T7) |
| R9 | Mesure FPS limitée à un GPU haut de gamme, pas de Firefox | Moyenne / Faible | Réserve maintenue, traitée par US-021/US-022 |

## Questions pour le PO

Tranchées le 2026-10-20 : bornes du bureau, bureau d'angle (livré, sans « Custom size »), tous les textes et le design (décisions 29 à 31).

1. **Budget de taille du shell** : valider le seuil proposé par le developer et le graphics-engineer (mesures actuelles : 153,8 Ko gz principal, 266 Ko gz chunk 3D).
2. **Premier push** : l'accord sera demandé quand SEC-03a sera mergée et la MFA faite ; le PO peut déjà confirmer la date de la MFA.

## Revue du sprint
(à rédiger en fin de sprint)

## Rétro
(à rédiger en fin de sprint)
