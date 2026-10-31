# Sprint 2 — Sécuriser le dépôt, shell de l'application et choix du bureau

**Dates** : démarrage le 2026-10-20 (lancement `/sprint 2` par le PO).
**Objectif du sprint** : rendre le dépôt publiable (en-têtes, CSP et correctif React Aria, puis premier push avec l'accord du PO) et livrer le shell de l'application en anglais avec le choix d'un bureau dans un catalogue.

## Capacité et engagement

Vitesse de référence : 16 pts (Sprint 1) ; capacité prudente 15 pts. Contenu accepté par le PO (décision 28).

| Ordre | Story | Tags | Priorité | Points | Remarque |
|---|---|---|---|---|---|
| 1 | SEC-03a En-têtes de sécurité, CSP, correctif React Aria | | Must | 2 | en tête : conditionne le premier push |
| 2 | US-005 Shell de l'application en anglais | [UI] | Must | **8** (était 5) | design natif v0.4 (décision 32) : restylage de US-004 inclus ; inclut texte `failed`, maquette §9/§14, budget de taille |
| 3 | US-006 Choisir un bureau dans un catalogue | [UI][3D] | Must | 5 | dépend de US-005 ; design + technical-artist (catalogue) |
| 4 | SEC-02 Durcissement du dépôt GitHub public | | Must | 1 | suppose le push ; le PO réalise ou valide chaque réglage |
| **Total engagé** | | | | **16** (était 13) | capacité prudente 15, vitesse du Sprint 1 = 16 : dépassement de 1 pt, accepté au regard de la vitesse ; **à confirmer par le PO** |
| Marge | SEC-06 (dette de test) ou SEC-03b | | | 0 | plus de marge ; SEC-02 (1 pt, suppose le push déjà fait) est la première à glisser au Sprint 3 si US-005 déborde |

Ombre de contact (décisions 26 et 31) : **rattachée à US-006** (plus à la marge ni à US-008) : opacité 0,24, empreinte = bureau − 200×140 mm dérivée du bureau choisi ; le keep-out de la caméra est aussi dérivé du bureau (graphics-engineer). Pas de point supplémentaire (inclus dans les 5 pts ; à réestimer si le bureau en L pèse).
Reports du Sprint 1 : US-001 T6 (CI distante), SEC-01 T5/T6 (PR de test, SARIF) : après le push, 0 pt, tâches du devops/secdevops.

## Conditions et décisions du PO applicables

- **Premier push** : conditions dans [decisions.md](../decisions.md) (décisions 23, 24 et 38). Historique déjà réécrit avec l'adresse noreply GitHub (règle permanente : jamais l'e-mail pro). Le remote `origin` = https://github.com/rolkapone/P152.git (public) est ajouté.
- Docker tourne : Semgrep exécutable ce sprint.
- Texte neutre de l'état `failed` (décision 27) ; ombre de contact à alléger (26) : voir [decisions.md](../decisions.md).
- **SHA** : aucun SHA de commit dans les docs (purgés au ménage de fin de Sprint 2) ; les numéros de PR font foi.

## Les 5 actions de la rétro du Sprint 1, appliquées

| # | Action | Consigne concrète pour ce sprint | Responsable |
|---|---|---|---|
| 1 | Aucun test dépendant du temps réel | Ni `waitForTimeout` ni délai réel : `page.clock` ou attente d'un état observable (signal « scène prête »). Le reviewer vérifie la règle à chaque revue. Critère de sortie de toute story qui ajoute des tests E2E (**US-005, US-006**) : règle **reformulée le 2026-10-20** (décision technique de l'orchestrateur, sur recommandation du reviewer ; la règle d'origine « 10 runs sous charge CPU » était mal posée : une charge sans limite la rend impossible à tenir par construction). Définition de `docs/reviews/SEC-03a.md`, consignée dans le rapport QA : (1) **référence CI** : 10 runs `CI=1 pnpm test:e2e` dans l'image Playwright épinglée limitée à `--cpus=4 --memory=8g`, 0 échec ; (2) **stress local informatif** : charge à 50 % des threads logiques, 4 workers, 10 runs, 0 échec dû à une assertion ou à une attente de test ; (3) **contrôle de conception** : `--repeat-each=10` vert sans charge et aucun `waitForTimeout` dans `tests/e2e`. Reportée dans SEC-06 et US-022 (backlog). Pour les tests unitaires ajoutés : graine fixe (fuzz). | developer, qa-tester, reviewer |
| 2 | CSP de production dès SEC-03a | `preview` et `dist-e2e` servent les en-têtes générés par `config/security-headers.mjs`. Tous les E2E échouent sur `securitypolicyviolation` ou erreur console CSP. Aucun `'unsafe-inline'`. US-005 (polices Inter, verre) et US-006 sont donc testées sous CSP stricte. | devops, secdevops |
| 3 | Règles de lint relues avant le code | Première tâche de US-005 : écrire les règles (`boundaries`, `i18next`/ternaire-logique-concaténation) et leur test dans `tests/unit/lint-rules.test.ts`, les **commiter seules** ; le reviewer les relit avant tout code applicatif (revue courte, hors décompte des 3 cycles de la story si possible, à confirmer par l'orchestrateur). Même principe pour le seuil de couverture de `src/state` (US-005/US-006). Dette de lint `from ".."` de `core` corrigée dans cette tâche. | developer, reviewer |
| 4 | Environnement | Orchestrateur : Docker Desktop vérifié démarré avant SEC-03a (Semgrep) ; chaque agent recharge le PATH machine+user au démarrage (Node 24, pnpm 10.34.7). | orchestrateur |
| 5 | Tâches courtes | Chaque tâche ci-dessous = un commit (Conventional Commits) ; un agent ne reçoit qu'une ou deux tâches à la fois ; en cas d'interruption, reprise depuis le dernier commit. | orchestrateur, scrum-master |

## Décisions du PO sur le design (validées le 2026-10-20)

Design US-005 et US-006 **validé par le PO** : décisions 29 à 31 dans [decisions.md](../decisions.md).

Rattachements : les données du catalogue (`desk.json` v2, `desk-corner.json`) sont commitées sur `feature/US-006-choix-bureau` (PR #16) et font échouer le test « a catalog without any desk » de `validate.test.ts` : **le developer le corrige dans US-006**. Le générateur du bureau en L revient au graphics-engineer dans US-006.

Références : UX `docs/design/ux/stories/US-005.md` et `US-006.md` ; maquettes `docs/design/ui/maquettes/US-005.html` et `US-006.html`, `design-system.md` §15 (shell) et §16 (bureaux) ; aperçu 3D `docs/design/3d/apercu-bureaux/` et `docs/design/3d/US-006-bureaux.md`. Les critères UX (US-005 UX-1 à UX-22 ; US-006 UX-1 à UX-17) sont dans les fiches de story (`docs/archive/stories/US-005.md` et `US-006.md`) ; UX-23 de US-005 est rattaché à US-018. Le développement peut commencer.

## Design natif et workflow GitHub (décisions 32 à 36, voir [decisions.md](../decisions.md))

- **Design v0.4** (décision 32) : références `design-system.md` v0.4 (§12, §15, §16, §18 impact code), maquettes `US-004.html`, `US-005.html`, `US-006.html`. Ceci **remplace** « panneaux flottants », « verre 86 % » et « zone libre 758 px » dans les tâches T3/T4 de US-005 (zone libre **806 px à 1366**).
- **US-005 réestimée à 8 pts** (restylage de la barre de vue, de l'astuce et des écrans de US-004 selon §18 : bouton principal en `--color-accent-solid`, coche au lieu du contour 2 px). Engagement 16 pts (voir tableau). Le developer peut demander le redécoupage du restylage de US-004 en story à part si T3 déborde.
- **Workflow GitHub** (décision 35) : les tâches devops ci-dessous sont mises à jour (étape « PR »). Le remote existe : le **premier push est fait** (`main` sur GitHub) ; première CI : 12 jobs verts, **e2e rouge** (timeouts du runner), correction par le qa-tester sur `fix/ci-e2e-runner-timeouts` (à merger via PR avant toute PR de story).
- **Jamais versionnés** (décision 36) : `.gitignore` ; purge de l'historique et force-push de `main` effectués.

## Design requis avant le développement (réalisé, voir ci-dessus)

Pour US-005 et US-006 ; SEC-03a et SEC-02 n'en ont pas.

- **ux-designer** (US-005, puis US-006), à produire d'abord :
  - US-005 : wireframe détaillé de W2 (panneaux flottants gauche/droite repliables, top bar, astuce en pied), W11 (états vide, chargement, erreur) ; **texte neutre de l'état `failed`** (titre, message, action "Try again", différent de WebGL indisponible) ; ordre de tabulation et liens "Skip to 3D view" / "Skip to alerts" ; textes anglais ; critères UX testables à ajouter à la story.
  - US-006 : W3 affiné (onglet "Desk", cartes avec dimensions cm/mm, carte active contour 2 px + coche, annonce du choix, état sans bureau d'angle si non produit, modale "Choose your desk" seulement si US-020 livrée : hors sprint) ; question des bornes du bureau (question 1 du backlog : bornes catalogue 800–2400 mm appliquées par défaut, textes UX à corriger).
- **ui-designer**, après l'ux-designer : maquettes HTML de US-005 (shell complet : verre 86 % avec repli, thèmes clair/sombre, reduced-motion, Inter auto-hébergée, icônes Lucide) ; mise à jour de `docs/design/ui/maquettes/US-004.html` et de `design-system.md` §9 et §14 (info-bulle immédiate au focus clavier) ; maquette du panneau Desk (cartes, états normal/survol/actif/focus) de US-006.
- **technical-artist** (US-006 [3D]) : catalogue de bureaux d'au moins 5 modèles (120×60, 140×70, 160×80, 180×80 cm, **bureau d'angle `desk.corner` à produire**), presets dans `assets/catalog/object-types/desk.json`, plateau et pieds lisibles, hauteur 720-750 mm, budget de triangles, aperçu pour le PO ; **ombre de contact allégée** (proposition chiffrée sur `studio.json`, aperçu avant/après) ; aucun asset externe (procédural), sinon licence consignée.

Critères UX ajoutés aux fiches de story le 2026-10-20. Le développement de US-005 et US-006 est autorisé ; SEC-03a est en cours (pas de dépendance au design).

## Stories et tâches

### 1. SEC-03a — En-têtes de sécurité, CSP, correctif React Aria [devops + secdevops + developer] — 2 pts
Branche : `feature/SEC-03a-headers-csp`. **DONE** : mergée dans `main` (voir l'historique), revue APPROVE au cycle 1/3 (`docs/reviews/SEC-03a.md`), secdevops PASS (`docs/security/scans/SEC-03a.md`, Semgrep via Docker, 0 ERROR, finding MEDIUM de US-004 clos). Critères d'acceptation 1 à 4 cochés dans le backlog.
- [x] T1 (devops) Script de build qui génère `public/_headers` depuis `config/security-headers.mjs` ; `dist/_headers` présent après build (CSP stricte, `nosniff`, Referrer-Policy, Permissions-Policy, COOP, HSTS).
- [x] T2 (devops) Test unitaire : contenu de `dist/_headers` = sortie de `config/security-headers.mjs` ; contrôle `dist/_headers` de `sec-build-hardening` vert, sans avertissement toléré.
- [x] T3 (devops) `preview` et `dist-e2e` servent ces en-têtes (action 2).
- [x] T4 (developer) Correctif React Aria : `<link rel="stylesheet" id="react-aria-pressable-style" href="/react-aria-pressable.css">` dans `index.html`, `public/react-aria-pressable.css`, jamais `'unsafe-inline'`.
- [x] T5 (qa-tester / developer) Test E2E sous CSP de production : échec sur `securitypolicyviolation` et erreur console CSP ; aucun `<style>` injecté par React Aria. Runs sous charge : règle reformulée et reportée (SEC-06 / US-022).
- [x] T6 (secdevops) Scan (dont Semgrep via Docker), clôture du finding MEDIUM du scan US-004.
- [ ] T7 (devops) Retirer l'override `rollup: 4.64.7` si possible (R8, dès le 2026-10-23), sinon le noter. *(non fait : reste ouverte, voir R8)*
Findings LOW et suggestions : reportés dans SEC-06 ; CORP `same-origin` et règle `/index.html` : SEC-03b.

### 2. US-005 — Shell de l'application en anglais [UI] [developer] — 8 pts — **DONE** (PR #14, voie RENFORCÉE)
Branche : `feature/US-005-shell-app`. Design v0.4 validé. Implémenteur : developer. Workflow : branche poussée, **PR ouverte par le devops (T10)**, CI sur la PR, merge via la PR. Tâches cochées après revue APPROVE, contrôle design ECARTS MINEURS, QA PASS (1 cycle), secdevops PASS.
- [x] T3b (developer) **Design v0.4** (`design-system.md` §18) : fenêtre macOS (barre d'outils unifiée avec bascules des deux volets, barre latérale, inspecteur), repli iPadOS/iOS, 4 matériaux, échelle typographique Inter ; restylage de la barre de vue, de l'astuce et des écrans de US-004 (bouton principal `--color-accent-solid`, coche à la place du contour 2 px, zone libre 806 px à 1366) ; UX-5 adapté (bascule droite juste après la gauche). Ajuster tests E2E et cadrage (graphics-engineer).
- [x] T10 (devops) **fait : PR #14, CI et merge.** Après revue APPROVE, design CONFORME, QA PASS et secdevops PASS : push de la branche, **ouverture de la PR** (description : story, critères d'acceptation, liens vers `docs/reviews/US-005.md`, contrôle design, rapport QA, scan sécurité), CI verte sur la PR, merge via la PR (commit de merge).
- [x] T0 (developer, reviewer) **fait** (revue anticipée APPROVE). **Règles avant code (action 3)** : règle `boundaries` (correction de `from ".."` dans `core`, `eslint.config.js:22`), règle `i18next/no-literal-string` (texte en dur dans ternaire, `&&`/`||`/`??`, concaténation) + tests dans `tests/unit/lint-rules.test.ts`, seuil de couverture de `src/state` dans la config Vitest s'il est absent ; commit isolé, relu par le reviewer avant tout code applicatif.
- [x] T1 Tokens générés depuis `docs/design/ui/tokens.css`, thèmes clair/sombre (suit `prefers-color-scheme`), `lang="en"`, i18n complet.
- [x] T2 Inter auto-hébergée (`public/fonts/inter-latin-wght-normal.woff2`, `font-display: swap`, précharge, `OFL.txt`, licence consignée dans `docs/design/3d/licences-assets.md` / `THIRD_PARTY_LICENSES`) ; icônes Lucide (licence ISC).
- [x] T3 Mise en page W2 : top bar (mot-symbole « Deskfit », nom du setup, verdict « Nothing to check yet » ; **sans Undo/Redo, File, Help ni « Saved »**), panneau gauche (onglets Desk / Objects, Objects en état vide), panneau droit (Properties, Alerts), astuce en pied ; panneaux repliables ; verre 86 % + repli opaque (`.no-glass`, `prefers-reduced-transparency`, sans `backdrop-filter`).
- [x] T4 Ordre de tabulation, liens "Skip to 3D view" / "Skip to alerts", focus visible, reflow 200 %, valide dès 1366×768, `prefers-reduced-motion`.
- [x] T5 États vide / chargement / erreur (W11), dont **texte neutre de `failed`** (i18n, test du texte et de `role="alert"`), « Reload page » au 2e échec seulement, `SceneError` à 3 `kind`. Messages d'import `errors.json` : rattachés à US-018.
- [x] T6 Premier module `src/state` : seuil de couverture de `src/state` dans la config Vitest (dette US-003).
- [x] T7 Budget de taille vérifié par `check:bundle` (seuil proposé par developer + graphics-engineer, validé par le PO ; chunk 3D en `lazy()`).
- [x] T8 (ui-designer) Mise à jour de la maquette US-004 et du design-system §9/§14 (info-bulle immédiate au focus clavier).
- [ ] T9 Tests unitaires, E2E sous CSP de production, 10 runs sous charge ; contrôle design ; QA ; secdevops. **Partiel** : contrôle design, QA et secdevops faits ; 5 runs au lieu de 10 (Questions n° 3).

### 3. US-006 — Choisir un bureau dans un catalogue [UI][3D] [graphics-engineer puis developer] — 5 pts — **DONE** (PR #16, voie STANDARD, 0 cycle de correction)
Branche : `feature/US-006-choix-bureau`, mise à jour sur `main` avant T1b (merge, pas de rebase). Revue APPROVE au cycle 1/3 (`docs/reviews/US-006.md`) ; design ECARTS MINEURS acceptés (`docs/design/ui/controles/US-006.md`) ; QA PASS (`docs/qa/US-006.md` : 59,5 à 60,4 FPS sur les 7 bureaux, 244/244 E2E, 0 violation axe) ; secdevops PASS (`docs/security/scans/US-006.md`) ; **ADR-3D-11 accepté** : arbitrage R11 fait (distance caméra par bureau, borne d'espace du studio).
**Réserve** : `--repeat-each=10` et la référence CI en conteneur limité ne sont **pas faits** (2 runs seulement, 244/244). Critère de sortie de l'action 1 non rempli : voir Questions n° 3.
- [x] T0a (developer) Branche mise à jour sur `main` (avant T1b).
- [x] T0b (graphics-engineer, technical-artist) Arbitrage R11 : ADR-3D-11 accepté (distance par bureau, borne du studio).
- [x] T1 (technical-artist) Catalogue de 7 bureaux (5 rectangulaires, 2 d'angle), schéma `min ≤ défaut ≤ max`. Bornes rect 800–2400 × 500–1000 × 600–1300, angle 1200–2400 × 1000–2000.
- [x] T1b (developer) Test « a catalog without any desk » de `validate.test.ts` corrigé.
- [x] T2 (graphics-engineer) Génération du bureau depuis le preset (plateau 740 mm, pieds), générateur du bureau en L (orienté à droite), remplacement dans la scène, objets conservés ; tessellation bornée (2 500 triangles, 2 draw calls).
- [x] T2b (graphics-engineer) Ombre de contact allégée (0,24, bureau − 200×140 mm) et keep-out de la caméra dérivés du bureau.
- [x] T3 (graphics-engineer) Bornes et boîte englobante vérifiées ; cadrage valide pour chaque bureau, dont l'angle (`desk.spec.ts`, `framing.spec.ts`).
- [x] T4 (developer) `setup.desk` dans `src/state`, sérialisé au schéma `SetupV1` (version 1 conservée), défaut 140×70.
- [x] T5 (developer) Onglet Desk (7 lignes, vignettes SVG, clic et flèches = application immédiate, annonce 400 ms, résumé « Selected », pas de « Custom size ») ; alertes recalculées au point d'appel.
- [x] T5b (developer) Design v0.4 : liste en groupe unique avec filets, coche pour la ligne active (UX-6 adapté : coche au lieu du contour 2 px).
- [~] T6 Tests unitaires et E2E **faits** (244/244, 2 runs) ; contrôle design faite ; QA faite (FPS, captures) ; secdevops faite. **Non fait** : 10 runs sous charge (action 1).
- [x] T7 (devops) PR #16 ouverte, CI verte, merge via la PR.
- Hors sprint : modale "Choose your desk" au premier lancement (US-020).

### 4. SEC-02 — Durcissement du dépôt GitHub public [devops] — 1 pt — **DONE** (2026-10-31)
Branches et PR : PR #17 (`SECURITY.md`, `CODEOWNERS`) et PR #20 (section « Application ») mergées ; PR de test #19 fermée sans merge. Réglages appliqués par le PO (accord écrit), vérifiés par l'API le 2026-10-31. Workflow PR suivi (CI sur la PR, merge via la PR).
Critères (fiche `docs/archive/stories/SEC-02.md`) : MFA ; ruleset `main` (PR obligatoire, `ci-ok` requis, Code scanning ≥ High bloquant, pas de force-push ni de suppression) ; secret scanning + push protection, Dependabot alerts, private vulnerability reporting, `SECURITY.md` ; `GITHUB_TOKEN` en lecture seule, approbation des workflows externes, épinglage SHA ; `CODEOWNERS` ; 4 alertes `p152-test-hook-reference` fermées avec justification ; PR de test à 4 cas négatifs (reportée de SEC-01), fermée sans merge.
Dépendabot : 3 PR ouvertes (#12, #13, #15) à traiter au même moment que les alertes.
- [x] T1 (devops) `SECURITY.md`, `CODEOWNERS` : **fait, PR #17**.
- [x] T2 (PO) MFA activée sur le compte : confirmée par le PO le 2026-10-20, avant le premier push (décision 41).
- [x] T3 (devops + PO) Réglages appliqués par le PO, vérifiés par l'API le 2026-10-31 (détail dans `docs/archive/stories/SEC-02.md`).
- [x] T4 (devops) Premier push **fait** (`main` sur GitHub, accord du PO). Première CI : 12 jobs verts, **e2e rouge** (timeouts du runner), correction en cours par le qa-tester sur `fix/ci-e2e-runner-timeouts` ; `ci-ok` à vérifier une fois e2e vert. Un force-push de `main` (purge de l'historique) est en cours.
- [x] T4b (devops) Workflow PR suivi : PR #17 et PR #20 mergées via PR, ruleset `main` actif (`ci-ok` requis).
- [x] T4c (devops) `.gitignore` : `.claude/`, `CLAUDE.md`, `LISEZMOI-EQUIPE.md` ; **fait** : purge de l'historique et force-push de `main` effectués.
- [x] T5 (devops, secdevops) Reports Sprint 1 : PR de test #19 (4 cas négatifs arrêtés par la CI), fermée sans merge ; US-001 T6 et SEC-01 T6 vérifiés (PR #2) ; SEC-01 T5 rattaché ici, fait.
- [x] T6 (PO) Alertes Dependabot activées (vérifié par l'API ; 1 alerte ouverte `minimatch`, exception jusqu'au 2026-11-30).
- [x] T7 (secdevops / PO) 4 alertes `p152-test-hook-reference` fermées « used in tests » (vérifié : 0 ouverte).

### Marge (2 pts, non engagés)
**Marge (faite, PR #18)** : tâche « Stabiliser `parseSetup.fuzz` » livrée en EXPRESS (developer, 2026-10-31) : générateur sans clés interdites à toute profondeur, graine fast-check globale (`FC_SEED`), timeout e2e 30 min ; test de fuite à 5 changements de bureau et `waitForScene` dans UX-6 (cycle 1). Contre-exemple `extensions.{"".{"".prototype}}`, graine 60940642.
Ensuite, par ordre : (a) SEC-06 dette de test (`waitForTimeout` restants de `scene.spec.ts`, `open()` de `scene-ui.spec.ts`, LOW de SEC-03a) ; (b) ~~ombre de contact~~ (déplacée dans US-006) ; (c) SEC-03b (dont CORP `same-origin` via ADR-OPS-06), seulement si SEC-02 est terminée (pas de déploiement prévu). Aucune n'est prise avant que US-005 et US-006 soient en revue, hormis la stabilisation de `parseSetup.fuzz`.

## Moment du premier push

Conditions restantes (selon le secdevops) :
- (a) SEC-03a mergée : **FAIT** ((scan PASS)).
- (b) gitleaks exécuté sur **tout l'historique juste avant le push** (0 finding).
- (c) MFA GitHub du PO activée : **FAIT** (confirmée le 2026-10-20, décision 41).
- (d) sur `rolkapone/P152` : secret scanning et push protection, private vulnerability reporting, Dependabot alerts activés.
- Vérification préalable : aucun commit ne contient l'ancienne adresse, `git log` en noreply.
- Le scrum-master signale ces conditions à l'orchestrateur ; **l'orchestrateur demande l'accord explicite du PO à ce moment-là** ; le devops pousse `main` seulement ensuite.
Après le push : **SEC-02** (ruleset, CODEOWNERS, SECURITY.md, réglages Actions), puis la **PR de test de SEC-01** (US-001 T6, SEC-01 T5/T6). Puis la tâche « Stabiliser `parseSetup.fuzz` » si elle n'a pas été faite avant.
Le push est prévu en cours de sprint (pas à la fin) afin que la CI distante tourne sur US-005 et US-006.

## Board

| Story | Voie | Statut (TODO / IN PROGRESS / IN REVIEW / QA / SECURITY / DONE / BLOCKED) | Cycles | Prochain agent | PR |
|---|---|---|---|---|---|
| SEC-03a | — (livrée) | DONE | 1 / 3 | — | — (mergée avant le premier push) |
| Stabiliser `parseSetup.fuzz` (+ timeout e2e) | EXPRESS (PR #18) | DONE | 1 / 3 | — | #18 |
| Fix CI e2e (`fix/ci-e2e-runner-timeouts`) | — (livrée) | DONE | 1 / 3 | — | #2 |
| US-005 | RENFORCÉE | DONE | 1 / 3 | — | #14 |
| US-006 | STANDARD | DONE | 0 / 3 | — (suivis dans `docs/dette.md`) | #16 |
| SEC-02 | RENFORCÉE | DONE | 0 / 3 | — | #17, #20 |

Notes du board (2026-10-31) :
- **US-005 DONE** : revue APPROVE (T0, lots 1-2, UX-8 + lot 3, correction) ; design ECARTS MINEURS acceptés ; QA PASS après 1 cycle de correction (E2E instables sous charge : 2 workers en local, `waitForTimeout` supprimés et interdits par lint) ; secdevops PASS (threat model v1.4). Réserve : 5 runs de référence au lieu de 10 (Questions n° 3).
- **US-006 DONE** (PR #16) : 5 pts, voie STANDARD, 0 cycle de correction. Plan de release : 31 / 99 livrés. Suivis dans `docs/dette.md`. Réserve : 10 runs non faits (Questions n° 3).
- **Fix e2e et SEC-03a** : suivis de SEC-06 (budget de chargement de `perf.spec`, commentaire `pauseClock`, `docs/qa/ci-e2e-runner.md:7`) ; LOW de SEC-03a -> SEC-06 ; CORP -> SEC-03b ; T7 rollup ouverte (R8).
- **SEC-02 DONE** (PR #17, #20 ; PR de test #19 fermée sans merge). Reste hors story : Scorecard ouvertes #5, #6, #7 (licence, décision PO), #9 ; 11 PR Dependabot ouvertes (#4 à #13, #15), dont #12, #13, #15 en CI rouge ; garde CodeQL ≥ high à remettre en CI (SEC-06). Incident pour la rétro : tentative de merge de la PR de test « DO NOT MERGE » (#19), refusée, jamais mergée.
- **Parse fuzz** : **stabilisé (PR #18, 2026-10-31)**. Le correctif de US-005 ne filtrait que le premier niveau (LOW #1 de la revue sécurité de US-006) ; corrigé. Graines : 60940642 (secdevops), `-577722299` (origine).
- **Règle d'équipe** : ne jamais lancer deux Playwright ou `pnpm check` en parallèle (même `test-results`, même port 4173).

Voies (CLAUDE.md v3) : **US-005 RENFORCÉE** (police Inter auto-hébergée = asset téléchargé, nouvelle ressource servie sous CSP `font-src` ; icônes Lucide si ajoutées = nouvelle dépendance) ; **US-006 STANDARD** (catalogue interne, aucune lecture de fichier fourni par l'utilisateur, aucun réseau, aucune dépendance prévue) ; **SEC-02 RENFORCÉE** (comptes GitHub et réglages du dépôt : MFA, ruleset, Actions ; secdevops en revue approfondie, avis demandé via PASSATION). Aucune story EXPRESS au Sprint 2 (SEC-02 est à 1 pt mais touche aux comptes et aux réglages).

## Risques

| # | Risque | Probabilité / impact | Parade |
|---|---|---|---|
| R1 | Push différé (MFA, réglages) : CI distante, SARIF et SEC-02 T4/T5 bloqués | Moyenne / Moyen | SEC-02 T1 prête tôt ; demander au PO la MFA dès le début du sprint ; sinon SEC-02 glisse au Sprint 3 (1 pt) |
| R2 | CSP stricte casse un comportement (Inter, verre, R3F, React Aria) | Moyenne / Moyen | Preview/E2E sous CSP dès SEC-03a (action 2) |
| R10 | Engagement à 16 pts pour une capacité prudente de 15 ; e2e rouge en CI ; purge d'historique en cours | Moyenne / Moyen | Pas de marge : SEC-02 glisse en premier ; fix e2e mergé avant les PR de stories ; ne rien baser sur d'anciens SHA |
| R13 | Critère de sortie « 10 runs » (action 1) non tenu sur US-005 (5 runs) et US-006 (2 runs) : la règle temps réel n'est pas mesurée | Élevée / Moyen | Décision du PO (Questions n° 3) ; si campagne, passer à `socle:ressources` (environ 40 min de machine, GPU et CPU partagés avec P153) | scrum-master (signalé) |
| R3 | US-005 déborde (shell + Inter + verre + lint + budget + restylage natif v0.4 = 8 pts) | Moyenne / Moyen | T0 courte et isolée ; US-006 peut démarrer sa partie 3D (T1 à T3) en parallèle ; la marge sert de tampon |
| R4 | Générateur du bureau en L (graphics-engineer) + ombre et keep-out dérivés : US-006 plus chargée | Moyenne / Moyen | Angle orienté à droite seulement, sans « Custom size » ; réestimer en cours de sprint ; la marge sert de tampon |
| R5 | ~~Bornes du bureau~~ | Levé | Tranché par le PO (décision 30) |
| R6 | Cycles de review (US-003 en a eu 3) | Moyenne / Moyen | Action 3 ; revue des règles avant le code |
| R7 | Interruptions par limites d'usage | Moyenne / Faible | Action 5 : commits par tâche |
| R8 | Override `rollup: 4.64.7` | Certaine / Faible | Retrait à partir du 2026-10-23 (SEC-03a T7) |
| R9 | Mesure FPS limitée à un GPU haut de gamme, pas de Firefox | Moyenne / Faible | Réserve maintenue, traitée par US-021/US-022 |
| R11 | ~~US-006 : bureaux jusqu'à 180×160 à ~8,2 m à 1024 px, studio limité à ~8 m~~ | Levé | ADR-3D-11 accepté (2026-10-31) ; QA : 60 FPS à 8,97 m | graphics-engineer |
| R12 | Ressource : tests E2E sous charge (10 runs, environ 40 min de CPU et GPU partagés avec P153) | Moyenne / Faible | Transmis à `socle:ressources` ; décision sur Questions n° 3 | qa-tester (signalé par le scrum-master) |

## Questions pour le PO

Tranchées le 2026-10-20 : bornes du bureau, bureau d'angle (livré, sans « Custom size »), tous les textes et le design (décisions 29 à 31).

1. **Budget de taille du shell** : valider le seuil proposé (195 kB gz index, 295 kB gz SceneCanvas) ; mesures US-005 : 176,6 kB gz index, 267,1 kB gz SceneCanvas.
2. **Premier push** : l'accord sera demandé quand SEC-03a sera mergée et la MFA faite ; le PO peut déjà confirmer la date de la MFA. *(Fait : MFA et réglages confirmés par le PO le 2026-10-20, décision 41 ; premier push fait.)*
3. **Critère de sortie de US-005 et US-006 (règle temps réel)** : US-005 : 5 runs `--repeat-each=5` verts (460/460) au lieu des 10 demandés ; US-006 : 2 runs (244/244), `--repeat-each=10` non lancé. Accepter ce niveau, ou demander la campagne de 10 runs (environ 40 min de machine, à passer à `socle:ressources`) ?

## Revue du sprint

**Objectif atteint** : dépôt publié et durci, shell en anglais et choix du bureau livrés. **16 pts livrés sur 16 engagés ; MVP 32 / 99 pts (32,3 %).**

**Livré** : SEC-03a (2 pts) ; correctif E2E du runner (PR #2) ; US-005 shell (8 pts, PR #14) ; US-006 choix du bureau (5 pts, PR #16) ; SEC-02 (1 pt, PR #17 et #20 ; PR de test #19 fermée sans merge) ; stabilité CI `parseSetup.fuzz` (PR #18) ; purge de `.claude` de l'historique ; premier push (MFA et réglages confirmés par le PO le 2026-10-20, décision 41).

**Non livré ou reporté** :
- SEC-03a T7 (retrait de l'override rollup, R8) : ouverte.
- Critère « 10 runs » de US-005 (5 runs) et US-006 (2 runs) : non tenu (R13).
- Garde CodeQL >= High en CI : SEC-06 (règle retirée du ruleset, décision 40).
- Alertes Scorecard #5, #6, #7, #9 ; 11 PR Dependabot ; exception minimatch jusqu'au 2026-11-30 ([dette](../dette.md)).
- FPS mobile réel non mesuré ; modale de premier lancement (US-020).

**Chiffres** (`equipe/ressources/bilan-sprint-2.md`) : 29 appels mesurés (devis 30-40), 25,7 M d'unités, environ 1,8 M par point ; developer + graphics-engineer = 71 %, contrôle = 20 %. Mesure partielle, quota en % non relevé.

**Démo pas à pas (Windows, PowerShell)** :
1. `pnpm install`, puis `pnpm dev` (aucun port fixé dans `vite.config.ts` : port Vite par défaut), ouvrir http://localhost:5173.
2. Barre d'outils « Deskfit » : nom du setup et verdict « Nothing to check yet ».
3. Volets gauche et droit : replier et déplier avec les bascules, recharger la page, l'état est mémorisé.
4. Onglet Desk : 7 bureaux ; à la souris (clic), puis au clavier (Tab, flèches) ; la ligne active porte la coche, « Selected » se met à jour.
5. Choisir un bureau d'angle : la scène le remplace, l'ombre de contact suit.
6. Boutons Reset, Top, Front : la caméra se recadre.
7. Thème sombre : régler Windows en mode sombre, l'application suit.
8. Réduire la fenêtre (1366 px puis plus étroit) : les volets deviennent des tiroirs.
9. Zoom du navigateur à 200 % (Ctrl +) : mise en page sans perte d'accès.

## Rétro

**Ce qui a marché**
- Voies et PASSATION : circuits clairs, 0 cycle de correction sur US-006 et SEC-02, 1 sur US-005.
- Règles de lint relues avant le code (action 3 du Sprint 1).
- PR et CI GitHub : tout mergé via PR, `ci-ok` requis.
- Contrôles en parallèle (design, QA, sécurité) : environ 20 % du sprint.
- Ruleset de `main` et cas négatifs de la PR de test #19 : bloqués comme prévu.

**Ce qui a moins bien marché**
- 4 interruptions par limite d'usage.
- Un developer arrêté à 120 tours (lot US-005 trop gros : 10 M d'unités, 39 % du sprint).
- E2E lancés en même temps par deux agents (revue et QA) : collisions sur `test-results` et le port 4173.
- Tests instables sous charge et sur le runner ; CI E2E de 15 à 18 min par PR.
- US-005 réestimée de 5 à 8 pts en cours de sprint.
- Règle `code_scanning` qui bloquait toutes les PR (retirée, décision 40) ; mode evaluate indisponible (plan Free).
- **Incident : le devops a tenté de merger la PR de test #19 « DO NOT MERGE »** ; refusé, jamais mergée.
- Documents trop gros jusqu'au ménage de fin de sprint.
- Critère « 10 runs » mal posé puis non tenu (5 et 2 runs).

**Actions pour le Sprint 3** (les 3 économies de `socle:ressources`, à valider par le PO, plus le garde-fou d'incident)
1. Appels d'implémentation de 3 à 4 tâches, un commit chacune, une PASSATION ; plus d'appel à 120 tours. Responsable : orchestrateur ; tâches courtes au planning : scrum-master.
2. Jamais deux E2E en parallèle : reviewer sans E2E (il se fie à `pnpm check`), qa-tester seul à lancer les E2E ciblés par story, suite complète laissée à la CI. Responsable : orchestrateur, qa-tester.
3. Coût CI : une seule vérification de la CI par PR, cache navigateurs Playwright / sharding, E2E limités aux specs touchées pour EXPRESS et docs (touche la CI : accord du PO). Responsable : devops.
4. Garde-fou merge (incident #19) : le mandat de merge cite le numéro de PR ; le devops ne merge jamais une PR « DO NOT MERGE » ni hors story. Responsable : orchestrateur, devops.

Rétro du Sprint 1 : actions 2, 3, 4 et 5 appliquées ; action 1 (temps réel) appliquée au code (plus de `waitForTimeout`) mais critère « 10 runs » non tenu (Questions n° 3).
