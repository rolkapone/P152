# Threat model — P152

> Story : US-002 (threat model initial). Auteur : secdevops. **Version 1.4 du 2026-10-31** (v1.0 produite au kickoff ; historique en §13).
> Entrées : [`docs/vision.md`](../vision.md) v0.2, [`docs/backlog.md`](../backlog.md), [`docs/architecture/index.md`](../architecture/index.md) (ADR-3D-02/03/04/09, ADR-APP-03/04/08/09, section « Sécurité transverse », ADR-OPS-01 à 07 et « Décisions du PO »), scan de US-001 [`scans/US-001.md`](scans/US-001.md), exécution locale de la CI [`docs/ci/local-run-US-001.md`](../ci/local-run-US-001.md), workflows réels [`.github/workflows/`](../../.github/workflows/).
> Contexte : SPA statique React/Vite/three.js, sans backend ni compte au MVP. **Décisions PO (2026-10-19)** : code sur GitHub, **dépôt public** ; app sur **Cloudflare Pages**, **sans domaine personnalisé** (`*.pages.dev`) ; **aucun dépôt distant ni push au Sprint 1** : la CI est vérifiée **en local** avec les mêmes commandes que les jobs ; aucun déploiement sans ordre du PO.
> Méthode : actifs → acteurs → frontières de confiance → flux → STRIDE par composant → mesures → exigences et stories.
> Contrôles CI : spécification et état réel dans [`ci-security.md`](ci-security.md).
> **Révisions obligatoires** : avant le premier push (Sprint 2, vérification de la §14), avant le premier déploiement public (SEC-05), au début de R4 (assets tiers), R5 (liens/affiliation), R6 (comptes, avant tout choix de backend), R7 (upload/IA), R8 (AR), et à chaque ajout d'un domaine dans la CSP.


## Sommaire
Fichiers : **ce fichier** (MVP : §1 à §6, §8, §9 MVP, §11, §12, §14) ; [threat-model-long-terme.md](threat-model-long-terme.md) (§7 STRIDE R2 à R8, §9 Plus tard) ; [threat-model-annexes.md](threat-model-annexes.md) (§10 amendements, §13 historique des versions).
1. Périmètre et hypothèses
2. Actifs
3. Acteurs de menace
4. Frontières de confiance et flux de données
5. Échelle de risque
6. STRIDE — MVP
7. STRIDE — vision long terme (R2 à R8) : [threat-model-long-terme.md](threat-model-long-terme.md)
8. Exigences de sécurité (SR) et traçabilité
9. Stories de sécurité (reprises au backlog) : MVP ici, « Plus tard (R2 à R8) » dans [threat-model-long-terme.md](threat-model-long-terme.md)
10. Amendements aux stories existantes : [threat-model-annexes.md](threat-model-annexes.md)
11. Risques acceptés
12. Questions pour le PO
13. Historique des versions : [threat-model-annexes.md](threat-model-annexes.md)
14. Conditions avant le premier push

---

## 1. Périmètre et hypothèses

**Dans le périmètre MVP** : le code servi au navigateur (bundle Vite), le pipeline `parseSetup` (ADR-APP-03), la persistance `localStorage` (ADR-APP-04), l'import/export JSON, le catalogue embarqué (données du technical-artist), les générateurs procéduraux (ADR-3D-03), la chaîne de build (pnpm, npm registry, GitHub Actions), le dépôt public, l'hébergement Cloudflare Pages et ses en-têtes (ADR-OPS-06).

**Hypothèses (à reconfirmer à chaque révision)**
- H-S1 Aucun backend, aucun compte, aucun cookie, aucune requête vers un tiers à l'exécution au MVP (CSP `connect-src 'self'`).
- H-S2 Aucune donnée personnelle collectée par l'éditeur au MVP : les setups restent dans le navigateur de l'utilisateur. Le nom du setup est un texte libre (peut contenir une info personnelle, mais n'est jamais transmis).
- H-S3 Les extensions du navigateur et un poste compromis sont hors périmètre (elles ont un accès total à la page).
- H-S4 Le MVP ne contient aucun binaire d'asset 3D externe (tout est procédural) ; les assets tiers arrivent en R2/R4.
- H-S5 Le dépôt étant public, **le code source n'est pas un secret** : la sécurité ne repose jamais sur l'obscurité (source maps, structure, hooks).
- H-S6 **Pas de domaine personnalisé** : l'app est servie sur `<projet>.pages.dev`. Le TLD `.dev` est dans la liste de préchargement HSTS des navigateurs (HTTPS imposé avant toute requête) ; le DNS appartient à Cloudflare, pas au PO.
- H-S7 **État au Sprint 1** : le dépôt distant n'existe pas, rien n'est poussé ni déployé. Les jobs de sécurité sont **intégrés** dans [`ci.yml`](../../.github/workflows/ci.yml) et vérifiés en local pour ceux qui peuvent l'être, mais les contrôles qui n'existent que sur GitHub (CodeQL, `dependency-review-action`, onglet Code scanning, secret scanning et push protection, rulesets, Dependabot) **ne sont pas actifs**. Les mesures qui en dépendent sont « définies », pas « effectives », jusqu'au premier push (Sprint 2). L'exposition est nulle tant que rien n'est publié.

---

## 2. Actifs

| Id | Actif | Propriété à protéger | Criticité MVP | Criticité long terme |
|---|---|---|---|---|
| A1 | Intégrité du code servi (bundle JS/CSS, `index.html`, `_headers`) | Intégrité | **Haute** : un bundle altéré touche tous les utilisateurs | Haute (+ vol de sessions en R6) |
| A2 | Setups des utilisateurs (localStorage, fichiers exportés) | Disponibilité, intégrité | Moyenne (perte de travail) | Haute en R6 (données de compte) |
| A3 | Disponibilité de l'application (onglet utilisable, site en ligne) | Disponibilité | Basse | Moyenne |
| A4 | Dépôt, workflows CI, artefacts `dist`, tags de release | Intégrité | Haute | Haute |
| A5 | Secrets : `CLOUDFLARE_API_TOKEN` (pas encore créé), comptes GitHub/Cloudflare du PO ; plus tard clés d'API IA, affiliation, base de données | Confidentialité | Haute | Critique |
| A6 | Conformité juridique : licences des dépendances et assets, RGPD, droit de la consommation, DSA | Conformité | Moyenne | Haute |
| A7 | Données du catalogue (dimensions, règles de placement) | Intégrité (décision d'achat) | Basse | Moyenne (R5 : prix) |
| A8 | Comptes, sessions, données personnelles (email, pseudo, IP, photos), contenus UGC | Confidentialité, intégrité | n/a | Critique (R6/R7) |
| A9 | Budget financier : coût IA, stockage, bande passante, revenus d'affiliation | Disponibilité financière | n/a | Haute (R5/R7) |
| A10 | Réputation et confiance (neutralité vis-à-vis des marques) | Intégrité | Basse | Haute (R5) |

---

## 3. Acteurs de menace

| Id | Acteur | Motivation / capacité | Présent dès |
|---|---|---|---|
| T-U | Utilisateur légitime imprudent | Importe un fichier reçu d'un inconnu, poste partagé | MVP |
| T-F | Attaquant distant « fichier piégé » | Diffuse un setup JSON malveillant (forum, Discord, « regarde mon setup ») ; capacité faible à moyenne | MVP |
| T-S | Attaquant supply chain | Paquet npm compromis ou typosquatté, GitHub Action compromise, asset 3D piégé ; capacité élevée, attaques massives et opportunistes (cas réels 2025 : tj-actions/changed-files, vague « Shai-Hulud » sur npm) | MVP |
| T-C | Contributeur externe malveillant | Le dépôt sera public : PR depuis un fork, issues, injection dans les workflows | MVP (dès le premier push) |
| T-A | Agent IA de l'équipe (erreur, pas malveillance) | Commit d'un secret, ajout d'une dépendance inventée ou mal orthographiée (« slopsquatting »), affaiblissement de la CSP ou d'un contrôle CI pour « faire passer » un test | MVP |
| T-H | Attaquant visant les comptes d'infrastructure | Vol d'identifiants GitHub/Cloudflare du PO, jeton CI exfiltré → déploiement d'un bundle malveillant | MVP (dès le premier push / déploiement) |
| T-B | Bots et scrapers | Spam, création de comptes en masse, abus de quotas, scraping du catalogue/prix | R5/R6 |
| T-M | Utilisateur authentifié malveillant | IDOR, XSS stockée via UGC, contenus illicites, harcèlement, abus de l'IA | R6/R7 |
| T-I | Initié privilégié (modérateur, admin) ou compte admin compromis | Accès aux données, suppression, fuite | R6 |
| T-P | Fournisseur tiers (IA, affiliation, flux produits, BaaS) | Fuite, usage des données pour entraînement, panne, données erronées | R5/R7 |

---

## 4. Frontières de confiance et flux de données

### 4.1 MVP

```
 Contributeurs/agents ──(git push, PR)──► [TB5] Dépôt GitHub public ──► GitHub Actions (CI)
                                                    ▲                       │  ▲
 Registre npm, Actions tierces, images ──[TB4]──────┘───────────────────────┘  │ (deps, actions)
                                                                            │ dist/ (artefact testé)
                                                                  [TB6] wrangler + CLOUDFLARE_API_TOKEN
                                                                            ▼
                                                     Cloudflare Pages <projet>.pages.dev (CDN, _headers)
                                                                            │ HTTPS (.dev préchargé HSTS)
                                                                   [TB1]    ▼
 ┌──────────────────────────── Navigateur de l'utilisateur (origine unique) ─────────────────────────────┐
 │  index.html + bundle ─► ui/ ─► state/ (dispatch, reducers purs) ─► render/ (three.js, WebGL/GPU)    │
 │                                  │   ▲                                                                │
 │                                  ▼   │ parseSetup (taille, JSON, enveloppe, migrations, Zod strict,   │
 │                     [TB3] localStorage  sémantique catalogue)                                         │
 │                                      ▲                                                                │
 │   [TB2] Fichier choisi par l'utilisateur (.json) ── File.size ≤ 1 Mio ──┘     export : Blob → download │
 │   [TB2'] événement `storage` d'un autre onglet ──► parseSetup                                          │
 └──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Au Sprint 1, seule la partie « poste local → build » existe : TB5 et TB6 n'ont pas encore de réalité (H-S7).

| Frontière | Côté non fiable → côté fiable | Contrôle principal |
|---|---|---|
| TB1 | CDN/réseau → navigateur | HTTPS (`.dev` préchargé HSTS, en-tête HSTS servi en plus par SEC-03a), CSP stricte, en-têtes versionnés |
| TB2 | Fichier importé → état de l'app | `parseSetup` unique (ADR-APP-03) |
| TB2' | Autre onglet → état | `parseSetup` à la relecture |
| TB3 | `localStorage` → état | `parseSetup` à chaque lecture (donnée traitée comme non fiable) |
| TB4 | Code tiers (npm, Actions, images, assets) → build | lockfile gelé, scripts d'install en liste blanche, `minimumReleaseAge`, SCA, épinglage SHA/digest, revue des nouvelles dépendances |
| TB5 | Contributeurs (forks) → dépôt et CI | `pull_request` uniquement (jamais `pull_request_target`), approbation des workflows de forks, rulesets sur `main`, CODEOWNERS (SEC-02) |
| TB6 | CI → hébergement | déploiement par envoi direct (wrangler) de l'artefact testé, jeton à portée minimale, environnement GitHub protégé, déploiement depuis tag uniquement (SEC-03b) ; l'intégration Git de Cloudflare (build par Cloudflare depuis le dépôt) n'est pas utilisée |

### 4.2 Long terme (ajouts)

| Frontière | Apparaît en | Description |
|---|---|---|
| TB7 | R4/R5 | Catalogue/assets distants → app (intégrité, CSP `connect-src`) |
| TB8 | R5 | App → sites marchands (liens sortants, affiliation) ; backend → flux produits/prix |
| TB9 | R6 | Navigateur → API/BaaS (authN, authZ, validation serveur) |
| TB10 | R6 | Utilisateur A → contenus vus par l'utilisateur B (UGC, galerie, liens de partage) |
| TB11 | R7 | Upload (photo, glTF) → stockage → workers de traitement → fournisseur IA |
| TB12 | R8 | Capteurs de l'appareil (caméra, suivi spatial) → page WebXR |

---

## 5. Échelle de risque

Risque = vraisemblance × impact, avant mesure (« brut ») puis après mesure (« résiduel »).

| | Impact faible | Impact moyen | Impact élevé |
|---|---|---|---|
| **Vraisemblance élevée** | MEDIUM | HIGH | CRITICAL |
| **Vraisemblance moyenne** | LOW | MEDIUM | HIGH |
| **Vraisemblance faible** | LOW | LOW | MEDIUM |

Statut des mesures : **ADR** = décidé dans `docs/architecture/` (un fichier par ADR) ; **CI** = contrôle intégré dans `.github/workflows/` (état détaillé dans `ci-security.md` §1) ; **Story** = travail planifié au backlog (section 9) ; **Amend.** = critère ajouté à une story existante (section 10). Le résiduel indiqué est celui **une fois la mesure en place** ; quand elle dépend d'une story non livrée, la story est citée.

---

## 6. STRIDE — MVP

### 6.1 Import/export JSON et stockage local (TB2, TB2', TB3)

| Id | STRIDE | Menace | Brut | Mesures | Statut | Résiduel |
|---|---|---|---|---|---|---|
| M-01 | D | Fichier énorme ou très imbriqué qui gèle l'onglet (lecture, `JSON.parse`, validation) | LOW | Refus > 1 Mio sur `File.size` avant lecture puis sur la chaîne ; schéma non récursif ; tableau `objects` ≤ 50 ; chaînes bornées | ADR-APP-03, Amend. US-018 | LOW |
| M-02 | T / E | Pollution de prototype : clés `__proto__`, `constructor`, `prototype` dans le JSON, exploitées lors d'une fusion/copie | MEDIUM | Rejet de ces clés partout ; Zod `.strict()` produit de nouveaux objets ; aucune lib de deep-merge sur des données importées ; `extensions` jamais fusionné ni interprété ; fixtures malveillantes + fuzzing fast-check | ADR-APP-03/08, Amend. US-003 (catalogue), US-018 | LOW |
| M-03 | T / I (XSS) | Nom du setup, `label`, chemin d'erreur (nom de clé inconnue renvoyé dans `objects[3].params.<clé>`) rendus comme HTML | HIGH (sans mesure) | Rendu par React uniquement (texte échappé) ; aucun `dangerouslySetInnerHTML`/`innerHTML` (ESLint + Semgrep `p152-dom-html-sink`, `p152-react-dangerously-set-inner-html`, bloquantes) ; chemin d'erreur tronqué et rendu en texte ; aucun champ URL au MVP ; CSP `script-src 'self'` sans `unsafe-inline` en défense en profondeur | ADR-APP-03/05, CI | LOW |
| M-04 | D | Valeurs aberrantes (`1e308`, `NaN`/`Infinity` encodés, bornes catalogue dépassées, `mount` cyclique) : géométrie gigantesque, boucle infinie, perte du contexte WebGL | MEDIUM | Nombres `finite` et bornés ; bornes du catalogue réappliquées (rejet) ; détection de cycles `mount` ; **les paramètres de tessellation (segments, rayons) dérivés de valeurs bornées et plafonnés dans les générateurs** ; gestion de `webglcontextlost` | ADR-APP-03, ADR-3D-03, Amend. US-008/009 | LOW |
| M-05 | I | Message d'erreur qui réaffiche le contenu du fichier ou une pile d'exception | LOW | Code d'erreur + chemin tronqué, jamais de contenu ni de stack (ADR-APP-03) | ADR | LOW |
| M-06 | T | `localStorage` modifié à la main ou corrompu | LOW | Relecture via `parseSetup`, copie `recovered` unique, setup vierge + message | ADR-APP-04 | LOW |
| M-07 | I | Poste partagé : setups lisibles par la personne suivante | LOW | Accepté ; « New setup » réinitialise ; mention dans l'aide (SEC-04) | Story | LOW (accepté) |
| M-08 | D | Quota plein / mode privé : perte de travail | LOW | Indicateur « Couldn't save in this browser », export | ADR-APP-04 | LOW |
| M-09 | T | Nom de fichier d'export dérivé du nom du setup (caractères de chemin, noms réservés Windows) | LOW | Slug `[a-z0-9-]`, 40 caractères max, préfixe fixe | ADR-APP-04 | LOW |
| M-10 | R | Répudiation | n/a | Pas d'action multi-utilisateur au MVP | — | n/a |
| M-31 | T | Préférences d'affichage `p152:v1:pref:*` (astuce, volets) modifiées dans `localStorage` (extension, script de même origine, saisie manuelle) | LOW | Lecture `=== "1"` seulement, aucun parsing, `try/catch` (stockage bloqué, quota), revalidation `=== true` par le store, accès confiné à `src/persistence/` ; impact limité à l'affichage. Vérifié au [scan US-005](scans/US-005.md) | ADR-APP-04, US-005 | LOW |

### 6.2 Application dans le navigateur (code servi, TB1)

| Id | STRIDE | Menace | Brut | Mesures | Statut | Résiduel |
|---|---|---|---|---|---|---|
| M-11 | E | Affaiblissement ou absence de la CSP (une dépendance exige `unsafe-eval`, un agent ajoute `unsafe-inline` pour faire passer un test, premier déploiement sans en-têtes) | MEDIUM | CSP source unique `config/security-headers.mjs` (ADR-OPS-06) sous CODEOWNERS, générant `public/_headers` → `dist/_headers` ; contrôle CI **bloquant** des directives requises et interdites sur `dist/_headers` (aucun avertissement toléré, décision du scan US-001) ; test E2E qui échoue sur `securitypolicyviolation` avec les mêmes en-têtes ; toute relaxation = ADR + validation secdevops (`'wasm-unsafe-eval'` seulement, SEC-10). **État (2026-10-20, scan SEC-03a)** : `config/security-headers.mjs` livré ; le plugin Vite émet directement `dist/_headers` (pas de `public/_headers`) et applique les mêmes en-têtes à `vite preview`/E2E ; `sec-build-hardening` vert en local (HSTS ≥ 1 an contrôlé) ; fixture E2E `cspGuard` sur toutes les specs ; 0 violation au runtime (React Aria `usePress` traité sans `unsafe-inline`, finding US-004 n° 1 clos). Effectif en production à SEC-03b (premier déploiement) | CI, ADR-OPS-06, SEC-03a, SEC-02, Amend. US-022 | LOW (après SEC-03a) |
| M-12 | E / I | Hooks de test `window.__p152test` / `__p152perf` présents en production (API de pilotage exposée, gadget pour une future XSS) | LOW au MVP, MEDIUM en R6 | Garde `import.meta.env.VITE_E2E === "true"` ; build `dist-e2e` (script `build:e2e`) jamais déployé ; double contrôle « symboles `__p152test`, `__p152perf`, `VITE_E2E` absents de `dist` » (`check:bundle` dans le job `build`, grep indépendant dans `sec-build-hardening`) ; Semgrep `p152-test-hook-reference` ; déploiement du seul artefact du job `build` ; `build.sourcemap: false` (sinon le contrôle par grep est faussé). **État** : vérifié en local au scan US-001 (aucune occurrence, aucune source map) | ADR-APP-08, ADR-OPS-06, CI | LOW |
| M-13 | T | Clickjacking / intégration de l'app dans un site tiers | LOW | `frame-ancestors 'none'` | ADR-OPS-06, SEC-03a | LOW |
| M-14 | I | Fuite vers des tiers (CDN, polices Google, analytics) | LOW | Aucune ressource tierce à l'exécution, `connect-src 'self'`, polices auto-hébergées, `Referrer-Policy: no-referrer`, contrôle CI « pas d'URL externe dans `index.html` » (vérifié en local). **État US-005** : Inter auto-hébergée et préchargée en même origine, `font-src` hérite de `default-src 'self'` ; 0 requête externe au runtime | ADR, CI | LOW |
| M-29 | T / E | **Police tierce** (`public/fonts/inter-latin-wght-normal.woff2`) : fichier binaire analysé par le moteur de polices du navigateur ; substitution par un fichier piégé ou non conforme à la licence | LOW | Release officielle `rsms/inter` v4.1, SHA-256 du zip, de la source et du fichier livré consignés dans [`licences-assets.md`](../design/3d/licences-assets.md) et vérifiés par `tests/unit/fonts.test.ts` ; sous-ensemble **reproduit** par secdevops (tables identiques hors `head.modified`) ; assainisseur OTS du navigateur ; même origine uniquement ; OFL 1.1 livrée à côté (`OFL.txt`). Toute nouvelle police : même chaîne + nouveau scan | US-005, M-28 | LOW |
| M-15 | I | Source maps et commentaires en production | LOW | Dépôt public : aucune information nouvelle ; on ne publie pas les source maps pour fiabiliser le contrôle M-12 (contrôle CI « aucun `*.map` ») | CI | LOW (accepté) |

### 6.3 Chaîne d'approvisionnement, dépôt et CI (TB4, TB5)

| Id | STRIDE | Menace | Brut | Mesures | Statut | Résiduel |
|---|---|---|---|---|---|---|
| M-16 | T / E | **Paquet npm compromis, vulnérable ou typosquatté** (script d'installation, code injecté dans le bundle, vol de jetons en CI) | **HIGH** | `pnpm install --frozen-lockfile` ; `onlyBuiltDependencies: [esbuild, simple-git-hooks]` ; `minimumReleaseAge: 4320` (3 jours, dans `pnpm-workspace.yaml`) ; Dependabot avec `cooldown` ; `pnpm audit --audit-level high` (bloquant, prod et dev) + OSV-Scanner + `dependency-review-action` (sévérité et licences, score OpenSSF) ; **toute nouvelle dépendance directe est revue par secdevops** (existence, âge, mainteneurs, téléchargements, dépôt source) ; peu de dépendances (liste ADR) ; jobs CI sans secret. **Retour d'expérience US-001** : `pnpm audit` a bloqué la revue (cycle 1) sur des avis critiques de `tinypool` tiré par Vitest 3.2.7 ; corrigé par la montée à **Vitest 4.1.12** / `@vitest/coverage-v8` 4.1.12 (même éditeur). L'override temporaire `rollup: 4.64.7` (fenêtre `minimumReleaseAge`) est à retirer à partir du 2026-10-23 | ADR-OPS-01, CI, SEC-01 | MEDIUM |
| M-30 | T / E | **Dépendance d'icônes `lucide-react`** (prod, dans le bundle) compromise lors d'une future montée de version | LOW | Version exacte, aucune dépendance transitive ni script d'installation, intégrité `sha512` vérifiée contre le registre au scan US-005 ; imports nommés seulement (pas de `dynamicIconImports`, aucun chargement à l'exécution) ; ISC, avis reproduit dans `dist/THIRD_PARTY_LICENSES.md` ; toute montée = mesures de M-16 | US-005, M-16 | LOW |
| M-17 | T / E | **GitHub Action tierce compromise** (tag réécrit) qui exfiltre des secrets ou altère `dist` | **HIGH** | Épinglage par SHA de commit (12/12 vérifiés contre leur tag au scan US-001) ; option de dépôt « require actions pinned to full-length SHA » (SEC-02) ; `permissions: contents: read` par défaut ; `persist-credentials: false` (manquant sur 4 jobs → SEC-06) ; aucun secret dans `ci.yml` ; actions tierces limitées aux éditeurs de référence ; audit `zizmor` bloquant à partir de *high* (installé par `uvx` sans empreinte → SEC-06) | ADR-OPS-03, CI, SEC-02, SEC-06 | LOW |
| M-18 | E | **Injection dans les workflows depuis un fork** (`pull_request_target`, `${{ github.event.pull_request.title }}` dans un `run:`, empoisonnement de cache ou d'artefact via `workflow_run`) | MEDIUM | `pull_request_target` et `workflow_run` interdits sauf ADR (absents des workflows actuels) ; contextes non fiables passés par `env:` ; approbation requise pour les workflows des contributeurs externes ; le déploiement ne consomme jamais un artefact produit par un run de fork ; `zizmor` bloquant | CI, SEC-02 | LOW |
| M-19 | I | **Secret commité dans le dépôt public** (jeton Cloudflare, `.env`) : exploité par des bots en quelques minutes, même s'il est supprimé ensuite. Au premier push, **tout l'historique local devient public d'un coup** | **HIGH** | `.env` dans `.gitignore`, `.env.example` factice ; gitleaks 8.30.1 (version + SHA-256 épinglés) en CI sur tout l'historique + sur `dist` ; secret scanning + push protection GitHub (SEC-02, à activer **avant** le premier push) ; scan gitleaks local de toutes les branches juste avant le premier push (§14) ; procédure : **tout secret poussé est considéré compromis → révocation et rotation immédiates** (la réécriture d'historique ne suffit pas). Pas de hook pre-commit gitleaks à ce jour (gitleaks non installé sur le poste) : recommandé, non bloquant. **État** : historique complet sans fuite au scan US-001 ; gitleaks hebdomadaire non encore planifié (SEC-06) | CI, SEC-02, SEC-06 | LOW |
| M-20 | T | PR malveillante discrète (backdoor dans un fichier minifié, modification du lockfile pointant vers une archive tierce, affaiblissement d'un workflow ou d'un contrôle de sécurité) | MEDIUM | Revue obligatoire (reviewer + secdevops) ; CODEOWNERS sur `.github/`, `config/security-headers.mjs`, `pnpm-lock.yaml`, `package.json`, `.npmrc`, `pnpm-workspace.yaml`, `.gitleaks.toml`, `.semgrep/`, `scripts/check-*.mjs` ; `dependency-review-action` ; contrôle du lockfile (intégrité `sha512`, aucune source hors registre : 515/515 au scan US-001) ; interdiction de code minifié commité hors `assets/` | SEC-02, CI | LOW |
| M-21 | T (juridique) | Licence de dépendance incompatible (GPL/AGPL/SSPL, non commerciale) embarquée dans le bundle | MEDIUM | Contrôle de licences en CI (`scripts/check-licenses.mjs`, liste blanche ; 0 refusée au scan US-001), exceptions consignées | CI | LOW |
| M-22 | S / T | Compte GitHub du PO ou d'un mainteneur compromis | MEDIUM | MFA obligatoire (clé de sécurité ou passkey de préférence), rulesets sur `main`, alertes de sécurité activées | SEC-02 | LOW |

### 6.4 Hébergement et déploiement (TB6)

| Id | STRIDE | Menace | Brut | Mesures | Statut | Résiduel |
|---|---|---|---|---|---|---|
| M-23 | T / S | **Déploiement d'un bundle malveillant** (jeton Cloudflare volé, compte Cloudflare compromis, déploiement depuis une branche non revue) | **HIGH** (impact maximal sur A1) | Jeton « Pages : Edit » limité au compte/projet, sans autre permission ; secret uniquement dans l'environnement GitHub `production` (approbation du PO, tags `v*` seulement) ; MFA Cloudflare ; déploiement de l'artefact testé uniquement ; rotation du jeton documentée ; vérification post-déploiement des en-têtes sur l'URL réelle. **État** : `deploy.yml` absent, aucun jeton créé (aucun déploiement sans ordre du PO) | ADR-OPS-06/07, SEC-03b | LOW |
| M-24 | I | Previews publiques indexées ou utilisées pour du phishing ; preview d'une branche non revue | LOW | `X-Robots-Tag: noindex` ; previews seulement pour les branches du dépôt (jamais les forks) ; même CSP | ADR-OPS-07, SEC-03b | LOW |
| M-25 | S | Usurpation de l'URL de l'app. **Sans domaine personnalisé** (décision PO) : pas de DNS à gérer, donc pas de sous-domaine orphelin ni de détournement DNS côté P152 ; risque résiduel : réutilisation du nom `<projet>.pages.dev` par un tiers si le projet Pages est supprimé (les liens déjà diffusés pointeraient vers un contenu tiers ; politique de réattribution de Cloudflare non vérifiée, confiance moyenne), et noms voisins (typosquatting) | LOW | Ne jamais supprimer le projet Pages une fois l'URL diffusée (le désactiver ou y laisser une page d'information) ; si un domaine est choisi plus tard : SEC-37 (DNSSEC, CAA, verrou registrar + MFA, HSTS `includeSubDomains`, suppression des CNAME avant le projet) | ADR-OPS-06, SEC-37 (si domaine) | LOW |
| M-26 | D | Indisponibilité Cloudflare | LOW | Accepté ; repli Netlify documenté (ADR-OPS-06) | ADR | LOW (accepté) |

### 6.5 Assets 3D et catalogue (MVP)

| Id | STRIDE | Menace | Brut | Mesures | Statut | Résiduel |
|---|---|---|---|---|---|---|
| M-27 | T | Fichier catalogue JSON du TA erroné ou piégé (bornes absurdes, clés de prototype) | LOW | Catalogue validé par schéma au build et en test (`core/catalog`), revu en PR | ADR-3D-03, Amend. US-003 | LOW |
| M-28 | T (juridique) | Asset externe sans licence claire | LOW au MVP (procédural) | Registre [`docs/design/3d/licences-assets.md`](../design/3d/licences-assets.md), contrôle `check:assets` (job `assets`) | ADR-OPS-04 | LOW |

### 6.6 Synthèse MVP

Menaces principales du MVP, par ordre de priorité : **M-16 (supply chain npm), M-19 (secret dans un dépôt public), M-23 (déploiement d'un bundle malveillant), M-17/M-18 (CI)**, puis M-11 (CSP absente au premier déploiement), M-03 (XSS via import, maîtrisée par conception) et M-04 (DoS GPU via paramètres). Le cœur applicatif est bien protégé par conception (ADR-APP-03) ; le risque dominant est **la chaîne de production et de livraison du code**, pas le code lui-même.

**État au 2026-10-19 (fin de US-001)** : aucun finding CRITICAL, HIGH ni MEDIUM ouvert ([scan US-001](scans/US-001.md)). M-16 s'est déjà matérialisé une fois (tinypool via Vitest 3, corrigé par Vitest 4.1.12 avant merge), ce qui confirme la priorité. Points à fermer avant le premier push : SEC-03a (en-têtes), activation des protections GitHub (SEC-02) et scan gitleaks final (§14). Les findings LOW du scan US-001 sont regroupés dans **SEC-06**.

## 8. Exigences de sécurité (SR) et traçabilité

| Id | Exigence | Release | Couverture | État au 2026-10-19 |
|---|---|---|---|---|
| SR-01 | Toute donnée externe (fichier, localStorage, autre onglet, URL, API) passe par `parseSetup` ; aucune autre voie de lecture | MVP | ADR-APP-03, Semgrep `p152-json-parse-outside-io` et `p152-storage-outside-persistence`, Amend. US-018 | Règles en place ; `parseSetup` à livrer (US-003, US-018) |
| SR-02 | Aucun `eval`/`new Function`/`innerHTML`/`dangerouslySetInnerHTML` ; Zod `jitless` | MVP | ESLint (`no-eval`), Semgrep (règles ERROR), CodeQL | ESLint et Semgrep en place ; CodeQL actif au premier push |
| SR-03 | CSP stricte sans `unsafe-inline`/`unsafe-eval`, en-têtes de sécurité, vérifiés sur le build et en E2E | MVP | ADR-OPS-06, CI `sec-build-hardening` (bloquant), SEC-03a, Amend. US-022 | En place : en-têtes livrés par SEC-03a, vérifiés sur le build, en preview et en E2E (scan SEC-03a, 2026-10-20) ; CORP `same-origin` proposé pour SEC-03b |
| SR-04 | Hooks de test absents du build de production | MVP | `check:bundle` (job `build`) + `sec-build-hardening` | Vérifié en local (US-001) |
| SR-05 | Paramètres de géométrie bornés, tessellation plafonnée | MVP | Amend. US-008/009 | À livrer |
| SR-06 | Zéro secret dans le dépôt ; secret poussé = révoqué | MVP | gitleaks (CI, `dist`), push protection (SEC-02), scan final avant push (§14) | Historique vérifié propre (US-001) |
| SR-07 | Dépendances et actions épinglées, auditées, licences contrôlées ; nouvelle dépendance revue | MVP | ADR-OPS-01/03, CI, SEC-01, SEC-06 | En place et vérifié en local ; écarts LOW en SEC-06 |
| SR-08 | Dépôt public durci (rulesets, CODEOWNERS, approbation des forks, signalement privé) | MVP (au premier push) | SEC-02 | À faire (pas de dépôt distant) |
| SR-09 | Déploiement protégé (environnement approuvé, jeton minimal, MFA, vérification post-déploiement) | MVP (avant 1er déploiement) | SEC-03b | À faire |
| SR-10 | Information de l'utilisateur sur le stockage local | MVP | SEC-04 | À faire |
| SR-11 | Assets tiers : provenance, licence, validation, ré-export | R4 | SEC-11, SEC-12 | — |
| SR-12 | Liens sortants issus du seul catalogue de confiance, liste blanche, affiliation déclarée | R5 | SEC-20, SEC-21 | — |
| SR-13 | AuthN/sessions, authZ par défaut refusée et testée, RGPD/DSA, anti-abus, journalisation | R6 | SEC-30 à SEC-36 | — |
| SR-14 | Uploads isolés, IA côté serveur, photos minimisées | R7 | SEC-40 à SEC-42 | — |
| SR-15 | AR à permissions minimales | R8 | SEC-50 | — |

---

## 9. Stories de sécurité (reprises au backlog)

Les stories ci-dessous sont reprises dans [`docs/backlog.md`](../backlog.md) avec ces identifiants. **Le backlog fait foi** pour la priorité, l'estimation, les critères d'acceptation détaillés (y compris ceux de SEC-10 à SEC-50, sous chaque id) et le statut ; cette section donne l'origine (menaces couvertes) et un résumé.

### MVP

| Id | Titre | Priorité / pts | Menaces | Résumé et état |
|---|---|---|---|---|
| SEC-01 | Pipeline sécurité en CI | Must, 3 | M-03, M-11, M-12, M-16 à M-21 | Jobs `sec-secrets`, `sec-codeql`, `sec-semgrep`, `sec-workflows`, `sec-dependencies`, `sec-build-hardening` et agrégateur `security` (requis par `ci-ok`) **intégrés** dans `ci.yml`, plus `security-scheduled.yml` et `dependabot.yml`. Restent : PR de test avec 4 échecs volontaires et remontée SARIF, **reportées au Sprint 2** (exigent le dépôt distant) |
| SEC-02 | Durcissement du dépôt GitHub public | Must, 1 | M-17 à M-20, M-22 | MFA, ruleset `main` (`ci-ok` + Code scanning ≥ High), secret scanning + push protection, signalement privé, `SECURITY.md`, `CODEOWNERS`. Réglages appliqués uniquement avec l'accord du PO, au moment de la création du dépôt |
| SEC-03a | Génération des en-têtes de sécurité (`_headers`, CSP) | Must avant le premier push, 1 | M-11, M-13, M-14 | `config/security-headers.mjs` source unique → `public/_headers` → `dist/_headers` ; test unitaire de correspondance ; E2E sans violation CSP. **Sprint 2, en tête** : le contrôle `dist/_headers` reste bloquant (décision du scan US-001) |
| SEC-03b | Déploiement sécurisé sur Cloudflare Pages | Must avant le premier déploiement, 1 | M-23, M-24 | Environnement `production` (approbation PO, tags `v*`), jeton « Pages : Edit », MFA Cloudflare, rotation documentée, contrôle des en-têtes réellement servis, previews `noindex` jamais construites depuis un fork. `*.pages.dev`, pas de domaine personnalisé |
| SEC-04 | Mention « vos données restent dans ce navigateur » [UI] | Should, 1 | M-07, H-S2 | Texte dans l'aide et page « Privacy » statique avant toute publication |
| SEC-05 | Revue de sécurité avant la release MVP | Must, 1 | toutes | Threat model révisé, scans complets sans CRITICAL/HIGH, tests manuels d'import malveillant, en-têtes de production vérifiés (Mozilla HTTP Observatory, A+ visé), rapport `docs/security/release-mvp.md` |
| SEC-06 | Durcissement CI (findings LOW du scan US-001) | Could, 2 | M-16, M-17, M-19 | `persist-credentials: false` sur `quality`, `unit`, `build`, `assets` ; retrait de `id-token: write` dans `security-scheduled.yml` ; gitleaks et CodeQL hebdomadaires ; zizmor installé avec empreinte ; suivi des digests d'images (semgrep, playwright) ; migration d'ESLint 9 (déprécié). Le plus utile avant le premier push : les trois premiers points |

## 11. Risques acceptés

| Id | Risque | Justification | Réévaluer |
|---|---|---|---|
| M-07 | Setups lisibles sur un poste partagé | Pas de compte au MVP ; information (SEC-04) | R6 |
| M-15 | Code et structure publics | Dépôt public par choix du PO | — |
| M-25 | Réutilisation éventuelle du nom `*.pages.dev` | Pas de domaine personnalisé (décision PO) ; parade : ne jamais supprimer le projet Pages | Si un domaine est choisi (SEC-37) |
| M-26 | Dépendance à Cloudflare | Repli Netlify documenté | Avant 1.0 |
| H-S3 | Extensions de navigateur malveillantes | Hors de portée d'une application web | — |
| H-S7 | Contrôles GitHub (CodeQL, dependency-review, secret scanning, rulesets) inactifs au Sprint 1 | Décision PO : pas de push au Sprint 1 ; rien n'est publié, donc aucune exposition ; contrôles locaux équivalents exécutés quand ils existent (scan US-001) | Au premier push (Sprint 2) |
| INFO | `cooldown` Dependabot de 3 jours (zizmor recommande 7) | Aligné sur `minimumReleaseAge` (ADR-OPS-01) ; les mises à jour de sécurité ne sont pas retardées | SEC-06 / fin MVP |

---

## 12. Questions pour le PO

Questions **ouvertes, long terme, non bloquantes** pour le MVP (reprises dans `docs/backlog.md`, « Questions encore ouvertes ») :

1. **Affiliation (R5)** : accepter des liens d'affiliation est-il compatible avec la promesse « neutre vis-à-vis des marques » ? Si oui, la déclaration « affiliate links » et un classement indépendant de la commission sont-ils acceptés comme règle produit ?
2. **Âge minimum (R6)** : le public gaming inclut des mineurs ; quel âge minimum pour créer un compte (13, 15 ou 16 ans) ?
3. **Hébergement des données (R6/R7)** : exiger une localisation dans l'UE pour le backend et le fournisseur IA, même si cela coûte plus cher ?

Décisions déjà prises par le PO (2026-10-19), intégrées dans cette version : dépôt GitHub **public** ; hébergement **Cloudflare Pages** ; **pas de domaine personnalisé** ; **pas de dépôt distant ni de push au Sprint 1** (CI vérifiée en local).

## 14. Conditions avant le premier push

Le premier push rend public, d'un coup, tout l'historique. À vérifier dans cet ordre (détail opérationnel : [`ci-security.md`](ci-security.md) §6) :

1. **SEC-03a mergée** (vérifiée sur la branche au scan SEC-03a, reste le merge puis un rejeu sur `main`) : `dist/_headers` généré, contrôle `sec-build-hardening` vert en local.
2. **Scan gitleaks final** de toutes les branches locales (`gitleaks git --config .gitleaks.toml --log-opts=--all --redact .`) sans fuite ; aucun `.env` suivi.
3. **MFA actif sur le compte GitHub du PO avant le push**, et sur le compte Cloudflare avant toute création de compte ou de projet Pages (SEC-03b) (passkey ou clé de sécurité de préférence ; M-22, M-23).
4. Dépôt créé public par le PO, **secret scanning et push protection actifs avant le push**, signalement privé de vulnérabilités activé.
5. **Fait** (SEC-01, constaté au scan SEC-03a) : `persist-credentials: false` sur tous les `checkout`, aucun `id-token: write`, gitleaks et CodeQL hebdomadaires. Réécriture des e-mails d'auteur (noreply GitHub) faite : 88 commits vérifiés.
6. Après le push : SEC-02 (ruleset `main`, CODEOWNERS), puis SEC-01 (PR de test aux 4 échecs volontaires, SARIF visibles).
