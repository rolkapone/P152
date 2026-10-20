# Backlog — P152 (nom provisoire du produit : « Deskfit »)

## Plan de release

| Indicateur | Valeur |
|---|---|
| Points MVP (Must + Should) | **99** (Must 89, Should 10) ; +1 pt : SEC-03a passe de 1 à 2 pts (correctif CSP React Aria, finding MEDIUM US-004) ; **+3 pts le 2026-10-20 : US-005 passe de 5 à 8 pts** (design natif v0.4, décision 32) |
| Dont stories sécurité (SEC-01 à SEC-05) | 9 (Must 8, Should 1) |
| Points « Could » MVP (hors total, bonus) | 9 (US-021, US-023, SEC-06) |
| Points livrés | **16 / 99 = 16,2 %** (Sprint 1 : US-001 3, US-002 2, US-003 3, SEC-01 3, US-004 5, toutes DONE) |
| Vitesse moyenne | **16 pts/sprint** (1 sprint terminé, 16 pts livrés ; prévision prudente de 15 pts conservée pour le planning) |
| Sprint en cours | **Sprint 2** (ouvert le 2026-10-20) : SEC-03a 2 + US-005 **8** + US-006 5 + SEC-02 1 = **16 pts engagés** (capacité prudente 15 : dépassement de 1 pt, marge 0 ; SEC-02 peut glisser au Sprint 3) ; après le Sprint 2, livrés prévus 32 / 99 (32,3 %), restants 67 |
| Sprints restants estimés avant MVP | **6 y compris le Sprint 2** (83 pts restants / 16 = 5,2 ; 6 si la vitesse retombe à 15) ; 5 après le Sprint 2 (67 / 16 = 4,2, arrondi prudent) |
| Dernière mise à jour | 2026-10-20 (SEC-03a DONE, mergée 42c15cd ; Sprint 2 : 2 / 13 pts engagés livrés ; ouverture du Sprint 2 ; plan dans `docs/sprints/sprint-2.md`). Les SHA de commits cités dans ce document sont périmés (historique réécrit) : voir `git log --merges --oneline main` |

Détail du recalcul : 83 pts (kickoff) + SEC-01 (3) + SEC-02 (1) + SEC-03a (2 depuis la fin du Sprint 1) + SEC-03b (1) + SEC-04 (1) + SEC-05 (1) + US-024 (2, réglages d'alertes) + US-025 (2, Help et préférences d'affichage) = 96, puis +3 (US-005 5 → 8, restylage natif v0.4) = **99**. Les autres éléments issus de US-004 (dette, mineurs QA) sont des critères ajoutés à des stories existantes ou à SEC-06 (Could), sans point supplémentaire ; à réestimer au planning du Sprint 2 s'ils pèsent.
Hypothèse : le premier déploiement public n'a lieu qu'à la fin du MVP (SEC-03a avant le premier push, SEC-03b avant ce déploiement, SEC-05 juste avant la release).

Légende : priorité MoSCoW, estimation en points (1, 2, 3, 5, 8). Tags `[UI]` = écran, `[3D]` = scène/rendu/assets.
Convention de langue : documents en français ; textes visibles dans l'app en **anglais** (libellés cités entre guillemets = texte UI anglais). Unités métriques (mm/cm), **sauf la diagonale d'écran affichée en pouces avec son équivalent en mm** (décision 8).
Les critères UX/UI de ce document viennent de `docs/design/ux/principes.md`, `docs/design/ux/wireframes-mvp.md` (W1 à W11) et `docs/design/ui/design-system.md`. Maquettes : `docs/design/ui/maquettes/index.html` ; DA 3D : `docs/design/3d/direction-artistique.md` ; catalogue : `docs/design/3d/assets-mvp.md` et `assets/catalog/`.

## Questions pour le PO

Questions A à F de fin de Sprint 1 : **répondues le 2026-10-20** (voir « Décisions du PO » en fin de document, n° 22 à 28) ; G reste ouverte. Détail dans `docs/sprints/sprint-1.md`, section « Questions pour le PO ») : A. dépôt GitHub et premier push ; B. e-mail nominatif ou noreply dans les commits ; C. Docker pour Semgrep ; D. ombre de contact ; E. texte de l'état `failed` ; F. contenu du Sprint 2 ; G. questions long terme.

Aucune question ouverte pour le Sprint 2 : la question 1 (bornes du bureau) est **tranchée par le PO le 2026-10-20** (décision 30 : rectangulaire 800–2400 × 500–1000 × 600–1300 mm ; angle 1200–2400 × 1000–2000 mm).

### Questions ouvertes à long terme (non bloquantes pour le MVP, issues du threat model §12)
- **Affiliation (R5)** : des liens d'affiliation sont-ils compatibles avec la promesse de neutralité vis-à-vis des marques ? Si oui, déclaration « affiliate links » et classement indépendant de la commission ?
- **Âge minimum des comptes (R6)** : 13, 15 ou 16 ans ?
- **Hébergement des données dans l'UE (R6/R7)** : exigé pour le backend et le fournisseur IA, même à coût supérieur ?

---

# MVP — « Est-ce que ça rentre ? »

## Epic A — Fondations techniques

### US-001 — Setup repo, build et CI  [Must | 3 pts]
En tant qu'équipe, je veux un repo avec build, lint, tests et CI afin de livrer chaque story de façon fiable.
**État au 2026-10-19 : DONE.** Mergée dans `main` (merge `--no-ff` dfdfcfe). Revue APPROVE au cycle 2/3 (`docs/reviews/US-001.md` ; cycle 1 bloqué sur l'audit tinypool/vitest, corrigé par Vitest 4.1.12). Secdevops PASS (`docs/security/scans/US-001.md`). Checks locaux verts (`docs/ci/local-run-US-001.md`). **Écart consigné** : la CI distante n'a pas été exécutée (décision PO : pas de dépôt ni de push au Sprint 1) ; son exécution réelle est reportée au Sprint 2 (SEC-01, SEC-02). **Levé le 2026-10-21** : CI distante exécutée sur la PR #2 (mergée, 925469d), 17/17 jobs verts.
Critères d'acceptation :
- [x] Étant donné un clone propre, quand on lance `pnpm install --frozen-lockfile` puis le build, alors il réussit sans erreur (premier `pnpm install && pnpm check` exécuté, `pnpm-lock.yaml` commité).
- [x] Étant donné les jobs de `ci.yml`, quand on lance en local les mêmes commandes que ceux-ci (lint, types, tests unitaires, build), alors tout est vert. *(Décision PO 2026-10-19 : pas de dépôt GitHub ni de push au Sprint 1 ; la vérification de l'exécution réelle de la CI sur une PR est reportée au Sprint 2.)*
- [x] Étant donné le repo, alors `.env` est dans `.gitignore` et `.env.example` existe.
- [x] Les fichiers binaires > 1 Mo sont suivis par Git LFS (`.gitattributes` présent, `check:assets` vert).
- [x] *(sécurité)* `.npmrc`/`pnpm-workspace.yaml` avec `onlyBuiltDependencies` en liste blanche et `minimumReleaseAge` (3 jours) ; `.env` ignoré, `.env.example` factice ; `build.sourcemap` désactivé (ou `hidden` non déployé) pour le build de production.
Notes techniques / dépendances : devops. Bloque toutes les autres stories. **Prérequis PO** : installer Node 24 LTS et pnpm 10.34.7 ; accord explicite pour créer le dépôt GitHub public et pousser.

### US-002 — Threat model initial  [Must | 2 pts]
En tant que PO, je veux un threat model du produit afin d'anticiper les risques de sécurité dès la conception.
**État au 2026-10-20 : DONE.** Mergée dans `main` (55a93a6). Revue APPROVE au cycle 2/3 (`docs/reviews/US-002.md` ; cycle 1 : critères SEC-10 à SEC-50 perdus, remis dans le backlog). Secdevops PASS (`docs/security/scans/US-002.md` ; ajout de `.gitleaksignore` pour un faux positif). Les corrections de `docs/architecture.md` demandées par la revue sont rattachées à US-003.
Critères d'acceptation :
- [x] Étant donné l'architecture MVP, quand le threat model est rédigé, alors `docs/security/threat-model.md` liste actifs, surfaces d'attaque (import de fichiers, stockage local, dépendances) et mesures.
- [x] Les scans SAST, dépendances et secrets sont définis pour la CI (`docs/security/ci-security.md`).
- [x] Le threat model et `ci-security.md` sont cohérents avec les décisions PO et le scan US-001 (SEC-03a avant le premier push, findings LOW tracés en SEC-06, Vitest 4.1), avec liens exacts et aucun secret.
- [x] Revue APPROVE du reviewer (3 cycles max) et merge `--no-ff` dans `main` (DoD).
Notes techniques / dépendances : secdevops. À réviser avant R6 (comptes) et R7 (import). Les stories SEC-01 à SEC-05 en sont issues.

### US-003 — Architecture socle et modèle de données du setup  [Must | 3 pts]
En tant que développeur, je veux une architecture documentée et un modèle de données versionné afin que la vision long terme (matières, éclairage, déco, partage) n'impose pas de refonte.
**État au 2026-10-20 : DONE.** Mergée dans `main` (10af92a). Revue APPROVE au **cycle 3/3, limite atteinte** (`docs/reviews/US-003.md` ; cycles 1 et 2 sur les frontières de couches du lint). Secdevops PASS (`docs/security/scans/US-003.md`, findings LOW tracés ci-dessous). Dette de revue et findings LOW rattachés aux stories concernées (voir « Dette issue de US-003 » plus bas).
Critères d'acceptation :
- [x] Étant donné `docs/architecture.md`, alors les choix de stack et leurs ADR sont consignés (fait, statut « Accepté » au 2026-10-19).
- [x] Le schéma du setup (bureau, objets, position, rotation, paramètres, champ matériau réservé, version de schéma) est défini et validé par des tests.
- [x] Le catalogue d'objets est décrit par des données (`assets/catalog/`), indépendamment du code de la scène.
- [x] Les textes de l'interface passent par un système i18n (anglais par défaut ; le français reste une option ultérieure non engagée).
- [x] *(sécurité)* Le catalogue est validé par schéma en test (clés de prototype rejetées, bornes cohérentes `min ≤ défaut ≤ max`).
- [x] *(corrections docs issues de la revue US-002, à faire avant SEC-03a)* Dans `docs/architecture.md` : la CSP de « Sécurité transverse » (~l.608) est identique à celle d'ADR-OPS-06 (`form-action 'none'`, `upgrade-insecure-requests`) ; HSTS est ajouté à ADR-OPS-06 ; ADR-OPS-03 indique que la génération des en-têtes revient à SEC-03a (pas encore faite) ; « Vitest 3 » devient « Vitest 4.1 » (~l.853). Vérifiable par `grep` : plus aucune occurrence de « Vitest 3 », une seule CSP.
Notes techniques / dépendances : developer + graphics-engineer + devops. Dépend de US-001. Le catalogue du technical-artist existe déjà (10 fichiers JSON, matériaux, styles) : la story le charge et le valide.

### Dette issue de US-003 (revue cycle 3 et scan LOW) — à traiter dans les stories indiquées
- **Hors story, à rattacher au sprint en cours ou à SEC-06 (developer/devops)** : (1) `from ".."` refusé à tort dans `core` (`eslint.config.js:22`) : corriger la règle de frontières de couches et ajouter un test du lint ; (2) le test TS7026 devient un vrai test de compilation (`tsc` sur fixture, échec attendu vérifié) ; (3) branche inatteignable de `withDefaults` : la supprimer ou la couvrir par un test.
- **Première story qui crée un module dans `src/state`** (probablement US-005/US-006) : créer en même temps le seuil de couverture de `src/state` dans la config Vitest (critère d'acceptation de cette story).
- **US-018** : libellés `tooLarge` ("1 MB" alors que la limite est 1 Mio) et `tooManyObjects` à valider par l'ux-designer ; `NO_CONTROL_CHARS` laisse passer les caractères C1 et bidi (risque d'usurpation visuelle des noms) ; restriction d'import de `zod` étendue à tout `src/` et E2E CSP sur le vrai `dist` (le jitless de Zod dépend de l'ordre d'import).
- **US-004, US-008, US-009** : `z.looseObject` dans `StudioSceneSchema` ; les générateurs ne doivent lire que des champs validés (test dédié).

### Dette et suivi issus de US-004 (revue, scan MEDIUM/LOW, QA) — rattachés aux stories indiquées
- **SEC-03a** : correctif MEDIUM CSP React Aria (voir critère dans SEC-03a).
- **SEC-06** : drei (LOW) et dette de test (voir critères ajoutés à SEC-06).
- **US-005** : texte neutre de l'état `failed`, mise à jour maquette / design-system §9 et §14 (info-bulle immédiate au focus clavier), budget de taille du shell (voir critères ajoutés à US-005).
- **US-022** : bascule automatique du palier de qualité, fiabilité des E2E sous charge, mesure Firefox (voir critères ajoutés à US-022). Le palier de qualité peut aussi être pris par US-021 si le tactile est engagé avant.
- **Mineur QA, prochaine story qui touche `src/` caméra (US-012 ou US-017)** : Reset après Top en mode animé laisse 35 à 43 pixels différents de la vue par défaut (imperceptible) ; lisser la convergence dans `viewRig.ts` (graphics-engineer) ; critère : après Top puis Reset, la capture diffère de la vue par défaut de 0 pixel.
- **Mineur QA, avec US-008 (premiers objets)** : l'ombre de contact est jugée lourde sous un bureau vide ; à montrer au technical-artist et au PO avant d'ajuster `assets/catalog/scene/studio.json` (question PO).
- **Mesures à prévoir** : FPS sur un vrai smartphone (l'émulation Pixel 7 n'est pas une mesure ; rattaché à US-021, ou ponctuellement avant la release MVP) et E2E / rendu sur Firefox (US-022).

### SEC-01 — Pipeline sécurité en CI  [Must | 3 pts]
En tant qu'équipe, je veux que chaque PR soit scannée (secrets, SAST, dépendances, licences, workflows, build) afin qu'aucune vulnérabilité CRITICAL/HIGH ni aucun secret n'atteigne `main`.
**État au 2026-10-20 : DONE.** Mergée dans `main` (360a597). Revue APPROVE au cycle 1/3 ; secdevops PASS. La PR de test distante et le SARIF sont reportés au Sprint 2 (décision PO, pas de push) ; les findings restants sont tracés dans SEC-06.
Critères d'acceptation :
- [x] Le slot `# SECDEVOPS-SLOT` de `ci.yml` contient les jobs de `docs/security/ci-security.md` (gitleaks, CodeQL, Semgrep, zizmor, SCA + licences, `build-hardening`) et un job agrégateur `security` requis par `ci-ok`.
- [ ] *(reste à faire, rattaché à SEC-02 T5 : la première PR distante, #2, est celle du correctif E2E, sans cas négatifs)* Une PR de test contenant un faux secret, un `innerHTML`, une dépendance vulnérable HIGH, et un `dist` contenant `__p152test` fait échouer la CI (4 cas vérifiés puis annulés).
- [x] `.gitleaks.toml`, `.semgrep/p152.yml`, `scripts/check-licenses.mjs`, `.github/dependabot.yml` et le workflow hebdomadaire sont en place ; actions et images épinglées par SHA/digest.
- [x] *(vérification locale, Sprint 1)* Chaque job de sécurité est exécuté en local avec la même commande que dans `ci.yml` (gitleaks, SCA + licences, zizmor, `build-hardening` hors contrôle `_headers`, Semgrep) et le résultat est consigné dans `docs/ci/local-run-SEC-01.md` ; ce qui n'est pas exécutable en local (CodeQL, Semgrep si Docker est arrêté) est listé comme non vérifié, jamais comme vert.
- [x] *(vérification locale)* Les 4 cas négatifs (faux secret, `innerHTML`, dépendance HIGH, `__p152test` dans `dist`) sont rejoués en local sur une copie jetable, chacun fait échouer la commande du job correspondant, puis tout est annulé (arbre propre) ; les cas non faisables sont consignés.
- [x] `docs/security/ci/` porte un bandeau « obsolète : les fichiers actifs sont à la racine / dans `.github/` » (finding de la revue US-002).
- [x] Les rapports SARIF remontent dans l'onglet Code scanning. *(vérifié sur la PR #2, première CI distante 17/17 verte ; `dependency-review` exécuté sur la PR)*
Notes techniques / dépendances : devops + secdevops. Dépend de US-001 (CI exécutée au moins une fois). Le contrôle `dist/_headers` de `build-hardening` **reste bloquant** (décision secdevops, scan US-001) : il n'y a pas d'avertissement toléré. La génération de `public/_headers` est donc livrée par SEC-03a **avant le premier push** (Sprint 2, en tête). Les findings LOW du scan US-001 sont regroupés dans SEC-06.

### SEC-02 — Durcissement du dépôt GitHub public  [Must | 1 pt]
En tant qu'équipe, je veux un dépôt public durci afin de réduire le risque de compromission de la chaîne de production.
Critères d'acceptation :
- [ ] MFA actif sur les comptes ayant un accès en écriture.
- [ ] Ruleset sur `main` : PR obligatoire, `ci-ok` requis, résultats Code scanning (≥ High) bloquants, force-push et suppression interdits.
- [ ] Secret scanning + push protection, Dependabot alerts, private vulnerability reporting activés ; `SECURITY.md` publié.
- [ ] Actions : `GITHUB_TOKEN` en lecture seule par défaut, approbation requise pour les workflows des contributeurs externes, épinglage SHA obligatoire si l'option est disponible.
- [ ] `CODEOWNERS` couvre `.github/`, `config/security-headers.mjs`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, `.gitleaks.toml`, `.semgrep/`.
- [ ] *(suivi PR #2)* Les alertes Dependabot, aujourd'hui **désactivées**, sont activées par le PO (Settings > Code security) ; vérifiable : l'onglet Security > Dependabot est accessible.
- [ ] *(suivi PR #2)* Les 4 alertes de code scanning `p152-test-hook-reference` sur `PerfProbe.tsx` sont fermées comme faux positifs (« used in tests / false positive », hook protégé par `VITE_E2E`), avec un commentaire de justification ; vérifiable : 0 alerte ouverte de cette règle.
- [ ] *(reporté de SEC-01)* La PR de test avec les 4 cas négatifs (faux secret, `innerHTML`, dépendance HIGH, `__p152test`) fait échouer la CI, puis est fermée sans merge.
Notes techniques / dépendances : devops. **Les réglages du compte/dépôt GitHub ne sont appliqués qu'avec l'accord explicite du PO** (le PO réalise ou valide chaque action). Dépend de US-001 et de la création du dépôt distant.

### SEC-03a — Génération des en-têtes de sécurité (`_headers`, CSP) et CSP de React Aria  [Must, avant le premier push | 2 pts]
**État au 2026-10-20 : DONE.** Mergée dans `main` (42c15cd). Revue APPROVE au cycle 1/3 (`docs/reviews/SEC-03a.md`) ; secdevops PASS (`docs/security/scans/SEC-03a.md`, Semgrep via Docker, 0 ERROR ; finding MEDIUM de US-004 clos). Les LOW et suggestions sont tracés dans SEC-06 et SEC-03b.
En tant qu'équipe, je veux que le build produise les en-têtes de sécurité afin que le contrôle `build-hardening` passe et que le premier push n'échoue pas.
Critères d'acceptation :
- [x] Étant donné `config/security-headers.mjs` (source unique), quand on lance le build, alors `public/_headers` est généré et `dist/_headers` existe avec CSP stricte sans `unsafe-inline`/`unsafe-eval`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP, HSTS.
- [x] Un test unitaire vérifie que le contenu de `dist/_headers` correspond à `config/security-headers.mjs` ; le contrôle `dist/_headers` de `sec-build-hardening` (ci.yml) est vert, sans avertissement toléré.
- [x] Le preview/E2E servi avec ces en-têtes ne produit aucune violation CSP en console.
- [x] *(finding MEDIUM du scan US-004)* React Aria `usePress` injecte un `<style>` inline au runtime, ce qui viole `style-src` d'ADR-OPS-06. Correction : `index.html` contient `<link rel="stylesheet" id="react-aria-pressable-style" href="/react-aria-pressable.css">`, le fichier `public/react-aria-pressable.css` existe (même contenu que le style injecté), **jamais `'unsafe-inline'`** ; un test E2E sous CSP de production échoue sur tout `securitypolicyviolation` et sur toute erreur console CSP, et vérifie qu'aucun `<style>` injecté par React Aria n'est présent.
Notes techniques / dépendances : devops + secdevops (+ developer pour le correctif React Aria). **Sprint 2, en tête, avant tout push** (décision secdevops : contrôle bloquant). Dépend de US-001 (DONE). Débloque SEC-01 (jobs) et US-022 (E2E sous CSP).

### SEC-03b — Déploiement sécurisé sur Cloudflare Pages  [Must avant le premier déploiement | 1 pt]
En tant qu'équipe, je veux un déploiement protégé afin qu'aucun bundle altéré n'atteigne les utilisateurs.
Critères d'acceptation :
- [ ] Environnement GitHub `production` : approbation du PO, déploiement depuis les tags `v*` uniquement ; secrets Cloudflare présents uniquement dans cet environnement (et `preview` séparé avec son propre jeton).
- [ ] Jeton Cloudflare à portée « Pages : Edit » sur le seul compte ; MFA Cloudflare ; procédure de rotation écrite dans `docs/security/`.
- [ ] Après chaque déploiement, un contrôle automatique lit les en-têtes de l'URL réelle et échoue si un en-tête diffère de `config/security-headers.mjs`.
- [ ] Les previews portent `X-Robots-Tag: noindex` et ne sont jamais construites depuis un fork.
- [ ] *(suivi SEC-03a)* `Cross-Origin-Resource-Policy: same-origin` ajouté dans `config/security-headers.mjs` en passant par **ADR-OPS-06** (mise à jour de l'ADR, test d'en-têtes et contrôle CI alignés).
- [ ] *(suivi SEC-03a)* Vérifier que la règle `/index.html` des en-têtes est bien opérante sur Cloudflare Pages (elle est inopérante en local/preview) ; corriger ou retirer sinon.
Notes techniques / dépendances : devops + secdevops. Dépend de SEC-03a et SEC-02. À livrer avant le premier déploiement, sur ordre du PO. Pas de domaine personnalisé (`*.pages.dev`).

### SEC-06 — Durcissement CI (findings LOW du scan US-001)  [Could | 2 pts, priorité basse]
En tant qu'équipe, je veux traiter les findings LOW du scan US-001 afin de réduire la surface de la chaîne CI. À planifier après SEC-01 (peut être pris en tâches dans SEC-01 si de la place).
Critères d'acceptation :
- [x] `persist-credentials: false` sur les `actions/checkout` des jobs `quality`, `unit`, `build` et `assets` de `ci.yml` (zizmor sans alerte `artipacked`). *(fait dans SEC-01, branche non mergée)*
- [x] `id-token: write` retiré de `security-scheduled.yml` (permissions minimales par job). *(fait dans SEC-01, branche non mergée)*
- [x] `security-scheduled.yml` exécute aussi gitleaks (historique complet) et CodeQL en hebdomadaire. *(fait dans SEC-01, branche non mergée)*
- [ ] zizmor est installé à version et empreinte fixées (hash vérifié), plus via `uvx` sans empreinte.
- [ ] Dependabot (`docker-compose`) suit les digests des images semgrep et playwright, ou une procédure de mise à jour documentée les remplace.
- [x] L'agrégateur `security` de `ci.yml` traite un job `skipped` comme un échec (aujourd'hui seuls `failure` et `cancelled` font échouer l'agrégation ; aligner sur `ci-ok`, qui exige `success`). *(fait dans SEC-01, branche non mergée)*
- [ ] Migration d'ESLint 9 (déprécié) vers la version supportée, ADR consigné, `pnpm check` vert.
- [ ] *(MEDIUM, scan SEC-01)* `ci.yml:117` : `--config .gitleaks.toml` obligatoire sur la commande gitleaks ; un `CODEOWNERS` couvre `.gitleaks.toml` et `.github/` (voir aussi SEC-02).
- [ ] L'en-tête « Brouillon » de `scripts/check-licenses.mjs` et des brouillons de `docs/security/ci/` est retiré ou corrigé ; coquille « n est » corrigée.
- [ ] `docs/ci/local-run-SEC-01.md` est exact : persona auditor (7 low) et formulation « extraites sauf écarts signalés » corrigées.
- [ ] Les échecs de `security-scheduled.yml` déclenchent un agrégateur ou une notification (lien avec SEC-02).
- [ ] *(au premier push)* `upload-sarif` fonctionne dans le conteneur semgrep et `security-events: write` est géré pour les PR de forks.
- [ ] *(dette de test)* Un test sur 190 a échoué une fois dans `pnpm check` sous charge, puis est passé 6 fois : identifier le test instable (candidat probable : fuzz fast-check, timeout ou seed), le stabiliser (seed fixe ou timeout explicite) et le vérifier par 10 exécutions consécutives sous charge. Instabilité déjà tracée de `parseSetup.fuzz`.
- [ ] *(dette de test, US-004)* Les `waitForTimeout` restants de `tests/e2e/scene.spec.ts` (l.37, 39, 50, 53) sont remplacés par des attentes sur un état observable ou `page.clock` ; `open()` de `scene-ui.spec.ts` n'est plus sensible à la charge (attente d'un signal de scène prête). Règle : aucun test E2E ne dépend du temps réel. Vérifié selon la règle reformulée (référence CI 4 CPU / 8 Go, `--repeat-each=10` sans charge ; voir plus bas) au lieu de « CPU saturé » (juste après le merge US-004, le devops avait vu 1 à 4 échecs sur 3 runs ; 40/40 deux fois ensuite).
- [ ] *(LOW, scan US-004)* `@react-three/drei` est installé mais inutilisé, et ses helpers chargent des ressources depuis un CDN (contraire à la CSP). Soit la dépendance est retirée de `package.json` / lockfile, soit une règle de lint interdit ses imports qui chargent depuis un CDN (test de la règle dans `tests/unit/lint-rules.test.ts`).
- [ ] *(LOW, scan SEC-03a)* Test de non-divergence du CSS React Aria : `public/react-aria-pressable.css` est comparé au style que la version installée de React Aria injecterait (échec à la mise à jour de la dépendance si divergence).
- [ ] *(LOW, scan SEC-03a)* Les chemins de `.semgrep/p152.yml` sont ancrés (pas de motif qui déborde sur d'autres dossiers) ; test de la règle.
- [ ] *(LOW, scan SEC-03a)* Le contrôle CI des en-têtes (`sec-build-hardening`) est étendu à `style-src`, `connect-src` et `worker-src`.
- [ ] *(suggestion revue SEC-03a)* Note dans le README sur la preview : `upgrade-insecure-requests` et HSTS (comportement en `http://localhost`, Safari, HSTS mémorisé).
- [ ] *(suggestion revue SEC-03a)* Le test `skipIf` de `security-headers` ne peut plus masquer un échec (il échoue si `dist/` est absent en CI) ; `apply: () => true` du plugin est justifié ou remplacé par une condition explicite.
- [ ] *(suggestion revue SEC-03a)* `csp.spec` utilise `waitForScene` (signal de scène prête) au lieu d'une attente implicite.
- [ ] *(suivi SEC-03a, à traiter par la première story qui ajoute une modale ou un popover)* `usePreventScroll` de React Aria (overlays, modales) injecte un `<style>` au runtime, contraire à `style-src` : la story concernée doit prévoir le même correctif (feuille statique) ou une alternative, avec test E2E sous CSP. Non traité ici faute de composant concerné.
- [ ] *(suivi PR #2, qa-tester)* `perf.spec` vérifie un budget de temps de chargement de la scène (seuil proposé par le qa-tester, valeur validée par le PO) ; le commentaire de `pauseClock` est corrigé pour refléter son comportement réel ; `docs/qa/ci-e2e-runner.md:7` est précisé (formulation corrigée selon la revue).
- [ ] *(règle « 10 runs E2E sous charge », reformulée)* La règle « 10 exécutions sous charge CPU sans limite » est abandonnée (impossible à tenir par construction). Définition de `docs/reviews/SEC-03a.md` : (1) référence CI : 10 runs `CI=1 pnpm test:e2e` dans l'image Playwright épinglée limitée à `--cpus=4 --memory=8g`, 0 échec ; (2) stress local informatif : charge à 50 % des threads logiques, 4 workers, 10 runs, 0 échec dû à une assertion ou à une attente de test ; (3) contrôle de conception : `--repeat-each=10` vert sans charge et aucun `waitForTimeout` dans `tests/e2e`. Remplace le critère de 10 runs sous charge ci-dessus.
Notes techniques / dépendances : devops + secdevops. Source : `docs/security/scans/US-001.md`, scan SEC-01, scan et revue SEC-03a. Hors total MVP (Could).

### SEC-04 — Mention « vos données restent dans ce navigateur »  [UI] [Should | 1 pt]
En tant qu'utilisateur, je veux savoir où sont stockées mes données afin de décider en confiance.
Critères d'acceptation :
- [ ] L'aide (Help, W10) indique en anglais que le setup est stocké uniquement dans ce navigateur, sans compte, cookie ni pistage, et comment l'exporter ou l'effacer ("New setup").
- [ ] Une page « Privacy » statique est accessible depuis l'aide avant toute publication ; texte ≥ 14 px, contrastes AA.
Notes techniques / dépendances : developer, textes ux-designer. Dépend de US-025.

### SEC-05 — Revue de sécurité avant la release MVP  [Must | 1 pt]
En tant que PO, je veux une revue de sécurité finale afin de publier sans risque connu.
Critères d'acceptation :
- [ ] Threat model révisé ; scans complets sur `main` sans CRITICAL/HIGH ouvert.
- [ ] Tests manuels de l'import avec le jeu de fichiers malveillants ; en-têtes de l'URL de production vérifiés (Mozilla HTTP Observatory, note visée A+).
- [ ] Rapport `docs/security/release-mvp.md`.
Notes techniques / dépendances : secdevops. Dernière story du MVP ; dépend de SEC-03a, SEC-03b, US-018, US-022.

## Epic B — Scène 3D et navigation

### US-004 — Scène 3D de base et caméra orbitale  [UI][3D] [Must | 5 pts]
En tant qu'utilisateur, je veux tourner, zoomer et me déplacer autour de ma scène afin de voir mon setup sous tous les angles.
**État au 2026-10-20 : DONE.** Mergée dans `main` (ded254f). Revue APPROVE au cycle 2/3 (`docs/reviews/US-004.md` ; cycle 1 : test E2E UX-8 dépendant du temps réel, corrigé avec `page.clock`). Contrôle design : ECARTS MINEURS acceptés (`docs/design/ui/controles/US-004.md`). QA PASS (`docs/qa/US-004.md`) : 60 FPS sur GPU matériel (RTX 5070) à 1366 et 1920, 9 draw calls, 2 636 triangles, axe sans violation. Secdevops PASS (`docs/security/scans/US-004.md`, finding MEDIUM CSP React Aria et LOW drei tracés dans « Dette et suivi issus de US-004 »). E2E rejoués sur `main` : 40/40 deux fois. **Réserves** : FPS smartphone non vérifié sur un vrai appareil (émulation Pixel 7 à 60 FPS seulement) et Firefox non testé, reportés (US-021, US-022).
Critères d'acceptation :
- [x] Étant donné la scène, quand je fais glisser la souris (clic gauche sur le vide), alors la caméra tourne autour du bureau.
- [x] Quand j'utilise la molette, alors la caméra zoome entre une distance min et max sans traverser le bureau ni passer sous le plateau.
- [x] Quand je fais un clic droit glissé, alors la scène se déplace (pan) dans des limites définies.
- [x] Un bouton "Reset view" restaure la vue par défaut ; des boutons "Top" et "Front" (décision PO) placent la vue de dessus / de face (`aria-pressed` sur la vue active, info-bulle sur chacun, accessibles au clavier).
- [x] Les libellés visibles n'emploient pas de jargon 3D ("orbit", "pan", "mesh") ; une astuce "Drag to turn the view, scroll to zoom, right-drag to move the view" est affichée (masquable).
- [x] Les transitions de caméra (480 ms, courbe `in-out`) sont désactivées sous `prefers-reduced-motion` (saut direct à la vue).
- [x] Le rendu est de type « photo produit en studio » (fond clair continu, éclairage doux, ombres de contact douces) ; les tokens `--scene-*` donnent un studio clair en thème clair et anthracite en thème sombre.
- [x] Le rendu tient ≥ 60 FPS sur desktop milieu de gamme avec une scène vide et un bureau, à 1366×768 minimum. Unités : mètre, origine au sol. *(Mesuré à 60 FPS sur GPU matériel RTX 5070 à 1366 et 1920 ; pas de mesure sur GPU milieu de gamme ni sur vrai smartphone.)*
- [x] Les entrées utilisent les Pointer Events (préparation du tactile, US-021).

Critères UX testables (source : `docs/design/ux/stories/US-004.md` §7) :
- [x] UX-1 Au chargement, "Loading 3D scene…" est visible avec `role="progressbar"` ; à la fin, "3D view ready. Desk 140 by 70 cm." est annoncé dans la zone `aria-live="polite"` et le canvas occupe la même place sans décalage de mise en page.
- [x] UX-2 La barre de vue (`role="toolbar"`, `aria-label="View"`) affiche, avec libellés visibles et icônes, "Reset view", "Top", "Front" ; chaque bouton mesure ≥ 32 px de haut (jamais < 24 px) et sa zone de clic est séparée de ≥ 8 px de la suivante.
- [x] UX-3 Tab atteint dans l'ordre : scène → Reset view → Top → Front → "Got it" → "Hide tip" ; aucun piège clavier ; l'anneau de focus est visible (contraste ≥ 3:1) sur fond clair et sombre, et n'est pas masqué par l'astuce.
- [x] UX-4 *(livré : ~400 ms au survol, immédiate au focus clavier ; maquette et design-system à aligner, voir US-005)* Chaque bouton de vue affiche une info-bulle après ~400 ms au survol **et** au focus clavier ("Reset view (0)", "View from above (1)", "View from the front (2)") ; Échap la ferme sans quitter le focus.
- [x] UX-5 Après clic ou Entrée/Espace sur Top, `aria-pressed="true"` sur Top uniquement, coche + contour visibles (pas la couleur seule) ; annonce "Top view." ; après un glisser, un zoom ou Reset view, plus aucun bouton n'est pressé.
- [x] UX-6 Reset view ramène exactement la vue par défaut depuis n'importe quelle vue, y compris après des limites atteintes ; Top montre le plateau entier, à plat, bord arrière en haut ; Front montre le bureau entier de face.
- [x] UX-7 Clic gauche glissé sur le vide tourne la vue ; molette zoome ; clic droit glissé déplace la vue, sans menu contextuel du navigateur ; la vue ne passe jamais sous le plateau/sol ; le zoom ne traverse jamais le bureau ; au zoom max (éloigné) le bureau reste visible et le déplacement ne le sort jamais complètement du cadre.
- [x] UX-8 Au clavier, viewport focalisé : flèches tournent (15° gauche/droite, 10° haut/bas), + / - zooment (pas de 10 %), Maj+flèches déplacent, 0/1/2 activent Reset/Top/Front ; ces touches n'agissent pas hors du viewport ; une annonce unique est émise après 600 ms d'inactivité, aucune pendant un glisser souris.
- [x] UX-9 Une transition de vue dure 480 ms (courbe `in-out`) ; une action de l'utilisateur pendant la transition l'interrompt sans à-coup.
- [x] UX-10 Avec `prefers-reduced-motion: reduce`, Reset/Top/Front sautent à la vue sans animation, sans inertie ; la barre de chargement est statique.
- [x] UX-11 L'astuce "Drag to turn the view, scroll to zoom, right-drag to move the view." est visible à la première visite ; "Got it" ou "Hide tip" la masque, le focus passe sur Reset view, et elle ne réapparaît pas après rechargement (préférence locale).
- [x] UX-12 Barre et astuce sont en verre ≥ 86 % d'opacité avec repli opaque (sans `backdrop-filter`, avec `prefers-reduced-transparency`) ; texte ≥ 4,5:1 et icônes ≥ 3:1 sur studio clair et sombre ; texte ≥ 14 px.
- [x] UX-13 Si WebGL 2 est indisponible, le message "The 3D view can't start" (`role="alert"`, focus sur le titre) et "Try again" remplacent la scène ; aucune barre de vue ; aucune exception non gérée en console ; "Try again" relance l'initialisation. Contexte perdu : "The 3D view stopped".
- [x] UX-14 L'interface de la scène reste utilisable à 200 % de zoom navigateur et à 1366×768 : la barre ne recouvre pas le bureau au cadrage par défaut ; l'astuce reste lisible sans masquer la barre.
- [x] UX-15 Aucun libellé visible, info-bulle ou annonce ne contient "orbit", "pan", "mesh" ou "camera".

Décisions UX **VALIDÉES par le PO le 2026-10-19** :
- Astuce masquée : reste masquée définitivement tant que Help (US-025) n'existe pas ; rouvrable via Help en US-025.
- Raccourcis 0 / 1 / 2 pour Reset / Top / Front : acceptés, actifs seulement quand la scène a le focus (WCAG 2.1.4).
- Message WebGL indisponible : texte neutre, **sans nom d'application** (ni « Deskfit » ni autre) ; texte isolé dans les fichiers i18n.

Notes techniques / dépendances : graphics-engineer + technical-artist ; ux-designer/ui-designer pour la barre flottante de scène. Dépend de US-001, US-003. Références : maquette `docs/design/ui/maquettes/index.html` (barre de scène), `docs/design/3d/apercu/index.html`, `docs/design/3d/direction-artistique.md` §3 et §10, wireframe W2.
Références de design US-004 : UX `docs/design/ux/stories/US-004.md` ; maquette `docs/design/ui/maquettes/US-004.html` (**section 7 = consignes developer**, `docs/design/ui/design-system.md` §14) ; paramètres de scène `assets/catalog/scene/studio.json` ; spécification 3D `docs/design/3d/US-004-scene.md` (transition caméra 480 ms, cible (0 ; 0,72 ; 0), caméra jamais sous Y = 0,9 m ni dans le bureau).

### US-005 — Shell de l'application en anglais  [UI] [Must | 8 pts]
> **Réestimée de 5 à 8 pts le 2026-10-20** (décision 32) : la direction v0.4 « Natif · Premium · Précis » ajoute la fenêtre macOS (barre d'outils unifiée, barre latérale, inspecteur), le repli iPadOS/iOS, 4 matériaux translucides, l'échelle typographique Apple en Inter et le restylage de la barre de vue, de l'astuce et des écrans de US-004. **Les critères « panneaux flottants », « verre 86 % » et « 758 px » ci-dessous sont remplacés par ceux de la rubrique v0.4** (le critère v0.4 prime en cas de conflit). Redécoupage envisageable si le developer le demande (ex. restylage de US-004 en story à part).
En tant qu'utilisateur, je veux une interface claire en anglais (zone 3D, panneau d'objets, panneau de propriétés, alertes) afin de m'y repérer sans aide.
Critères d'acceptation :
- [ ] Étant donné l'app, quand elle se charge, alors la mise en page (wireframe W2) affiche la scène plein viewport avec top bar, panneau gauche (onglets Desk / Objects), panneau droit (Properties puis Alerts) et astuce en pied, en panneaux flottants ; les deux panneaux latéraux sont repliables.
- [ ] Tous les textes visibles sont en anglais et proviennent des fichiers i18n (aucun texte en dur dans les composants) ; `lang="en"` sur le document ; la structure permet d'ajouter une langue plus tard.
- [ ] *(garde-fou i18n, revue US-003)* Le lint détecte aussi le texte en dur dans un ternaire, une expression logique (`&&`, `||`, `??`) et une concaténation : soit en adoptant `eslint-plugin-i18next/no-literal-string` (modes `jsx-text-only` + `jsx-attributes`), soit en étendant le sélecteur natif d'ADR-APP-10 aux `ConditionalExpression`, `LogicalExpression` et `BinaryExpression` ; cas couverts par `tests/unit/lint-rules.test.ts`.
- [ ] Les composants respectent le design system (tokens générés depuis `docs/design/ui/tokens.css`, aucune couleur/taille en dur) et l'accessibilité WCAG 2.2 AA (contraste 4,5:1 texte / 3:1 éléments, focus visible non masqué, libellés, cibles ≥ 32 px, texte ≥ 14 px, reflow à 200 % de zoom, mise en page valide dès 1366×768).
- [ ] Effet de verre : panneaux et barres flottants utilisent le verre à **86 % d'opacité minimum** (flou 24 px) ; fond **opaque de repli** (sans flou) quand `backdrop-filter` n'est pas supporté, quand `prefers-reduced-transparency: reduce`, ou quand la classe `.no-glass` est posée (option "Reduce transparency", voir US-025) ; l'interface reste identique, seul le flou disparaît. Les contrastes AA sont tenus sur le pire fond possible.
- [ ] `prefers-reduced-motion: reduce` neutralise animations et transitions (durées à 0, pas d'effet d'appui, barre de chargement statique).
- [ ] Le thème par défaut suit le système (`prefers-color-scheme`) ; thèmes clair et sombre fonctionnels.
- [ ] Ordre de tabulation : top bar → panneau gauche → scène → panneau droit ; liens "Skip to 3D view" et "Skip to alerts" en tête.
- [ ] **Inter auto-hébergée** : fichier `public/fonts/inter-latin-wght-normal.woff2` servi en same-origin (`font-src 'self'`, aucune requête tierce), `@font-face` avec `font-display: swap` et repli système, précharge dans `index.html` ; **licence SIL OFL 1.1 consignée** (`public/fonts/OFL.txt` + entrée dans `docs/design/3d/licences-assets.md`/`THIRD_PARTY_LICENSES`). Icônes Lucide (ISC, licence conservée) ; aucune police ni icône Apple.
- [ ] Les états vide, chargement ("Loading 3D scene…", barre `role="progressbar"`, shell visible) et erreur / navigateur sans WebGL (W11) sont définis.
- [ ] Le nom affiché « Deskfit » (`app.name` = "Deskfit", décision PO 29) est un mot-symbole texte (pas d'asset logo) ; titre de page « Deskfit - Plan your desk setup ».
- [ ] *(suivi US-004, ux-designer ; texte validé par le PO)* L'état `failed` de la scène (hors WebGL indisponible) affiche le texte neutre : titre « The 3D view didn't load », corps « Something went wrong while starting it. Try again. If the problem continues, reload this page. », bouton "Try again", puis bouton "Reload page" **à partir du 2e échec consécutif** ; texte dans les fichiers i18n, test du texte exact et du `role="alert"`.
- [ ] *(décisions PO 29, périmètre du shell)* Undo / Redo **ne sont pas rendus** jusqu'à US-019 (aucun bouton mort) ; le verdict vide affiche « Nothing to check yet » ; l'onglet "Objects" est visible avec l'état vide « No objects to add yet / The object library will appear here. » ; File, Help, "Saved in this browser" et "Alert settings" ne sont pas rendus.
- [ ] *(messages d'import, dette US-003, rattachés à US-018)* `tooLarge` reste « This file is too large (1 MB max). Choose another file. » ; `tooManyObjects` devient « This setup has too many objects (50 max). Choose another file. » (UX-23, à vérifier dans US-018).
- [ ] **Critères UX testables (ux-designer, `docs/design/ux/stories/US-005.md` §7, UX-1 à UX-22 ; UX-23 → US-018)** :
  - UX-1 À 1366×768 : scène plein viewport, top bar 56 px, deux panneaux flottants (248 et 312 px, marges 12 px), aucune barre de défilement de page ; chaque panneau défile en interne.
  - UX-2 Le `role="status"` « Nothing to check yet » est visible en haut à droite, de 320 à 1920 px CSS, panneaux repliés ou non, tiroir ouvert ou non, dans tous les états de la scène ; jamais icône seule ni rogné.
  - UX-3 Exactement un `banner`, un `main`, deux `complementary` nommés ("Desk and objects", "Properties and alerts"), un `h1`, pas de saut de niveau ; `lang="en"` ; titre de page défini.
  - UX-4 Les deux skip links sont les deux premiers arrêts de Tab, invisibles hors focus, non masqués au focus ; "Skip to 3D view" focalise le viewport ; "Skip to alerts" ouvre le panneau droit s'il est replié et focalise le titre "Alerts".
  - UX-5 Ordre de Tab : Skip to 3D view, Skip to alerts, bascule gauche, onglet sélectionné, contenu de l'onglet, viewport, Reset view, Top, Front, (Got it, Hide tip), bascule droite ; aucun piège, aucun `tabindex` positif, focus visible ≥ 3:1 jamais masqué. (Undo/Redo absents, décision 29.)
  - UX-6 Chaque bascule : `aria-expanded`, `aria-controls`, nom constant, cible ≥ 40 px ; le focus reste sur la bascule ; contenu replié retiré de Tab et de l'arbre d'accessibilité ; le choix survit au rechargement en mode large.
  - UX-7 Replier/ouvrir un panneau ne déplace ni la caméra ni le dock.
  - UX-8 À 1366×768 panneaux ouverts, après chargement et après "Reset view"/"Top"/"Front", le bureau entier est visible dans la zone libre (758 px) avec une marge ≥ 24 px de chaque côté (exigence graphics-engineer).
  - UX-9 Sous 1024 px CSS (dont 1366×768 à 200 %) : tiroirs fermés au chargement, un seul ouvert à la fois, Échap ferme et renvoie le focus à la bascule, top bar et verdict jamais recouverts ; à 320 px pas de défilement horizontal, aucune commande coupée.
  - UX-10 `tablist`/`tab`/`tabpanel` ; "Desk" sélectionné au chargement ; flèches gauche/droite changent d'onglet ; onglet actif distinct autrement que par la couleur.
  - UX-11 Textes des états vides (Verdict, Properties, Alerts, Objects) conformes au §6 de l'UX, sans lien ni bouton mort.
  - UX-12 Aucun élément "File", "Help", "Alert settings", "Saved…" ni crayon d'édition dans le DOM ; **Undo/Redo absents du DOM** (décision PO 29, à la place de « présents désactivés » de l'UX d'origine).
  - UX-13 Shell visible pendant "Loading 3D scene…" (`role="progressbar"`), panneaux utilisables, CLS ≈ 0 sur la zone de scène.
  - UX-14 État `failed` : titre et corps exacts dans `role="alert"`, focus sur le titre, "Try again" relance l'initialisation ; le texte ne contient ni "browser", "device", "support" ni "WebGL" ; pas de barre de vue ni d'astuce ; aucune exception non gérée.
  - UX-15 "Reload page" absent au 1er échec, présent et fonctionnel dès le 2e échec consécutif, absent pour `unsupported` et `contextLost`.
  - UX-16 `unsupported` et `contextLost` gardent exactement les textes d'US-004 ; `failed` n'affiche jamais le texte `unsupported`.
  - UX-17 Tous les textes viennent de `src/locales/en/` ; aucun libellé ne contient "orbit", "pan", "mesh" ou "camera".
  - UX-18 Verre ≥ 86 % avec repli opaque sans flou (sans `backdrop-filter`, `prefers-reduced-transparency`, `.no-glass`) ; contrastes ≥ 4,5:1 texte et ≥ 3:1 icônes/contours, clair et sombre ; texte ≥ 14 px ; cibles ≥ 32 px ; thème par défaut = système.
  - UX-19 Sous `prefers-reduced-motion: reduce`, repli/ouverture instantanés et barre de chargement statique.
  - UX-20 Info-bulle des bascules immédiate au focus clavier, ~400 ms au survol, Échap la ferme sans quitter le focus.
  - UX-21 Barre de vue et astuce centrées dans la zone libre, jamais sous un panneau à 1366 px, comportement d'US-004 conservé.
  - UX-22 Focus dans un panneau ou la top bar : 0, 1, 2, flèches, + et - ne déplacent pas la caméra.
- [ ] *(suivi US-004, ui-designer)* La maquette `docs/design/ui/maquettes/US-004.html` et `design-system.md` §9 et §14 sont mis à jour : l'info-bulle s'affiche **immédiatement** au focus clavier (le délai ~400 ms ne vaut que pour le survol souris), conformément au comportement livré et à UX-4.
- [ ] *(budget de taille, suivi US-004)* Un budget est fixé et vérifié par `check:bundle` (ou un script dédié) : mesures actuelles = chunk principal 153,8 Ko gz, chunk 3D 266 Ko gz ; le seuil (valeur proposée par le developer et le graphics-engineer, validée par le PO) fait échouer le build en cas de dépassement ; le chunk 3D reste chargé en `lazy()`.
- [ ] **Design v0.4 « Natif · Premium · Précis » (décision PO 32)** — références : `docs/design/ui/design-system.md` v0.4 (§12, §15, §16, §18 impact code), maquettes `US-004.html`, `US-005.html`, `US-006.html` :
  - Fenêtre macOS : barre d'outils unifiée, barre latérale (gauche) et inspecteur (droite) ; repli iPadOS puis iOS ; 4 matériaux translucides avec repli opaque (`.no-glass`, `prefers-reduced-transparency`, sans `backdrop-filter`) ; échelle typographique de type Apple en Inter ; icônes Lucide ; **ni SF Pro, ni SF Symbols, ni logo Apple**.
  - **Bascules des deux volets dans la barre d'outils** (écart UX validé) ; **UX-5 adapté** : l'ordre de Tab place la bascule droite **juste après** la bascule gauche (Skip to 3D view, Skip to alerts, bascule gauche, bascule droite, onglet sélectionné, contenu de l'onglet, viewport, Reset view, Top, Front, (Got it, Hide tip)).
  - **Restylage des écrans de US-004 selon §18** : barre de vue, astuce, états vide / chargement / erreur ; bouton principal en `--color-accent-solid` ; **coche à la place du contour 2 px** pour l'élément actif ; **zone libre de 806 px à 1366** (remplace 758 px dans UX-8/UX-21 et UX-1 : les largeurs des volets suivent §15). Tests E2E et marges de cadrage (≥ 24 px) à ajuster.
  - Contrastes AA vérifiés sur chaque matériau, clair et sombre ; contrôle design contre les maquettes v0.4.
  - La **Liquid Glass** n'est pas dans cette story (voir US-025).
Références de design US-005 : UX `docs/design/ux/stories/US-005.md` ; maquette `docs/design/ui/maquettes/US-005.html` ; `docs/design/ui/design-system.md` §15 (shell), §9 et §14 (mis à jour). Le graphics-engineer ajuste le cadrage à la zone libre (UX-8, marge de vue en pixels).
Notes techniques / dépendances : ux-designer, ui-designer, developer. Dépend de US-001. Références : maquette `docs/design/ui/maquettes/index.html`, `docs/design/ui/design-system.md` §2–§5 et §9, wireframes W2 et W11. Les ESLint `boundaries` et `i18next` arrivent avec cette story (écart ADR consigné).

## Epic C — Bureau

### US-006 — Choisir un bureau dans un catalogue  [UI][3D] [Must | 5 pts]
En tant qu'utilisateur, je veux choisir un bureau parmi des modèles aux dimensions réelles afin de partir de mon vrai mobilier.
Critères d'acceptation :
- [ ] Étant donné le panneau gauche, alors un onglet **"Desk"** (à côté de "Objects", contrôle segmenté, wireframe W3) liste **7 bureaux** du catalogue (`desk.json` v2 et `desk-corner.json`) : rectangulaires 100×60, 120×60, 140×70, 160×80, 180×80 cm ; d'angle 160×140 et 180×160 cm (**orientés à droite pour ce sprint**), sous forme de **lignes** d'une colonne avec vignette, « L × P cm » et nom (cm dans la ligne, cm et mm dans le résumé).
- [ ] Quand je clique une ligne, alors le bureau est appliqué immédiatement (ligne active : contour accent 2 px + coche, pas la couleur seule), il apparaît à l'échelle réelle (1 m = 1 unité) et le choix est annoncé aux lecteurs d'écran. Au clavier, **les flèches appliquent directement le bureau** (pas d'Entrée de validation).
- [ ] Quand je change de bureau, alors les objets déjà posés sont conservés (aucun supprimé ni déplacé ; positions relatives au centre du bureau), les alertes recalculées (point d'appel seulement) et une erreur d'alerte remonte si un objet déborde (règles avec US-014 à US-016 ; test unitaire à ce stade).
- [ ] Le bureau a un plateau et des pieds lisibles ; hauteur standard 720-750 mm par défaut ; bureau par défaut 140×70. Bureau d'angle : générateur de bureau en L (graphics-engineer), empreinte non rectangulaire connue du catalogue.
- [ ] Bornes du catalogue (décision PO 30) : rectangulaire largeur 800–2400, profondeur 500–1000, hauteur 600–1300 mm ; angle 1200–2400 × 1000–2000 mm. Le catalogue est validé par le schéma (`min ≤ défaut ≤ max`) et **le test « a catalog without any desk » de `validate.test.ts` est corrigé** par le developer (les données desk.json v2 et desk-corner.json, commit cd27e44 de la branche, le font échouer).
- [ ] **Ombre de contact allégée** (décision PO 29, ex-marge) : opacité 0,24 ; empreinte = bureau − 200×140 mm, **dérivée du bureau choisi** (pas de valeur fixe) ; le keep-out de la caméra est aussi dérivé du bureau choisi (graphics-engineer).
- [ ] Aucun « Custom size » (US-007), aucune modale (US-020), aucun champ de saisie ni bouton mort n'est présent dans l'onglet à US-006.
- [ ] *(design v0.4, décision PO 32 ; `design-system.md` §16, maquette `US-006.html`)* **La liste des bureaux est un groupe unique avec filets de séparation** (écart UX validé) : lignes sans cartes séparées ni espacement de 8 px entre elles ; **ligne active = coche** (plus de contour accent 2 px). UX-1 (espace ≥ 8 px entre lignes), UX-6 (contour 2 px) et UX-13 à adapter en conséquence : hauteur de ligne ≥ 56 px conservée, filet visible ≥ 3:1 non requis (décoratif), état actif non porté par la couleur seule.
- [ ] **Critères UX testables (ux-designer, `docs/design/ux/stories/US-006.md` §10, UX-1 à UX-17)** :
  - UX-1 Titre « Choose your desk », aide, 7 lignes ; chaque ligne : vignette, « L × P cm », nom ; hauteur ≥ 56 px, espace ≥ 8 px.
  - UX-2 `role="radiogroup"` nommé « Desk model » ; exactement une ligne `aria-checked="true"` en permanence ; un seul arrêt de Tab.
  - UX-3 Au chargement 140×70 actif ; scène et résumé à 140×70 cm (1400×700×740 mm).
  - UX-4 Clic = application immédiate, sans bouton ni confirmation ; recliquer l'actif ne change rien et n'annonce rien.
  - UX-5 Flèches : déplacent le focus et appliquent ; Début/Fin vont à la première/dernière ligne ; Espace applique ; le focus reste sur la ligne.
  - UX-6 Ligne active : contour accent 2 px, coche, fond `accent-subtle`, nom en 600, contour ≥ 3:1 clair et sombre ; anneau de focus 3 px visible sur la ligne active.
  - UX-7 Annonce `aria-live="polite"` « {{name}} selected. {{width}} by {{depth}} cm. » une seule fois, 400 ms après le dernier changement (rafale de 5 flèches comprise) ; aucune annonce si l'actif est recliqué.
  - UX-8 Résumé « Selected » : nom, cm, mm, légende « Width × depth × height », mis à jour avec le choix.
  - UX-9 Vignettes `aria-hidden`, **dessinées en SVG par l'UI** à l'échelle commune ; l'angle se reconnaît à sa forme en L sans la couleur.
  - UX-10 Dimensions de la scène = dimensions de la ligne (1 mm) ; bureau entier visible dans la zone libre avec marge ≥ 24 px après chaque changement à 1366×768 ; orientation conservée ; Top/Front restent actifs.
  - UX-11 Transition de cadrage 480 ms, interruptible ; instantanée sous `prefers-reduced-motion`.
  - UX-12 Liste utilisable pendant le chargement, après `failed` et sans WebGL ; le choix survit à "Try again" ; aucune exception console.
  - UX-13 À 1366×768, 7 bureaux et le résumé : la liste défile dans le panneau si besoin sans défilement horizontal (la hauteur de 6 lignes sans défilement de l'UX d'origine est à réévaluer avec 7 lignes) ; à 200 % et 320 px (tiroir), aucun texte rogné.
  - UX-14 Texte ≥ 14 px ; nom accessible = texte visible ; description = hauteur (« Height 74 cm ») ; cibles ≥ 32 px ; verre ≥ 86 % avec repli opaque.
  - UX-15 Aucun « Custom size », « Use this desk », champ de saisie ou bouton mort.
  - UX-16 Changement avec objets (test unitaire) : aucun objet supprimé, déplacé ni confirmé ; positions relatives au centre ; recalcul des alertes déclenché une fois par changement.
  - UX-17 Textes du §9 de l'UX reproduits depuis `src/locales/en/` ; aucun « preset », « catalog », « mesh », « orbit », « pan », « camera » dans les textes visibles ou annoncés.
- [ ] Au tout premier lancement, le même sélecteur est proposé en modale ("Choose your desk", bouton "Use this desk") si la story US-020 est livrée ; sinon le Studio s'ouvre sur le bureau par défaut (140×70 cm).
Notes techniques / dépendances : technical-artist (catalogue commité sur `feature/US-006-choix-bureau`, cd27e44 : `desk.json` v2, `desk-corner.json`), graphics-engineer (scène, générateur du bureau en L, ombre et keep-out caméra dérivés du bureau), developer (onglet, état, correction de `validate.test.ts`). Dépend de US-004, US-005.
Références de design US-006 : UX `docs/design/ux/stories/US-006.md` ; maquette `docs/design/ui/maquettes/US-006.html` ; `docs/design/ui/design-system.md` §16 ; aperçu 3D `docs/design/3d/apercu-bureaux/` et spécification `docs/design/3d/US-006-bureaux.md`. Wireframe W3 (mis à jour : lignes, pas cartes). À réestimer en cours de sprint si le bureau en L pèse (risque R4).

### US-007 — Dimensions personnalisées du bureau  [UI] [Should | 3 pts]
En tant qu'utilisateur, je veux saisir largeur, profondeur et hauteur de mon bureau afin de refléter exactement le mien.
Critères d'acceptation :
- [ ] Étant donné un bureau sélectionné, quand je déplie "Custom size" (replié par défaut) et saisis des valeurs, alors le bureau est redimensionné en temps réel.
- [ ] Les valeurs hors bornes sont refusées avec un message sous le champ, relié par `aria-describedby`, ex. "Enter a width between X and Y mm." (bornes = celles du catalogue, voir question PO) ; l'ancienne valeur est conservée et le focus revient au champ en erreur.
- [ ] Les champs sont des NumberField avec libellé visible, suffixe "mm", pas 10 mm (Maj 1, Ctrl 100).
- [ ] Les alertes sont recalculées après modification.
Notes techniques / dépendances : dépend de US-006. Wireframes W3 et W7. Bornes (décision PO 30) : rectangulaire 800–2400 × 500–1000 × 600–1300 mm ; **le bureau d'angle n'a pas de "Custom size"** (angle 1200–2400 × 1000–2000 mm, hors saisie), à rouvrir si le PO le demande.

## Epic D — Objets paramétrables

### US-008 — Bibliothèque d'objets paramétrables, lot 1  [3D] [Must | 8 pts]
En tant qu'utilisateur, je veux des écrans, boîtiers PC, claviers, souris et tapis génériques afin de représenter mon matériel principal.
Critères d'acceptation :
- [ ] Étant donné le catalogue, alors 5 types existent : écran, boîtier PC, clavier, souris, tapis, chacun avec dimensions par défaut réalistes (mm) et bornes min/max.
- [ ] L'écran se paramètre par diagonale, ratio (16:9, 16:10, 21:9, 32:9), pied ou non, incurvé ou non ; les dimensions sont calculées. **La diagonale est exprimée et affichée en pouces avec l'équivalent en mm** (ex. "27 in (686 mm)") : seule exception au système métrique (décision PO) ; toutes les autres dimensions restent en mm.
- [ ] Le boîtier PC propose des formats (mini-tour, moyenne tour, grande tour).
- [ ] Le clavier propose des formats (100 %, TKL, 60 %) ; le tapis propose S, M, L, XL, XXL ou dimensions libres.
- [ ] Chaque objet expose une empreinte au sol (footprint) et une hauteur utilisés par les règles d'alerte ; la boîte englobante du mesh généré correspond au footprint (tolérance 1 mm).
- [ ] Chaque modèle respecte le budget (≤ 10k triangles par objet) ; licence/origine consignée si asset externe (aucun au MVP : tout est procédural).
- [ ] *(sécurité)* Les paramètres de tessellation (segments, subdivisions) sont dérivés de valeurs bornées et plafonnés ; un test vérifie le nombre de triangles aux bornes min et max de chaque paramètre (≤ 10k).
Notes techniques / dépendances : technical-artist (catalogue `assets/catalog/object-types/*.json`, matériaux et DA 3D déjà produits), graphics-engineer. Dépend de US-003. Slots matière présents pour R2. Références : `docs/design/3d/assets-mvp.md`, `direction-artistique.md` §2, aperçu `docs/design/3d/apercu/index.html`.

### US-009 — Bibliothèque d'objets paramétrables, lot 2  [3D] [Must | 5 pts]
En tant qu'utilisateur, je veux support manette, bras d'écran, enceintes et lampe afin de compléter mon setup.
Critères d'acceptation :
- [ ] Étant donné le catalogue, alors 4 types supplémentaires existent avec dimensions par défaut et bornes.
- [ ] Le bras d'écran se fixe au bord du bureau (pince) et porte un écran ; son empreinte sur le plateau est réduite à la pince.
- [ ] Les enceintes se paramètrent en taille (compactes, bibliothèque) ; la lampe en hauteur et type (bureau, barre).
- [ ] Même budget de triangles et même contrat (footprint, hauteur) que le lot 1.
- [ ] *(sécurité)* Tessellation plafonnée et test du nombre de triangles aux bornes (≤ 10k) comme en US-008 ; détection de cycle `mount` (bras ↔ écran) en test.
Notes techniques / dépendances : dépend de US-008. Le comportement « écran sur bras » est un cas de la règle d'encombrement (US-015).

## Epic E — Placement et interaction

### US-010 — Ajouter un objet à la scène  [UI][3D] [Must | 3 pts]
En tant qu'utilisateur, je veux ajouter un objet depuis la bibliothèque afin de construire mon setup.
Critères d'acceptation :
- [ ] Étant donné l'onglet "Objects" (W4, sections Essentials / Computer / Accessories, chaque bouton = icône + libellé), quand je clique ou appuie sur Entrée sur un objet, alors il apparaît sur le bureau à une position libre par défaut (ou au centre si aucune).
- [ ] L'objet ajouté est sélectionné automatiquement et l'ajout est annoncé ("Monitor added").
- [ ] État vide guidé : bureau seul → "Add your first object" avec Monitor, Keyboard, Mouse mis en avant.
- [ ] Le nombre d'objets est limité à 50 avec message explicite au-delà (erreur sous la bibliothèque).
Notes techniques / dépendances : dépend de US-005, US-008. Wireframe W4.

### US-011 — Panneau de propriétés de l'objet  [UI] [Must | 5 pts]
En tant qu'utilisateur, je veux modifier les dimensions et paramètres d'un objet sélectionné afin de correspondre à mon produit réel.
Critères d'acceptation :
- [ ] Étant donné un objet sélectionné, alors le panneau (W5) affiche ses paramètres, sa position X/Y, sa rotation et sa taille en mm ; pour un écran, la diagonale est saisie en pouces avec l'équivalent mm affiché.
- [ ] Quand je modifie une valeur valide, alors l'objet est mis à jour dans la scène en temps réel.
- [ ] Une valeur hors bornes est refusée avec un message sous le champ ("Enter a … between X and Y mm.") relié par `aria-describedby`, l'ancienne valeur est conservée et le focus revient au champ.
- [ ] Les champs X/Y en mm sont l'alternative au glisser (WCAG 2.5.7) ; tous les champs sont utilisables au clavier (pas 10 mm, Maj 1, Ctrl 100) et ont un libellé visible et accessible.
- [ ] Quand rien n'est sélectionné, le panneau affiche les propriétés du bureau (W7).
Notes techniques / dépendances : dépend de US-008, US-010.

### US-012 — Déplacer un objet à la souris  [3D] [Must | 5 pts]
En tant qu'utilisateur, je veux faire glisser un objet sur le bureau afin de tester plusieurs agencements.
Critères d'acceptation :
- [ ] Étant donné un objet, quand je le fais glisser, alors il suit le curseur sur le plan du plateau (axes X/Z) et reste posé à la bonne hauteur ; il ne passe jamais sous le bureau.
- [ ] Pendant le glissement, la caméra n'orbite pas ; des cotes jusqu'aux bords du bureau sont affichées (ex. "120 mm from left edge").
- [ ] **Le magnétisme (grille de 10 mm, bords du bureau) est activé par défaut** ; touche Maj enfoncée = déplacement libre ; un bouton "Snap" dans la barre de scène l'active/désactive (`aria-pressed`).
- [ ] Survol = contour léger ; sélection = contour épais à 2 tons lisible sur studio clair et sombre.
- [ ] La position finale est enregistrée dans l'état du setup (une seule action d'historique par glissement).
- [ ] Le déplacement garde ≥ 60 FPS avec 20 objets.
Notes techniques / dépendances : dépend de US-004, US-010. `core/snap` pur et testé.

### US-013 — Sélectionner, pivoter, dupliquer, supprimer  [UI][3D] [Must | 3 pts]
En tant qu'utilisateur, je veux sélectionner, faire pivoter, dupliquer et supprimer un objet afin d'ajuster mon agencement.
Critères d'acceptation :
- [ ] Quand je clique un objet, alors il est surligné ; clic dans le vide ou Échap, alors désélection.
- [ ] Rotation par pas de 15° (boutons "−15°"/"+15°", touches R / Maj+R) et libre via la poignée.
- [ ] Suppression via bouton et touche Suppr ; duplication via bouton et Ctrl+D, avec léger décalage ; barre contextuelle flottante de scène (W5) avec info-bulles.
- [ ] Clavier : Tab parcourt les objets ; flèches = 10 mm (Maj 1 mm, Ctrl 100 mm) ; raccourcis non actifs dans les champs de saisie.
- [ ] Toutes les actions sont accessibles au clavier et annoncées aux lecteurs d'écran (`aria-live="polite"`, ex. "Monitor moved 10 mm left") ; une liste textuelle "Objects on desk" (nom, position, taille) est disponible.
Notes techniques / dépendances : dépend de US-012. **Note US-004 (UX)** : dès qu'un objet est sélectionné, les flèches déplacent l'objet ; l'orbite clavier de la vue (flèches gauche/droite/haut/bas, Maj+flèches pour déplacer la vue) passe alors en **Alt+flèches** (Alt+Maj+flèches pour déplacer la vue, à confirmer par l'ux-designer). Mettre à jour l'aria-label de la région 3D et les tests clavier de US-004.

## Epic F — Alertes « ça rentre ? »

> **Décision PO** : seules les alertes de niveau **Error** rendent le verdict « Doesn't fit » ; les **Warning** et **Info** sont des conseils ("tips"). Error = débordement, chevauchement, profondeur de bureau insuffisante ; Warning = encombrement > seuil, zone libre insuffisante ; Info = confort.

### US-014 — Détection de débordement du bureau  [3D] [Must | 3 pts]
En tant qu'utilisateur, je veux savoir quand un objet dépasse du bureau afin d'éviter un achat inadapté.
Critères d'acceptation :
- [ ] Étant donné un objet posé, quand son empreinte dépasse le plateau (même partiellement), alors une alerte de niveau **Error** "Overflows by X mm" est produite (côté concerné et valeur).
- [ ] Un objet entièrement dans le plateau ne produit aucune alerte (tests unitaires avec cas limites : rotation, pile au bord).
- [ ] Le bras d'écran à pince est autorisé à toucher le bord (exception documentée).
Notes techniques / dépendances : règle pure `core/fit`, testable hors rendu. Dépend de US-008.

### US-015 — Détection d'encombrement et collisions  [3D] [Must | 5 pts]
En tant qu'utilisateur, je veux être averti quand des objets se chevauchent ou saturent le bureau afin de garder un espace de travail utilisable.
Critères d'acceptation :
- [ ] Quand deux empreintes se chevauchent, alors une alerte **Error** nomme les deux objets et la profondeur de chevauchement.
- [ ] Exceptions explicites : clavier/souris sur tapis, écran sur bras ou sur pied au-dessus d'un tapis (hauteurs compatibles).
- [ ] Si l'occupation de la surface dépasse 70 % (valeur configurable), alors une alerte **Warning** d'encombrement apparaît avec le pourcentage ; elle ne change pas le verdict.
- [ ] Une zone libre minimale devant le clavier (150 mm par défaut, ajustable) est vérifiée ; sinon alerte **Warning**.
- [ ] Les règles sont des fonctions pures avec tests unitaires (≥ 15 cas).
Notes techniques / dépendances : dépend de US-014. Seuils dans un fichier de configuration et dans `alertSettings` du setup (réglables via US-024).

### US-016 — Alertes de profondeur utile  [3D] [Must | 3 pts]
En tant qu'utilisateur, je veux savoir si la profondeur du bureau suffit afin de ne pas être trop près de l'écran ni de manquer de place pour clavier et poignets.
Critères d'acceptation :
- [ ] Quand profondeur du bureau < profondeur écran + profondeur clavier + marge de confort (défaut 100 mm, configurable), alors une alerte **Error** "Insufficient desk depth" indique le manque en mm.
- [ ] Quand la distance entre l'écran et le bord côté utilisateur est inférieure à une valeur recommandée selon la diagonale (valeurs par défaut ajustables, acceptées par le PO), alors une alerte de confort de niveau **Info** ("Tip") s'affiche ; elle ne change pas le verdict.
- [ ] Tests unitaires couvrant les cas limites.
Notes techniques / dépendances : dépend de US-014. Niveaux de gravité Error / Warning / Info (décision PO sur le verdict).

### US-017 — Affichage des alertes  [UI][3D] [Must | 5 pts]
En tant qu'utilisateur, je veux voir clairement les alertes dans l'interface et la scène afin de comprendre quoi corriger.
Critères d'acceptation :
- [ ] Étant donné des alertes, alors le panneau (W6) les liste par gravité (Error, Warning, Tip) avec un texte en anglais actionnable (quoi + combien + que faire, ex. "Monitor overflows the desk by 80 mm on the right. Move it left or choose a smaller monitor.") ; pas de popup ni de son.
- [ ] Clic sur une alerte ("Show"), alors l'objet concerné est sélectionné, mis en évidence et recadré dans la vue sans la bouleverser ; une alerte disparaît d'elle-même quand le problème est corrigé.
- [ ] Les objets en alerte sont surlignés par couleur **et** motif/icône : Error = contour rouge + hachures + pastille icône ; Warning = contour pointillé orange + pastille. Jamais la couleur seule (icône + mot de gravité dans la liste).
- [ ] Un indicateur global permanent en top bar : **"It fits"** (aucune Error, 0 tip), **"It fits · N tips"** (Warning/Info seulement), **"Doesn't fit · N issues"** (au moins une Error) ; la mention "Based on the dimensions you entered" est affichée sous l'indicateur.
- [ ] Les alertes se recalculent en moins de 100 ms après chaque modification (20 objets) et sont annoncées par `aria-live="polite"` (regroupées, 1 annonce max par action).
- [ ] États : vide ("Nothing to check yet. Add an object to see if it fits."), tout va bien ("Everything fits."), problèmes.
Notes techniques / dépendances : dépend de US-014 à US-016, US-005. Wireframes W5 et W6 ; statut sur verre = pastilles à fond opaque (design system §5).

### US-024 — Réglages des alertes (écran « Alert settings »)  [UI] [Must | 2 pts]
En tant qu'utilisateur, je veux ajuster les seuils d'alerte afin d'adapter le verdict à mes habitudes.
Critères d'acceptation :
- [ ] Étant donné le lien "Alert settings" du panneau Alerts, quand je clique, alors une modale opaque (W9) s'ouvre avec trois champs en mm / % : "Maximum desk occupancy" (défaut 70 %), "Comfort margin (depth)" (100 mm), "Free space in front of keyboard" (150 mm), focus piégé, Échap ferme.
- [ ] "Save" enregistre dans `alertSettings` du setup (sauvegardé, annulable), les alertes sont recalculées ; "Cancel" ne change rien ; "Reset to defaults" restaure 70 % / 100 mm / 150 mm.
- [ ] Une valeur hors bornes est refusée avec un message sous le champ et l'ancienne valeur est conservée.
- [ ] Libellés visibles, unités affichées, utilisable au clavier.
Notes techniques / dépendances : developer. Dépend de US-015, US-016, US-005. Décision 7 (seuils par défaut ajustables). Référence : wireframe W9. Option « fonctions avancées à un clic » (progressive disclosure).

## Epic G — Persistance et qualité

### US-018 — Sauvegarde locale et restauration  [UI] [Must | 3 pts]
En tant qu'utilisateur, je veux retrouver mon setup à mon retour afin de ne pas tout refaire.
Critères d'acceptation :
- [ ] Étant donné un setup modifié, alors il est sauvegardé automatiquement dans le navigateur ; l'indicateur "Saved in this browser" (ou "Couldn't save in this browser") est visible en top bar.
- [ ] Au rechargement, le setup est restauré à l'identique (bureau, objets, positions, paramètres).
- [ ] Un menu "File" (W8) propose "New setup", "Import setup…", "Export setup (.json)" ; "New setup" demande confirmation ("Start a new setup?" : Export first / Start new / Cancel) avant de réinitialiser.
- [ ] Une donnée corrompue ou d'une ancienne version est migrée ou ignorée avec un bandeau d'erreur ("We couldn't restore your last setup." + Start new / Import a file), sans planter.
- [ ] Export/import JSON du setup (fichier validé par schéma, confirmation "Replace current setup?", import annulable par Ctrl+Z).
- [ ] *(sécurité)* Fixtures malveillantes dans `tests/fixtures/setups/malicious/` (> 1 Mio, `__proto__`/`constructor` à tous les niveaux, 51 objets, `1e308`, chaîne de 1 Mo, `mount` cyclique, clé inconnue contenant du HTML, version future) toutes rejetées sans exception ; fuzzing fast-check « ne lève jamais » ; le message d'erreur n'affiche jamais le contenu du fichier ni de pile ; la relecture sur événement `storage` passe par `parseSetup`.
- [ ] *(sécurité)* L'import de fichier appelle `checkDeclaredSize(file.size)` **avant** `file.text()` (un fichier > 1 Mio n'est jamais lu en mémoire), puis `parseSetup(text, catalog, { declaredBytes: file.size })`.
- [ ] *(dette US-003)* Les messages `tooLarge` (limite 1 Mio, libellé exact) et `tooManyObjects` sont validés par l'ux-designer ; `NO_CONTROL_CHARS` rejette aussi les caractères C1 et bidi dans les noms (test) ; `zod` n'est importable que depuis le point d'entrée prévu dans tout `src/` (règle lint) et un E2E sur le vrai `dist` sous CSP vérifie que le mode jitless est actif.
- [ ] *(UX-23 de US-005, validé par le PO, décision 29)* `src/locales/en/errors.json` contient `tooLarge` = "This file is too large (1 MB max). Choose another file." et `tooManyObjects` = "This setup has too many objects (50 max). Choose another file." ; affichés en `role="alert"`.
Notes techniques / dépendances : dépend de US-003. L'import de fichier est une surface d'attaque (threat model M-01 à M-06).

### US-019 — Annuler / rétablir  [UI] [Should | 3 pts]
En tant qu'utilisateur, je veux annuler et rétablir mes actions afin d'expérimenter sans crainte.
Critères d'acceptation :
- [ ] Ctrl+Z annule la dernière action (ajout, déplacement, paramètre, suppression) ; Ctrl+Y/Ctrl+Maj+Z la rétablit.
- [ ] Un glissement complet compte pour une seule action.
- [ ] Historique de 50 actions minimum ; boutons Undo/Redo visibles en top bar avec états désactivés et info-bulle "Undo Move monitor" ; l'annulation est annoncée aux lecteurs d'écran.
Notes techniques / dépendances : dépend de US-012, US-011. Principe UX : annuler plutôt que confirmer.

### US-020 — Écran d'accueil et démarrage guidé  [UI] [Should | 3 pts]
En tant que nouvel utilisateur, je veux un accueil qui m'explique l'essentiel afin de démarrer sans notice.
Critères d'acceptation :
- [ ] Au premier lancement, la modale Welcome (W1, 640 px, opaque) propose "Start with a desk", "Import a setup" et un guide de 3 étapes ("Pick a desk", "Add objects", "Check it fits") ignorable ("Skip and explore on my own") ; focus initial sur "Start with a desk", Échap = Skip.
- [ ] Le guide ne réapparaît pas après avoir été fermé (préférence mémorisée), mais reste accessible via Help (US-025).
- [ ] Un novice atteint un setup à 3 objets sans aide (test utilisateur avec le PO).
Notes techniques / dépendances : dépend de US-005, US-006, US-025.

### US-025 — Help, thème et préférences d'affichage  [UI] [Must | 2 pts]
En tant qu'utilisateur, je veux une aide et des préférences d'affichage afin d'utiliser l'app confortablement.
Critères d'acceptation :
- [ ] Un bouton "Help" (toujours au même endroit, top bar) ouvre la modale Help (W10) : démarrage (rejouer le guide quand US-020 existe), souris, clavier (flèches 10 mm, R 15°, Ctrl+D, Suppr, Ctrl+Z, Échap).
- [ ] Une option **"Reduce transparency"** (bascule) dans Help applique la classe `.no-glass` (fond opaque, sans flou) en plus de la préférence système `prefers-reduced-transparency` ; le choix est mémorisé (préférences locales) et s'applique sans rechargement.
- [ ] Un choix de thème "System / Light / Dark" (défaut = System) dans Help ; `data-theme` prime sur la préférence système.
- [ ] Modale opaque, focus piégé, Échap ferme, libellés accessibles, AA.
- [ ] *(décision PO 32, optionnel — Should/Could, à arbitrer ; ne change pas les 2 pts tant qu'il n'est pas engagé)* **Apparence « Liquid Glass »** : choix optionnel d'apparence (Standard / Liquid Glass) dans Help, désactivé par défaut, sans effet sur la mise en page, repli sur le matériau standard avec `.no-glass` / `prefers-reduced-transparency` ; exploration : `docs/design/ui/maquettes/explorations/liquid-glass.html`. Si le travail pèse, créer une story dédiée en R2/R3 (« Apparence Liquid Glass », ≈ 3 pts, [UI]).
Notes techniques / dépendances : developer, ui-designer. Dépend de US-005. Référence : wireframe W10, design system §2 et §5. Reçoit la mention de confidentialité de SEC-04.

### US-022 — Budgets de performance et tests E2E de référence  [Must | 3 pts]
En tant qu'équipe, je veux des tests E2E et une mesure de perf automatisés afin de protéger la qualité à chaque story.
Critères d'acceptation :
- [ ] Un scénario E2E (choisir bureau, ajouter 3 objets, déplacer, déclencher une alerte, recharger) passe en CI.
- [ ] Une mesure de FPS est enregistrée sur une scène de 20 objets avec seuil d'échec configurable (viewport minimal 1366×768).
- [ ] Des captures sont archivées comme artefacts.
- [ ] *(sécurité)* L'E2E échoue sur tout événement `securitypolicyviolation` ou erreur console CSP, sur `dist-e2e` servi avec les en-têtes de production.
- [ ] *(suivi US-004, qualité auto)* Bascule automatique du palier de qualité (ADR-3D-08) : si le FPS mesuré reste sous le seuil pendant N secondes, le rendu passe au palier inférieur (pixel ratio, ombres) sans action de l'utilisateur ; test unitaire de la logique de bascule et E2E avec un FPS simulé bas. (Peut être pris par US-021 si le tactile est engagé avant.)
- [ ] *(suivi US-004, fiabilité)* Les tests E2E sont fiables sous la charge de la CI : aucun `waitForTimeout`, aucune attente sur du temps réel (voir SEC-06), et la règle reformulée de `docs/reviews/SEC-03a.md` : référence CI = 10 runs `CI=1` dans l'image Playwright limitée à 4 CPU et 8 Go, 0 échec ; stress local informatif à 50 % des threads ; `--repeat-each=10` sans charge vert.
- [ ] *(suivi US-004, navigateurs)* Le parcours E2E de référence est exécuté aussi sur Firefox (non testé en US-004) ; les écarts sont consignés.
Notes techniques / dépendances : qa-tester + devops. Dépend de US-012, US-017, US-018, SEC-03a (en-têtes). Ossature Playwright déjà présente (`tests/e2e/`).

### US-021 — Utilisation tactile et mobile  [UI] [Could | 5 pts]
En tant qu'utilisateur mobile, je veux manipuler la scène au doigt afin de consulter mon setup sur smartphone.
Critères d'acceptation :
- [ ] Orbite à un doigt, zoom en pincement, déplacement d'un objet au doigt.
- [ ] Mise en page adaptée en largeur 360 px ; ≥ 30 FPS sur smartphone récent.
- [ ] *(suivi US-004)* Le FPS est **mesuré sur un vrai smartphone** (l'émulation Pixel 7 de US-004 à 60 FPS n'en tient pas lieu), modèle et résultat consignés dans le rapport QA.
Notes techniques / dépendances : desktop d'abord (décision PO, min 1366×768), tactile en Could. Pointer events dès US-004.

### US-023 — Capture d'écran du setup  [UI][3D] [Could | 2 pts]
En tant qu'utilisateur, je veux exporter une image de mon setup afin de le montrer à mes proches.
Critères d'acceptation :
- [ ] Un bouton télécharge un PNG de la vue courante sans interface.
- [ ] *(sécurité)* La capture PNG ne contient que le canvas (aucune donnée de l'interface ni métadonnée).
Notes techniques / dépendances : prépare le partage (R6).

**Récapitulatif MVP** : Must 86 pts (US-001 à 006, 008 à 018, 022, 024, 025, SEC-01, 02, 03a, 03b, 05) ; Should 10 pts (US-007, 019, 020, SEC-04) ; Could 9 pts (US-021, 023, SEC-06, hors total). Total MVP : **96 pts** (SEC-03a passée à 2 pts).

---

# Plus tard — vision long terme (stories de haut niveau, à détailler avant leur sprint)

Les ids US-1xx sont provisoires. Estimations indicatives (epic-level) ; toute story > 8 pts sera redécoupée. Les stories de sécurité SEC-1x et suivantes proviennent du threat model (§9, qui donne les menaces couvertes) et conditionnent les stories fonctionnelles de leur release. **Leurs critères d'acceptation font foi ici** (repris de la v1.0 du threat model, commit 304e3f9, adaptés aux décisions PO du 2026-10-19) ; ils seront précisés à la révision du threat model en début de release.

## Option i18n — Langue secondaire française (non engagée)
- US-100 — Traduction française de l'interface via les fichiers i18n existants [UI] ~3 (option, à décider par le PO)

## R2 — Style : couleurs, matières, styles en un clic
- US-101 — Couleur et matière par objet (noir mat, blanc, bois, métal, etc.) [UI][3D] [Should] ~8
- US-102 — Bibliothèque de matériaux PBR optimisés [3D] [Should] ~5
- US-103 — Styles en un clic : all white, all black, coloré, cosy (le style Cosy, plus chaud et plus sombre, est conservé) [UI][3D] [Should] ~8
- US-104 — Aperçu avant/après d'un style [UI] [Could] ~3
- **SEC-10 — Activation encadrée de `'wasm-unsafe-eval'` pour meshopt/KTX2** [Must à la 1re story qui charge un GLB/KTX2 | 1 pt | graphics-engineer + secdevops]
  Critères d'acceptation :
  - [ ] ADR consigné ; décodeurs servis depuis l'origine, versions épinglées, empreinte vérifiée au build.
  - [ ] `'wasm-unsafe-eval'` ajouté à `script-src` dans `config/security-headers.mjs` (source unique, SEC-03a) ; le contrôle CSP de `sec-build-hardening` accepte `'wasm-unsafe-eval'` et refuse toujours `'unsafe-eval'` ; E2E sans violation CSP.
Architecture : slots matière par pièce de modèle, presets de style en données (`assets/catalog/styles/styles.json` existe déjà).

## R3 — Ambiance : lumière, jour/soir, murs
- US-110 — Éclairage réaliste (ombres douces, environnement) [3D] ~8
- US-111 — LED/RGB (bandeaux, rétroéclairage, lampe colorée, animations) [UI][3D] ~8
- US-112 — Cycle jour / soir [UI][3D] ~5
- US-113 — Mur, couleur/texture du mur, sol [UI][3D] ~5
- US-114 — Déco murale (posters, cadres, étagères murales) [UI][3D] ~5
Architecture : pipeline de rendu extensible (post-traitements, budgets qualité par appareil). Spike WebGPU en début de R3.

## R4 — Déco et bibliothèque de modèles libres
- US-120 — Étagères, figurines, plantes, posters [UI][3D] ~8
- US-121 — Bibliothèque de modèles 3D libres (curation, licences, optimisation, Git LFS) [3D] ~8 — **dépend de SEC-11**
- US-122 — Recherche et filtres de la bibliothèque [UI] ~5
- US-123 — Placement sur surfaces autres que le bureau (étagères, sol) [3D] ~5
- **SEC-11 — Ingestion sécurisée des modèles et textures tiers** [Must | 3 pts | technical-artist + secdevops, lié à US-121]
  Critères d'acceptation :
  - [ ] Chaque asset a une provenance (URL source, auteur, licence SPDX, date, SHA-256) dans le registre (`docs/design/3d/licences-assets.md`) ; licences admises : CC0, CC-BY 4.0 (attribution affichée dans l'app) ; tout autre cas refusé en CI.
  - [ ] `gltf-validator` sans erreur ; ré-export `gltf-transform` ; aucune `uri` externe ; budgets respectés.
  - [ ] Jeu de tests avec glTF piégés (uri http, data URI géante, accesseur démesuré) rejetés.
- **SEC-12 — Intégrité du catalogue distant** [Should | 2 pts | R4/R5, seulement si le catalogue sort du bundle]
  Critères d'acceptation :
  - [ ] Manifeste versionné avec SHA-256 par fichier, vérifié avant usage ; servi depuis l'origine ; validation par schéma ; CSP inchangée ou ADR.
- Revue du threat model au début de R4.

## R5 — Courses et catalogue produits
- US-130 — Catalogue de vrais produits neutre vis-à-vis des marques (dimensions réelles) [UI] ~8
- US-131 — Liste de courses avec prix total [UI] ~5
- US-132 — Remplacer un objet générique par un produit réel [UI][3D] ~5
- US-133 — Mise à jour des prix et données produits (source à définir) ~8
- **SEC-20 — Liens sortants et affiliation sûrs et transparents** [Must | 3 pts]
  Critères d'acceptation :
  - [ ] Le setup ne contient que `productId` ; toute URL vient du catalogue de confiance, `https:` et domaine en liste blanche (rejet sinon, testé).
  - [ ] Liens rendus avec `rel="noopener noreferrer sponsored"` ; aucun endpoint de redirection prenant une URL.
  - [ ] Mention « affiliate links » visible ; aucun script ni pixel tiers ; page « Privacy » (SEC-04) mise à jour.
  Notes : soumise à la question d'affiliation du PO ; sans affiliation, retirer `sponsored` et la mention.
- **SEC-21 — Intégrité et fraîcheur des données produits et prix** [Should | 3 pts]
  Critères d'acceptation :
  - [ ] Source et date affichées ; prix masqué au-delà d'un âge configurable.
  - [ ] Secrets marchands uniquement côté serveur ; récupération limitée à une liste blanche d'hôtes (anti-SSRF).
- Revue du threat model au début de R5.

## R6 — Comptes, partage, communauté
- US-140 — Comptes utilisateurs et sauvegarde cloud [UI] ~8
- US-141 — Partage d'un setup par lien [UI] ~5
- US-142 — Galerie d'inspiration communautaire [UI] ~8
- US-143 — Modération et signalement ~5
- **SEC-30 — Révision du threat model et ADR de backend sécurisé** [Must, avant toute story de compte | 2 pts | secdevops]
  Critères d'acceptation :
  - [ ] Spike backend (Supabase ou API maison) évalué par secdevops : auth, RLS/autorisation, secrets, journalisation, localisation des données (question PO : hébergement UE), coût. ADR consigné.
  - [ ] Threat model révisé pour R6 (menaces L-30 à L-42).
- **SEC-31 — Authentification et sessions sécurisées** [Must | 5 pts]
  Critères d'acceptation :
  - [ ] Fournisseur managé ; passkeys/OAuth ; mots de passe ≥ 12 caractères vérifiés contre les fuites ; MFA disponible, obligatoire pour les admins.
  - [ ] Sessions en cookies `HttpOnly; Secure; SameSite=Lax` (ou jeton en mémoire + refresh rotatif), aucun jeton dans `localStorage` ; la déconnexion révoque la session ; protection CSRF et CORS en liste blanche.
  - [ ] Rate limiting sur connexion/inscription/réinitialisation ; messages non énumérants.
- **SEC-32 — Autorisation des setups et des liens de partage** [Must | 3 pts]
  Critères d'acceptation :
  - [ ] Refus par défaut ; suite de tests automatisés A/B/anonyme sur chaque ressource ; clé privilégiée jamais côté client.
  - [ ] Identifiants de partage aléatoires ≥ 128 bits, setups privés par défaut, liens révocables.
- **SEC-33 — Conformité RGPD** [Must | 5 pts | PO + secdevops + developer] (dépend des questions PO : âge minimum, hébergement UE)
  Critères d'acceptation :
  - [ ] Registre des traitements, politique de confidentialité, CGU, âge minimum (selon décision PO).
  - [ ] Export et suppression du compte en self-service ; durées de conservation appliquées.
  - [ ] DPA des sous-traitants ; procédure de notification de violation (72 h).
- **SEC-34 — Sécurité des contenus partagés (UGC) et modération** [Must | 5 pts | lié à US-142/US-143]
  Critères d'acceptation :
  - [ ] Validation serveur par `parseSetup` partagé ; texte brut uniquement ; méta OG échappées ; tests de XSS stockée.
  - [ ] Images ré-encodées sans métadonnées, servies depuis une origine dédiée ; limite de taille après décompression pour les partages par fragment d'URL.
  - [ ] Signalement, retrait et motivation des décisions (DSA).
- **SEC-35 — Anti-abus et maîtrise des coûts** [Must | 3 pts]
  Critères d'acceptation :
  - [ ] Rate limiting et quotas par compte/IP ; alertes budgétaires.
  - [ ] CAPTCHA seulement si nécessaire, impact CSP/RGPD consigné dans un ADR.
- **SEC-36 — Journalisation de sécurité, supervision et réponse à incident** [Must | 3 pts]
  Critères d'acceptation :
  - [ ] Journal d'audit des actions sensibles ; logs sans secret ni jeton.
  - [ ] Alertes (pics d'échecs de connexion, erreurs d'autorisation) ; runbook de réponse à incident.
- **SEC-37 — Domaine personnalisé sécurisé** [Should | 1 pt, seulement si le PO choisit un domaine ; aucun domaine pour l'instant]
  Critères d'acceptation :
  - [ ] DNSSEC, enregistrement CAA, verrou registrar + MFA sur le compte registrar.
  - [ ] HSTS `includeSubDomains` ; procédure anti sous-domaine orphelin (supprimer les CNAME avant le projet Pages).
- Dépendances : US-140 à US-143 dépendent de SEC-30 à SEC-36.

## R7 — Import d'objets personnels
- US-150 — Spike : faisabilité photo vers 3D par IA (coût, qualité) ~3
- US-151 — Import photo vers objet 3D [UI][3D] ~8 — **dépend de SEC-40 à SEC-42**
- US-152 — Calage des dimensions réelles d'un objet importé [UI][3D] ~5
- **SEC-40 — Upload sécurisé et traitement isolé (photos, glTF)** [Must | 5 pts]
  Critères d'acceptation :
  - [ ] Taille et type vérifiés (octets magiques) côté client et serveur ; SVG refusé.
  - [ ] Ré-encodage dans un bac à sable sans réseau avec limites de ressources ; conversion GLB.
  - [ ] Contenus servis depuis une origine dédiée avec `nosniff` et `Content-Disposition` ; pas d'import par URL (ou proxy à liste blanche).
- **SEC-41 — IA côté serveur : clé, quotas et coûts** [Must | 3 pts]
  Critères d'acceptation :
  - [ ] Clé uniquement dans un secret manager côté serveur ; authentification requise.
  - [ ] Quota par utilisateur et plafond global avec alerte ; sortie du modèle validée par schéma.
- **SEC-42 — Confidentialité des photos** [Must | 3 pts] (dépend de la question PO : hébergement UE)
  Critères d'acceptation :
  - [ ] EXIF supprimés avant envoi ; consentement explicite.
  - [ ] Photo source supprimée après génération ; DPA fournisseur sans entraînement sur les données ; information dans la politique de confidentialité.
Prérequis : threat model upload, quotas.

## R8 — Réalité augmentée mobile
- US-160 — Spike WebXR / alternatives ~3
- US-161 — Affichage du setup en AR à l'échelle réelle [UI][3D] ~8
- **SEC-50 — AR à permissions minimales** [Should | 1 pt]
  Critères d'acceptation :
  - [ ] Pas de `camera-access` ; `Permissions-Policy: xr-spatial-tracking=(self)` (dans `config/security-headers.mjs`) ; aucune donnée spatiale transmise.
  - [ ] CSP et en-têtes revus (contrôle `sec-build-hardening` mis à jour).

---

# Décisions du PO (2026-10-19) — toutes validées

## Périmètre produit (kickoff)
1. **Compte utilisateur au MVP :** non, aucun compte, aucun backend. Validé par le PO (2026-10-19).
2. **Mobile au MVP :** desktop d'abord, tactile en « Could » (US-021), mise en page responsive minimale. Validé par le PO (2026-10-19).
3. **Sauvegarde :** locale dans le navigateur, avec export/import JSON, pas de cloud. Validé par le PO (2026-10-19).
4. **Unités affichées :** millimètres et centimètres, système métrique uniquement. **Une seule exception : la diagonale d'écran (voir décision 8).** Validé par le PO (2026-10-19).
5. **Réalisme visuel du MVP :** objets génériques simples, détails minimaux, avant les matières de R2. Validé par le PO (2026-10-19).
6. **Langue de l'interface :** anglais. Le français pourra être ajouté comme langue secondaire plus tard (option US-100, non engagée).
7. **Seuils d'alerte par défaut** (70 % d'occupation, 100 mm de marge de profondeur, 150 mm de zone libre devant le clavier) : acceptés comme valeurs par défaut ajustables (US-024).

## UX (validées le 2026-10-19)
8. **Verdict** : seules les alertes **Error** rendent « Doesn't fit » ; les Warning (et Info) sont des conseils ("It fits · N tips"). → US-014 à US-017.
9. **Diagonale d'écran en pouces** avec l'équivalent en mm affiché ; seule exception au système métrique. → US-008, US-011.
10. **Vues "Top" et "Front"** en plus de "Reset view". → US-004.
11. **Magnétisme aux bords activé par défaut**, Maj = déplacement libre. → US-012.
12. **Taille d'écran minimale supportée : 1366×768** (desktop). → US-004, US-005, US-022.
13. **Personas validés** (`docs/design/ux/personas.md`).

## Opérations (validées le 2026-10-19)
14. **GitHub + Cloudflare Pages**, **dépôt public**, **pas de domaine personnalisé** (`*.pages.dev`). → US-001, SEC-02, SEC-03a, SEC-03b ; SEC-37 reste en « Plus tard ». Aucun push ni déploiement sans ordre explicite du PO.

## Style (validées le 2026-10-19)
15. **Direction visuelle inspirée du langage visuel d'Apple sans rien copier de protégé** : Inter auto-hébergée + Lucide ; pas de SF Pro, SF Symbols, logo ni mise en page Apple. → US-005.
16. **Verre à 86 % d'opacité minimum** avec repli opaque. → US-005.
17. **Option "Reduce transparency" dans Help**, en plus de la préférence système `prefers-reduced-transparency`. → US-025.
18. **Style « Cosy » plus chaud et plus sombre conservé** (R2, US-103).
19. **Nom provisoire « Deskfit »**.
20. **Thème par défaut = système** (clair/sombre). → US-005, US-025.
21. **Rendu 3D « photo produit en studio »**. → US-004.

## Fin du Sprint 1 (validées le 2026-10-20)
22. **Sprint 1 validé** par le PO.
23. **Dépôt GitHub public** sur le compte personnel du PO (le privé bloquerait CodeQL, SARIF, dependency-review et la protection de branche en plan gratuit). Le PO crée le dépôt vide et donne l'URL. Premier push après SEC-03a et MFA activée (threat model §14). → SEC-02, SEC-03a.
24. **E-mail professionnel jamais utilisé.** Avant le premier push : historique réécrit avec l'adresse noreply GitHub du PO, `user.email` configuré localement. Condition bloquante.
25. **Docker autorisé** pour Semgrep.
26. **Ombre de contact à alléger** (avec le technical-artist). → US-004 / DA 3D.
27. **Texte neutre de l'état `failed`** accepté. → US-005.
28. **Sprint 2 accepté** : SEC-03a, US-005, US-006, SEC-02 (+ marge SEC-06 ou SEC-03b). **MVP à 96 points** confirmé.

## Design du Sprint 2 (validé le 2026-10-20)
29. **Shell (US-005)** : Undo/Redo masqués jusqu'à US-019 ; verdict vide « Nothing to check yet » ; onglet Objects visible avec état vide ; nom affiché « Deskfit » ; texte `failed` neutre avec « Reload page » au 2e échec ; `tooManyObjects` reformulé ; `tooLarge` gardé en « 1 MB ». → US-005, US-018.
30. **Bureaux (US-006)** : catalogue de 7 bureaux (5 rectangulaires 100×60, 120×60, 140×70, 160×80, 180×80 ; 2 d'angle 160×140 et 180×160) ; angle orienté à droite ce sprint et sans « Custom size » ; flèches du clavier appliquent directement le bureau ; vignettes SVG dessinées par l'UI ; bornes rect 800–2400 × 500–1000 × 600–1300 mm, angle 1200–2400 × 1000–2000 mm. → US-006, US-007.
31. **Ombre de contact allégée** : opacité 0,24, empreinte = bureau − 200×140 mm, dérivée du bureau ; keep-out de la caméra dérivé du bureau. → US-006 (et non US-008).

## Design natif et workflow (validé le 2026-10-20)
32. **Design « app native Apple premium » v0.4 « Natif · Premium · Précis » VALIDÉ** (le v0.3 ne convenait pas) : fenêtre macOS (barre d'outils unifiée, barre latérale, inspecteur), repli iPadOS et iOS, 4 matériaux translucides, échelle typographique Apple avec Inter, Lucide ; toujours sans SF Pro, SF Symbols ni logo Apple. Écarts UX validés : bascules de volets dans la barre d'outils (Tab : droite juste après gauche) ; liste des bureaux en groupe unique avec filets. **US-005 réestimée à 8 pts** (restylage de US-004 inclus). → US-005, US-006.
33. **Liquid Glass** : apparence optionnelle plus tard, rattachée à US-025 (ou story R2/R3) ; exploration `docs/design/ui/maquettes/explorations/liquid-glass.html`. → US-025.
34. **Ordre produit inchangé** : le MVP reste sur « ça rentre ? » ; le design suit en R2 (styles, matières), R3 (ambiance), R4 (modèles 3D libres CC0/CC-BY). Blender servira en R4 (préparation des modèles) ; **le PO sera prévenu avant**.
35. **Workflow GitHub** : chaque story = branche poussée + **Pull Request ouverte par le devops** (description : story, critères, liens vers les rapports de revue / design / QA / sécurité) ; la CI tourne sur la PR ; **merge via la PR (commit de merge)**.
36. **Jamais versionnés** : `.claude/`, `CLAUDE.md`, `LISEZMOI-EQUIPE.md` (purge de l'historique et force-push de `main` en cours). Premier push fait ; première CI : 12 jobs verts, e2e rouge (timeouts du runner, correction par le qa-tester sur `fix/ci-e2e-runner-timeouts`).

## Questions encore ouvertes (long terme, non bloquantes)
- Affiliation compatible avec la neutralité de la marque (R5, threat model §12 q.1).
- Âge minimum des comptes (R6, §12 q.2).
- Hébergement des données dans l'UE (R6/R7, §12 q.3).
