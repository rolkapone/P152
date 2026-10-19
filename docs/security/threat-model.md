# Threat model — P152

> Story : US-002 (threat model initial). Auteur : secdevops. Version 1.0 du 2026-10-19.
> Entrées : `docs/vision.md` v0.2, `docs/backlog.md`, `docs/architecture.md` (ADR-3D-02/03/04/09, ADR-APP-03/04/08/09, section « Sécurité transverse », ADR-OPS-01 à 07).
> Contexte : SPA statique React/Vite/three.js, sans backend ni compte au MVP, hébergée sur Cloudflare Pages, CI GitHub Actions, **dépôt GitHub public**.
> Méthode : actifs → acteurs → frontières de confiance → flux → STRIDE par composant → mesures → exigences et stories.
> **Révisions obligatoires** : avant le premier déploiement public (fin MVP), au début de R4 (assets tiers), R5 (liens/affiliation), R6 (comptes, avant tout choix de backend), R7 (upload/IA), R8 (AR), et à chaque ajout d'un domaine dans la CSP.

## Sommaire
1. Périmètre et hypothèses
2. Actifs
3. Acteurs de menace
4. Frontières de confiance et flux de données
5. Échelle de risque
6. STRIDE — MVP
7. STRIDE — vision long terme (R2 à R8)
8. Exigences de sécurité (SR) et traçabilité
9. Stories proposées au backlog
10. Amendements proposés aux stories existantes
11. Risques acceptés
12. Questions pour le PO

---

## 1. Périmètre et hypothèses

**Dans le périmètre MVP** : le code servi au navigateur (bundle Vite), le pipeline `parseSetup` (ADR-APP-03), la persistance `localStorage` (ADR-APP-04), l'import/export JSON, le catalogue embarqué (données du technical-artist), les générateurs procéduraux (ADR-3D-03), la chaîne de build (pnpm, npm registry, GitHub Actions), le dépôt public, l'hébergement Cloudflare Pages et ses en-têtes (ADR-OPS-06).

**Hypothèses (à reconfirmer à chaque révision)**
- H-S1 Aucun backend, aucun compte, aucun cookie, aucune requête vers un tiers à l'exécution au MVP (CSP `connect-src 'self'`).
- H-S2 Aucune donnée personnelle collectée par l'éditeur au MVP : les setups restent dans le navigateur de l'utilisateur. Le nom du setup est un texte libre (peut contenir une info personnelle, mais n'est jamais transmis).
- H-S3 Les extensions du navigateur et un poste compromis sont hors périmètre (elles ont un accès total à la page).
- H-S4 Le MVP ne contient aucun binaire d'asset 3D externe (tout est procédural) ; les assets tiers arrivent en R2/R4.
- H-S5 Le dépôt étant public, **le code source n'est pas un secret** : la sécurité ne repose jamais sur l'obscurité (source maps, structure, hooks).

---

## 2. Actifs

| Id | Actif | Propriété à protéger | Criticité MVP | Criticité long terme |
|---|---|---|---|---|
| A1 | Intégrité du code servi (bundle JS/CSS, `index.html`, `_headers`) | Intégrité | **Haute** : un bundle altéré touche tous les utilisateurs | Haute (+ vol de sessions en R6) |
| A2 | Setups des utilisateurs (localStorage, fichiers exportés) | Disponibilité, intégrité | Moyenne (perte de travail) | Haute en R6 (données de compte) |
| A3 | Disponibilité de l'application (onglet utilisable, site en ligne) | Disponibilité | Basse | Moyenne |
| A4 | Dépôt, workflows CI, artefacts `dist`, tags de release | Intégrité | Haute | Haute |
| A5 | Secrets : `CLOUDFLARE_API_TOKEN`, comptes GitHub/Cloudflare du PO ; plus tard clés d'API IA, affiliation, base de données | Confidentialité | Haute | Critique |
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
| T-C | Contributeur externe malveillant | Le dépôt est public : PR depuis un fork, issues, injection dans les workflows | MVP |
| T-A | Agent IA de l'équipe (erreur, pas malveillance) | Commit d'un secret, ajout d'une dépendance inventée ou mal orthographiée (« slopsquatting »), affaiblissement de la CSP pour « faire passer » un test | MVP |
| T-H | Attaquant visant les comptes d'infrastructure | Vol d'identifiants GitHub/Cloudflare du PO, jeton CI exfiltré → déploiement d'un bundle malveillant | MVP (dès le premier déploiement) |
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
                                                              Cloudflare Pages (CDN, _headers)
                                                                            │ HTTPS (+HSTS)
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

| Frontière | Côté non fiable → côté fiable | Contrôle principal |
|---|---|---|
| TB1 | CDN/réseau → navigateur | HTTPS, HSTS (`.dev` est préchargé HSTS), CSP stricte, en-têtes versionnés |
| TB2 | Fichier importé → état de l'app | `parseSetup` unique (ADR-APP-03) |
| TB2' | Autre onglet → état | `parseSetup` à la relecture |
| TB3 | `localStorage` → état | `parseSetup` à chaque lecture (donnée traitée comme non fiable) |
| TB4 | Code tiers (npm, Actions, images, assets) → build | lockfile gelé, scripts d'install en liste blanche, `minimumReleaseAge`, SCA, épinglage SHA/digest, revue des nouvelles dépendances |
| TB5 | Contributeurs (forks) → dépôt et CI | `pull_request` uniquement (jamais `pull_request_target`), approbation des workflows de forks, rulesets sur `main`, CODEOWNERS |
| TB6 | CI → hébergement | jeton à portée minimale, environnement GitHub protégé, déploiement depuis tag uniquement |

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

Statut des mesures : **ADR** = décidé dans `architecture.md` ; **CI** = contrôle automatisé défini dans `ci-security.md` ; **Story** = travail à planifier (section 9) ; **Amend.** = critère à ajouter à une story existante (section 10).

---

## 6. STRIDE — MVP

### 6.1 Import/export JSON et stockage local (TB2, TB2', TB3)

| Id | STRIDE | Menace | Brut | Mesures | Statut | Résiduel |
|---|---|---|---|---|---|---|
| M-01 | D | Fichier énorme ou très imbriqué qui gèle l'onglet (lecture, `JSON.parse`, validation) | LOW | Refus > 1 Mio sur `File.size` avant lecture puis sur la chaîne ; schéma non récursif ; tableau `objects` ≤ 50 ; chaînes bornées | ADR-APP-03, Amend. US-018 | LOW |
| M-02 | T / E | Pollution de prototype : clés `__proto__`, `constructor`, `prototype` dans le JSON, exploitées lors d'une fusion/copie | MEDIUM | Rejet de ces clés partout ; Zod `.strict()` produit de nouveaux objets ; aucune lib de deep-merge sur des données importées ; `extensions` jamais fusionné ni interprété ; fixtures malveillantes + fuzzing fast-check | ADR-APP-03/08, Amend. US-018 | LOW |
| M-03 | T / I (XSS) | Nom du setup, `label`, chemin d'erreur (nom de clé inconnue renvoyé dans `objects[3].params.<clé>`) rendus comme HTML | HIGH (sans mesure) | Rendu par React uniquement (texte échappé) ; aucun `dangerouslySetInnerHTML`/`innerHTML` (ESLint + Semgrep) ; chemin d'erreur tronqué et rendu en texte ; aucun champ URL au MVP ; CSP `script-src 'self'` sans `unsafe-inline` en défense en profondeur | ADR-APP-03/05, CI | LOW |
| M-04 | D | Valeurs aberrantes (`1e308`, `NaN`/`Infinity` encodés, bornes catalogue dépassées, `mount` cyclique) : géométrie gigantesque, boucle infinie, perte du contexte WebGL | MEDIUM | Nombres `finite` et bornés ; bornes du catalogue réappliquées (rejet) ; détection de cycles `mount` ; **les paramètres de tessellation (segments, rayons) dérivés de valeurs bornées et plafonnés dans les générateurs** ; gestion de `webglcontextlost` | ADR-APP-03, ADR-3D-03, Amend. US-008/009 | LOW |
| M-05 | I | Message d'erreur qui réaffiche le contenu du fichier ou une pile d'exception | LOW | Code d'erreur + chemin tronqué, jamais de contenu ni de stack (ADR-APP-03) | ADR | LOW |
| M-06 | T | `localStorage` modifié à la main ou corrompu | LOW | Relecture via `parseSetup`, copie `recovered` unique, setup vierge + message | ADR-APP-04 | LOW |
| M-07 | I | Poste partagé : setups lisibles par la personne suivante | LOW | Accepté ; « New setup » réinitialise ; mention dans l'aide (SEC-04) | Story | LOW (accepté) |
| M-08 | D | Quota plein / mode privé : perte de travail | LOW | Indicateur « Couldn't save in this browser », export | ADR-APP-04 | LOW |
| M-09 | T | Nom de fichier d'export dérivé du nom du setup (caractères de chemin, noms réservés Windows) | LOW | Slug `[a-z0-9-]`, 40 caractères max, préfixe fixe | ADR-APP-04 | LOW |
| M-10 | R | Répudiation | n/a | Pas d'action multi-utilisateur au MVP | — | n/a |

### 6.2 Application dans le navigateur (code servi, TB1)

| Id | STRIDE | Menace | Brut | Mesures | Statut | Résiduel |
|---|---|---|---|---|---|---|
| M-11 | E | Affaiblissement de la CSP (une dépendance exige `unsafe-eval`, un agent ajoute `unsafe-inline` pour faire passer un test) | MEDIUM | CSP source unique `config/security-headers.mjs` sous CODEOWNERS ; contrôle CI des directives interdites sur `dist/_headers` ; test E2E qui échoue sur `securitypolicyviolation` ; toute relaxation = ADR + validation secdevops (`'wasm-unsafe-eval'` seulement, en R2/R4) | CI, ADR-OPS-06, SEC-01 | LOW |
| M-12 | E / I | Hooks de test `window.__p152test` / `__p152perf` présents en production (API de pilotage exposée, gadget pour une future XSS) | LOW au MVP, MEDIUM en R6 | Garde `import.meta.env.VITE_E2E === "true"` ; build `dist-e2e` jamais déployé ; contrôle CI « symboles absents de `dist` » ; déploiement du seul artefact du job `build` ; source maps non publiées (sinon le contrôle par grep est faussé) | ADR-APP-08, ADR-OPS-06, CI | LOW |
| M-13 | T | Clickjacking / intégration de l'app dans un site tiers | LOW | `frame-ancestors 'none'` | ADR-OPS-06 | LOW |
| M-14 | I | Fuite vers des tiers (CDN, polices Google, analytics) | LOW | Aucune ressource tierce à l'exécution, `connect-src 'self'`, polices auto-hébergées, `Referrer-Policy: no-referrer`, contrôle CI « pas d'URL externe dans `index.html` » | ADR, CI | LOW |
| M-15 | I | Source maps et commentaires en production | LOW | Dépôt public : aucune information nouvelle ; on ne publie pas les source maps pour fiabiliser le contrôle M-12 | CI | LOW (accepté) |

### 6.3 Chaîne d'approvisionnement, dépôt et CI (TB4, TB5)

| Id | STRIDE | Menace | Brut | Mesures | Statut | Résiduel |
|---|---|---|---|---|---|---|
| M-16 | T / E | **Paquet npm compromis ou typosquatté** (script d'installation, code injecté dans le bundle, vol de jetons en CI) | **HIGH** | `pnpm install --frozen-lockfile` ; `onlyBuiltDependencies` en liste blanche ; `minimumReleaseAge` (3 jours) ; Dependabot avec `cooldown` ; `pnpm audit` + OSV-Scanner + `dependency-review-action` (sévérité et licences, score OpenSSF affiché) ; **toute nouvelle dépendance directe est revue par secdevops** (existence, âge, mainteneurs, téléchargements, dépôt source) ; peu de dépendances (liste ADR) ; jobs CI sans secret | ADR-OPS-01, CI, SEC-01 | MEDIUM |
| M-17 | T / E | **GitHub Action tierce compromise** (tag réécrit) qui exfiltre des secrets ou altère `dist` | **HIGH** | Épinglage par SHA de commit ; option de dépôt « require actions pinned to full-length SHA » ; `permissions: contents: read` par défaut ; `persist-credentials: false` ; aucun secret dans `ci.yml` ; actions tierces limitées aux éditeurs de référence ; audit `zizmor` | ADR-OPS-03, CI, SEC-02 | LOW |
| M-18 | E | **Injection dans les workflows depuis un fork** (`pull_request_target`, `${{ github.event.pull_request.title }}` dans un `run:`, empoisonnement de cache ou d'artefact via `workflow_run`) | MEDIUM | `pull_request_target` et `workflow_run` interdits sauf ADR ; contextes non fiables passés par `env:` ; approbation requise pour les workflows des contributeurs externes ; le déploiement ne consomme jamais un artefact produit par un run de fork ; `zizmor` bloquant | CI, SEC-02 | LOW |
| M-19 | I | **Secret commité dans le dépôt public** (jeton Cloudflare, `.env`) : exploité par des bots en quelques minutes, même s'il est supprimé ensuite | **HIGH** | `.env` dans `.gitignore`, `.env.example` factice ; gitleaks en CI sur tout l'historique + sur `dist` ; secret scanning + push protection GitHub ; hook pre-commit gitleaks si installé ; procédure : **tout secret poussé est considéré compromis → révocation et rotation immédiates** (la réécriture d'historique ne suffit pas) | CI, SEC-02 | LOW |
| M-20 | T | PR malveillante discrète (backdoor dans un fichier minifié, modification du lockfile pointant vers une archive tierce, affaiblissement d'un workflow) | MEDIUM | Revue obligatoire (reviewer + secdevops) ; CODEOWNERS sur `.github/`, `config/security-headers.mjs`, `pnpm-lock.yaml`, `package.json`, `.npmrc`, `pnpm-workspace.yaml` ; `dependency-review-action` ; interdiction de code minifié commité hors `assets/` | SEC-02 | LOW |
| M-21 | T (juridique) | Licence de dépendance incompatible (GPL/AGPL/SSPL, non commerciale) embarquée dans le bundle | MEDIUM | Contrôle de licences en CI (liste blanche), exceptions consignées | CI | LOW |
| M-22 | S / T | Compte GitHub du PO ou d'un mainteneur compromis | MEDIUM | MFA obligatoire (clé de sécurité ou passkey de préférence), rulesets sur `main`, alertes de sécurité activées | SEC-02 | LOW |

### 6.4 Hébergement et déploiement (TB6)

| Id | STRIDE | Menace | Brut | Mesures | Statut | Résiduel |
|---|---|---|---|---|---|---|
| M-23 | T / S | **Déploiement d'un bundle malveillant** (jeton Cloudflare volé, compte Cloudflare compromis, déploiement depuis une branche non revue) | **HIGH** (impact maximal sur A1) | Jeton « Pages : Edit » limité au compte/projet, sans autre permission ; secret uniquement dans l'environnement GitHub `production` (approbation du PO, tags `v*` seulement) ; MFA Cloudflare ; déploiement de l'artefact testé uniquement ; rotation du jeton documentée ; vérification post-déploiement des en-têtes sur l'URL réelle | ADR-OPS-06/07, SEC-03 | LOW |
| M-24 | I | Previews publiques indexées ou utilisées pour du phishing ; preview d'une branche non revue | LOW | `X-Robots-Tag: noindex` ; previews seulement pour les branches du dépôt (jamais les forks) ; même CSP | ADR-OPS-07, SEC-03 | LOW |
| M-25 | S | Domaine personnalisé : sous-domaine orphelin (CNAME vers un projet Pages supprimé), détournement DNS | MEDIUM (si domaine) | DNSSEC, enregistrements CAA, verrou registrar + MFA, suppression des CNAME avant suppression d'un projet, HSTS avec `includeSubDomains` | SEC-37 | LOW |
| M-26 | D | Indisponibilité Cloudflare | LOW | Accepté ; repli Netlify documenté (ADR-OPS-06) | ADR | LOW (accepté) |

### 6.5 Assets 3D et catalogue (MVP)

| Id | STRIDE | Menace | Brut | Mesures | Statut | Résiduel |
|---|---|---|---|---|---|---|
| M-27 | T | Fichier catalogue JSON du TA erroné ou piégé (bornes absurdes, clés de prototype) | LOW | Catalogue validé par schéma au build et en test (`core/catalog`), revu en PR | ADR-3D-03 | LOW |
| M-28 | T (juridique) | Asset externe sans licence claire | LOW au MVP (procédural) | Registre `docs/design/3d/licences-assets.md`, contrôle `check:assets` | ADR-OPS-04 | LOW |

### 6.6 Synthèse MVP

Menaces principales du MVP, par ordre de priorité : **M-16 (supply chain npm), M-19 (secret dans un dépôt public), M-23 (déploiement d'un bundle malveillant), M-17/M-18 (CI)**, puis M-03 (XSS via import, maîtrisée par conception) et M-04 (DoS GPU via paramètres). Le cœur applicatif est bien protégé par conception (ADR-APP-03) ; le risque dominant est **la chaîne de production et de livraison du code**, pas le code lui-même.

---

## 7. STRIDE — vision long terme

### R2 / R3 — Styles, matériaux, éclairage

| Id | STRIDE | Menace | Brut | Mesures | Story |
|---|---|---|---|---|---|
| L-01 | E | `'wasm-unsafe-eval'` nécessaire aux décodeurs meshopt/Basis : relâchement de la CSP | LOW | ADR dédié ; décodeurs servis depuis l'origine (`public/`, versions épinglées, empreinte vérifiée au build), jamais depuis un CDN ; contrôle CI : `'unsafe-eval'` toujours interdit | SEC-10 |
| L-02 | D | Textures/HDRI lourdes : saturation mémoire GPU mobile | LOW | Budgets `check:assets` (taille, résolution KTX2) | ADR-3D-04 |
| L-03 | T | `materialId` ou `stylePreset` inconnus dans un setup importé | LOW | Validation sémantique (ADR-APP-03 §6) | ADR |

### R4 — Déco et bibliothèque de modèles libres

| Id | STRIDE | Menace | Brut | Mesures | Story |
|---|---|---|---|---|---|
| L-10 | T (juridique) | Modèle « libre » sans droits réels (extraits de jeux, NC utilisé commercialement, CC-BY sans attribution) | MEDIUM | Liste des licences admises (CC0, CC-BY 4.0 avec attribution affichée dans l'app), provenance enregistrée (URL source, auteur, date, empreinte SHA-256), contrôle CI | SEC-11 |
| L-11 | D / E | glTF piégé : `uri` externes (pistage, requêtes sortantes), data URI géantes, accesseurs démesurés, bombe de décompression meshopt/KTX2, bug de parseur | MEDIUM | Pipeline d'ingestion : `gltf-validator` sans erreur, ré-export complet par `gltf-transform` (supprime extensions inconnues et `uri` externes), budgets triangles/poids/texture, `connect-src 'self'` ; three.js tenu à jour | SEC-11 |
| L-12 | T | Catalogue ou assets servis depuis une autre origine (bucket) altérés | MEDIUM | Servis depuis l'origine de l'app, fichiers hachés ; manifeste versionné avec SHA-256 par fichier, vérifié avant usage ; validation par schéma | SEC-12 |

### R5 — Catalogue de produits réels, prix, liens d'affiliation

| Id | STRIDE | Menace | Brut | Mesures | Story |
|---|---|---|---|---|---|
| L-20 | S / T | **Liens sortants détournés** (catalogue compromis, URL injectée via un setup importé ou partagé) vers phishing/malware, ou redirection ouverte via un endpoint `/go?url=` | **HIGH** | Le setup ne stocke qu'un `productId`, **jamais d'URL** ; les URL viennent uniquement du catalogue de confiance ; liste blanche de domaines marchands, `https:` obligatoire, schéma Zod ; `rel="noopener noreferrer sponsored"` ; aucun endpoint de redirection prenant une URL en paramètre (identifiant seulement) | SEC-20 |
| L-21 | T (juridique, réputation) | Prix faux ou périmés (pratique commerciale trompeuse, règles d'indication des prix) | MEDIUM | Date et source du prix affichées, mention « prices may vary », péremption automatique (prix masqué au-delà de N jours), contrôle de fraîcheur en CI/cron | SEC-21 |
| L-22 | I (juridique) | Pistage tiers via scripts/pixels d'affiliation (consentement ePrivacy/CNIL), affiliation non déclarée (transparence, public anglophone : règles FTC) | MEDIUM | Liens simples uniquement, aucun script tiers ; mention claire « affiliate links » près des liens ; politique de confidentialité à jour ; neutralité : le classement ne dépend pas de la commission (question PO) | SEC-20 |
| L-23 | I / E | Clés d'API marchands/affiliation exposées côté client ; SSRF si le backend récupère des URL produits arbitraires | MEDIUM | Clés uniquement côté serveur (secret manager) ; récupération limitée à une liste blanche d'hôtes, sans suivi de redirections vers d'autres hôtes, sans adresses privées | SEC-21 |

### R6 — Comptes, partage, galerie communautaire

| Id | STRIDE | Menace | Brut | Mesures | Story |
|---|---|---|---|---|---|
| L-30 | S | Prise de contrôle de compte (credential stuffing, phishing, réinitialisation faible) | HIGH | Fournisseur d'auth managé ; passkeys/OAuth en priorité ; si mot de passe : longueur ≥ 12, vérification contre les mots de passe compromis ; MFA disponible ; rate limiting et verrouillage progressif ; messages non énumérants ; email de notification de connexion inhabituelle | SEC-31 |
| L-31 | I / E | Jeton de session volé par XSS (ex. JWT stocké dans `localStorage`, comportement par défaut de certains SDK BaaS) | HIGH | Cookies `HttpOnly; Secure; SameSite=Lax` ou jeton en mémoire à courte durée de vie + refresh rotatif ; CSP stricte maintenue ; révocation des sessions ; durée de vie bornée | SEC-31 |
| L-32 | E / I | **IDOR / BOLA** : lire ou modifier le setup d'un autre ; RLS désactivée ou trop large sur une table exposée par la clé publique (incident fréquent avec les BaaS) | **CRITICAL** | Refus par défaut ; RLS sur toutes les tables (si Supabase) ; clé `service_role` jamais côté client ; tests automatisés d'autorisation (utilisateur A ne peut ni lire ni écrire B, anonyme ne peut rien écrire) ; revue secdevops de chaque politique | SEC-32 |
| L-33 | I | Liens de partage devinables, setups privés exposés, énumération | MEDIUM | Identifiants aléatoires ≥ 128 bits (`crypto.randomUUID`), privé par défaut, statut « non listé » distinct de « public », révocation du lien | SEC-32 |
| L-34 | T / I | **XSS stockée via UGC** (nom, description, pseudo, commentaires, balises Open Graph générées côté serveur) | HIGH | Validation serveur avec le même `parseSetup` (ADR-APP-09) ; texte brut uniquement (pas de HTML/Markdown HTML) ; si texte riche : DOMPurify + liste blanche ; échappement des méta OG ; CSP | SEC-34 |
| L-35 | D | Spam, bots, inscription en masse, abus de stockage (« denial of wallet ») | MEDIUM | Rate limiting par IP et par compte, quotas (setups, images), CAPTCHA respectueux de la vie privée si nécessaire (impact CSP et RGPD à évaluer), alertes de coût | SEC-35 |
| L-36 | — (conformité) | **RGPD** : base légale, information, droits (accès, export, effacement), conservation, sous-traitants (DPA), transferts hors UE, violation à notifier sous 72 h ; **mineurs** (public gaming : âge du consentement numérique, 15 ans en France) ; **DSA** pour l'hébergement de contenus (signalement, motivation des décisions, point de contact) | HIGH | Registre des traitements, politique de confidentialité, export/suppression du compte en self-service, durées de conservation, DPA et hébergement UE de préférence, procédure de violation, CGU, âge minimum ; signalement et modération (lien US-143) | SEC-33, SEC-34 |
| L-37 | R | Actions de modération ou suppressions contestées, sans trace | MEDIUM | Journal d'audit immuable des actions sensibles (modération, suppression, changement de rôle, connexion admin) | SEC-36 |
| L-38 | I | Logs contenant jetons, emails, contenus | MEDIUM | Hygiène des logs : pas de secret ni jeton, emails pseudonymisés, rétention limitée | SEC-36 |
| L-39 | E | Compte admin/modérateur compromis | HIGH | MFA obligatoire (clé matérielle/passkey), rôles minimaux, interface d'admin séparée, revue périodique des accès | SEC-31, SEC-36 |
| L-40 | T | CSRF (si sessions par cookie), CORS trop permissif | MEDIUM | `SameSite=Lax` + vérification `Origin` ou jeton anti-CSRF sur les mutations ; CORS en liste blanche explicite, jamais `*` avec credentials | SEC-31 |
| L-41 | I | Images de setup partagées : métadonnées EXIF (localisation), contenus illicites | MEDIUM | Images générées par l'app (capture canvas, sans EXIF) de préférence ; tout upload ré-encodé côté serveur, métadonnées supprimées ; domaine séparé pour les contenus utilisateurs | SEC-34 |
| L-42 | D | Partage sans serveur via fragment `#` d'URL : setup compressé arbitraire | LOW | Même `parseSetup`, limite de taille appliquée **après** décompression (bombe de décompression) | SEC-34 |

### R7 — Import photo vers 3D par IA, upload de modèles glTF

| Id | STRIDE | Menace | Brut | Mesures | Story |
|---|---|---|---|---|---|
| L-50 | E / D | Fichier uploadé malveillant (polyglotte, exploit de parseur d'image, bombe de décompression, taille démesurée) contre les workers de traitement | HIGH | Taille max avant upload et côté serveur ; vérification par octets magiques (pas par extension) ; formats fermés (JPEG/PNG/WebP, GLB), **SVG refusé** ; ré-encodage dans un bac à sable (sans réseau, utilisateur non-root, limites CPU/mémoire/temps, éphémère) ; bibliothèques à jour | SEC-40 |
| L-51 | T / I | Modèle uploadé servi aux autres utilisateurs (XSS si mauvais `Content-Type`, `uri` externes, contenu volé) | HIGH | Origine distincte pour les contenus utilisateurs (pas de cookie, CSP restrictive), `Content-Type` forcé, `nosniff`, `Content-Disposition` ; conversion systématique en GLB via `gltf-transform` ; même validation que L-11 ; URL signées à courte durée | SEC-40 |
| L-52 | I (conformité) | **Photos = données personnelles** (visages, intérieur du domicile, EXIF GPS, reflets) envoyées à un fournisseur IA (transfert hors UE, réutilisation pour l'entraînement) | HIGH | Suppression des EXIF côté client avant envoi ; consentement explicite et information ; suppression de la photo source après génération (rétention courte) ; DPA avec le fournisseur, refus de l'entraînement, région UE si possible | SEC-42 |
| L-53 | I / D | **Clé d'API IA exposée** ou abus des générations (coût) | HIGH | Appels IA uniquement côté serveur (ADR-APP-09) ; clé dans un secret manager ; authentification obligatoire ; quotas par utilisateur et plafond global ; alertes budgétaires ; idempotence des demandes | SEC-41 |
| L-54 | T (juridique) | Contenus générés illicites ou contrefaisants | MEDIUM | Signalement/modération (SEC-34), CGU, retrait sur notification | SEC-34 |
| L-55 | E | SSRF si import « depuis une URL » | MEDIUM | Pas d'import par URL, ou proxy de sortie à liste blanche, sans IP privées ni redirections | SEC-40 |
| L-56 | T | Injection de prompt si un modèle multimodal produit des métadonnées (dimensions, nom) | LOW | Sortie du modèle traitée comme donnée non fiable : validée par schéma, jamais exécutée ni rendue en HTML | SEC-41 |

### R8 — Réalité augmentée mobile

| Id | STRIDE | Menace | Brut | Mesures | Story |
|---|---|---|---|---|---|
| L-60 | I | Accès caméra/environnement plus large que nécessaire, transmission de données spatiales | LOW | Session `immersive-ar` sans la fonctionnalité `camera-access` ; aucune donnée d'ancrage/maillage envoyée à un serveur ; `Permissions-Policy: xr-spatial-tracking=(self)`, `camera=()` conservé | SEC-50 |
| L-61 | T | Export USDZ (Quick Look) | LOW | Généré localement depuis le setup validé ; aucun contenu externe | SEC-50 |

---

## 8. Exigences de sécurité (SR) et traçabilité

| Id | Exigence | Release | Couverture |
|---|---|---|---|
| SR-01 | Toute donnée externe (fichier, localStorage, autre onglet, URL, API) passe par `parseSetup` ; aucune autre voie de lecture | MVP | ADR-APP-03, Semgrep `p152-json-parse-outside-io`, Amend. US-018 |
| SR-02 | Aucun `eval`/`new Function`/`innerHTML`/`dangerouslySetInnerHTML` ; Zod `jitless` | MVP | ESLint, Semgrep, CodeQL |
| SR-03 | CSP stricte sans `unsafe-inline`/`unsafe-eval`, en-têtes de sécurité, vérifiés sur le build et en E2E | MVP | ADR-OPS-06, CI `build-hardening`, Amend. US-022 |
| SR-04 | Hooks de test absents du build de production | MVP | CI `build-hardening` |
| SR-05 | Paramètres de géométrie bornés, tessellation plafonnée | MVP | Amend. US-008/009 |
| SR-06 | Zéro secret dans le dépôt ; secret poussé = révoqué | MVP | gitleaks, push protection, SEC-02 |
| SR-07 | Dépendances et actions épinglées, auditées, licences contrôlées ; nouvelle dépendance revue | MVP | ADR-OPS-01/03, CI, SEC-01 |
| SR-08 | Dépôt public durci (rulesets, CODEOWNERS, approbation des forks, signalement privé) | MVP | SEC-02 |
| SR-09 | Déploiement protégé (environnement approuvé, jeton minimal, MFA, vérification post-déploiement) | MVP (avant 1er déploiement) | SEC-03 |
| SR-10 | Information de l'utilisateur sur le stockage local | MVP | SEC-04 |
| SR-11 | Assets tiers : provenance, licence, validation, ré-export | R4 | SEC-11, SEC-12 |
| SR-12 | Liens sortants issus du seul catalogue de confiance, liste blanche, affiliation déclarée | R5 | SEC-20, SEC-21 |
| SR-13 | AuthN/sessions, authZ par défaut refusée et testée, RGPD/DSA, anti-abus, journalisation | R6 | SEC-30 à SEC-36 |
| SR-14 | Uploads isolés, IA côté serveur, photos minimisées | R7 | SEC-40 à SEC-42 |
| SR-15 | AR à permissions minimales | R8 | SEC-50 |

---

## 9. Stories proposées au backlog

Ids provisoires `SEC-xx`, à renuméroter par le scrum-master. Estimations indicatives.

### MVP

**SEC-01 — Pipeline sécurité en CI** [Must | 3 pts | devops + secdevops | dépend de US-001]
En tant qu'équipe, je veux que chaque PR soit scannée (secrets, SAST, dépendances, licences, workflows, build) afin qu'aucune vulnérabilité CRITICAL/HIGH ni aucun secret n'atteigne `main`.
- [ ] Le slot `# SECDEVOPS-SLOT` de `ci.yml` contient les jobs définis dans `docs/security/ci-security.md` (gitleaks, CodeQL, Semgrep, zizmor, SCA + licences, `build-hardening`) et un job agrégateur `security` requis par `ci-ok`.
- [ ] Une PR de test contenant un faux secret, un `innerHTML`, une dépendance vulnérable HIGH, et un `dist` contenant `__p152test` fait échouer la CI (4 cas vérifiés puis annulés).
- [ ] `.gitleaks.toml`, `.semgrep/p152.yml`, `scripts/check-licenses.mjs`, `.github/dependabot.yml` et le workflow hebdomadaire sont en place ; actions et images épinglées par SHA/digest.
- [ ] Les rapports SARIF remontent dans l'onglet Code scanning.

**SEC-02 — Durcissement du dépôt GitHub public** [Must | 1 pt | devops, actions sur le compte avec accord du PO | dépend de US-001]
- [ ] MFA actif sur les comptes ayant un accès en écriture.
- [ ] Ruleset sur `main` : PR obligatoire, `ci-ok` requis, résultats Code scanning (≥ High) bloquants, force-push et suppression interdits.
- [ ] Secret scanning + push protection, Dependabot alerts, private vulnerability reporting activés ; `SECURITY.md` publié.
- [ ] Actions : `GITHUB_TOKEN` en lecture seule par défaut, approbation requise pour les workflows des contributeurs externes, épinglage SHA obligatoire si l'option est disponible.
- [ ] `CODEOWNERS` couvre `.github/`, `config/security-headers.mjs`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, `.gitleaks.toml`, `.semgrep/`.

**SEC-03 — Déploiement sécurisé sur Cloudflare Pages** [Must avant le premier déploiement | 2 pts | devops + secdevops]
- [ ] Environnement GitHub `production` : approbation du PO, déploiement depuis les tags `v*` uniquement ; secrets Cloudflare présents uniquement dans cet environnement (et `preview` séparé avec son propre jeton).
- [ ] Jeton Cloudflare à portée « Pages : Edit » sur le seul compte ; MFA Cloudflare ; procédure de rotation écrite dans `docs/security/`.
- [ ] Après chaque déploiement, un contrôle automatique lit les en-têtes de l'URL réelle (CSP, nosniff, Referrer-Policy, Permissions-Policy, COOP, HSTS) et échoue si un en-tête diffère de `config/security-headers.mjs`.
- [ ] Les previews portent `X-Robots-Tag: noindex` et ne sont jamais construites depuis un fork.

**SEC-04 — Mention « vos données restent dans ce navigateur »** [UI] [Should | 1 pt | developer, textes ux-designer]
- [ ] L'aide (S7) indique en anglais que le setup est stocké uniquement dans ce navigateur, sans compte, cookie ni pistage, et comment l'exporter ou l'effacer.
- [ ] Une page « Privacy » statique est accessible depuis l'aide avant toute publication.

**SEC-05 — Revue de sécurité avant la release MVP** [Must | 1 pt | secdevops]
- [ ] Threat model révisé ; scans complets sur `main` sans CRITICAL/HIGH ouvert.
- [ ] Tests manuels de l'import avec le jeu de fichiers malveillants ; en-têtes de l'URL de production vérifiés (Mozilla HTTP Observatory, note visée A+).
- [ ] Rapport `docs/security/release-mvp.md`.

### R2

**SEC-10 — Activation encadrée de `'wasm-unsafe-eval'` pour meshopt/KTX2** [Must à la 1re story qui charge un GLB/KTX2 | 1 pt]
- [ ] ADR consigné ; décodeurs servis depuis l'origine, versions épinglées, empreinte vérifiée au build.
- [ ] Le contrôle CI accepte `'wasm-unsafe-eval'` et refuse toujours `'unsafe-eval'` ; E2E sans violation CSP.

### R4

**SEC-11 — Ingestion sécurisée des modèles et textures tiers** [Must | 3 pts | technical-artist + secdevops, lié à US-121]
- [ ] Chaque asset a une provenance (URL source, auteur, licence SPDX, date, SHA-256) dans le registre ; licences admises : CC0, CC-BY 4.0 (attribution affichée dans l'app) ; tout autre cas refusé en CI.
- [ ] `gltf-validator` sans erreur ; ré-export `gltf-transform` ; aucune `uri` externe ; budgets respectés.
- [ ] Jeu de tests avec glTF piégés (uri http, data URI géante, accesseur démesuré) rejetés.

**SEC-12 — Intégrité du catalogue distant** [Should | 2 pts | R4/R5, si le catalogue sort du bundle]
- [ ] Manifeste versionné avec SHA-256 par fichier, vérifié avant usage ; servi depuis l'origine ; validation par schéma ; CSP inchangée ou ADR.

### R5

**SEC-20 — Liens sortants et affiliation sûrs et transparents** [Must | 3 pts]
- [ ] Le setup ne contient que `productId` ; toute URL vient du catalogue de confiance, `https:` et domaine en liste blanche (rejet sinon, testé).
- [ ] Liens rendus avec `rel="noopener noreferrer sponsored"` ; aucun endpoint de redirection prenant une URL.
- [ ] Mention « affiliate links » visible ; aucun script ni pixel tiers ; politique de confidentialité mise à jour.

**SEC-21 — Intégrité et fraîcheur des données produits et prix** [Should | 3 pts]
- [ ] Source et date affichées ; prix masqué au-delà d'un âge configurable ; secrets marchands côté serveur ; récupération limitée à une liste blanche d'hôtes (anti-SSRF).

### R6

**SEC-30 — Révision du threat model et ADR de backend sécurisé** [Must, avant toute story de compte | 2 pts]
- [ ] Spike backend (Supabase ou API maison) évalué par secdevops : auth, RLS/autorisation, secrets, journalisation, localisation des données, coût. ADR consigné.

**SEC-31 — Authentification et sessions sécurisées** [Must | 5 pts]
- [ ] Fournisseur managé ; passkeys/OAuth ; mots de passe ≥ 12 caractères vérifiés contre les fuites ; MFA disponible, obligatoire pour les admins.
- [ ] Sessions en cookies `HttpOnly; Secure; SameSite=Lax` (ou jeton en mémoire + refresh rotatif), aucun jeton dans `localStorage` ; déconnexion révoque ; protection CSRF et CORS en liste blanche.
- [ ] Rate limiting sur connexion/inscription/réinitialisation ; messages non énumérants.

**SEC-32 — Autorisation des setups et des liens de partage** [Must | 3 pts]
- [ ] Refus par défaut ; suite de tests automatisés A/B/anonyme sur chaque ressource ; clé privilégiée jamais côté client.
- [ ] Identifiants de partage aléatoires ≥ 128 bits, privé par défaut, révocables.

**SEC-33 — Conformité RGPD** [Must | 5 pts | PO + secdevops + developer]
- [ ] Registre des traitements, politique de confidentialité, CGU, âge minimum ; export et suppression du compte en self-service ; durées de conservation appliquées ; DPA des sous-traitants ; procédure de violation (72 h).

**SEC-34 — Sécurité des contenus partagés (UGC) et modération** [Must | 5 pts | lié à US-142/US-143]
- [ ] Validation serveur par `parseSetup` partagé ; texte brut uniquement ; méta OG échappées ; tests XSS stockée.
- [ ] Images ré-encodées sans métadonnées, servies depuis une origine dédiée ; limite de taille après décompression pour les partages par fragment d'URL.
- [ ] Signalement, retrait et motivation des décisions (DSA).

**SEC-35 — Anti-abus et maîtrise des coûts** [Must | 3 pts]
- [ ] Rate limiting et quotas par compte/IP ; alertes budgétaires ; CAPTCHA seulement si nécessaire (impact CSP/RGPD consigné).

**SEC-36 — Journalisation de sécurité, supervision et réponse à incident** [Must | 3 pts]
- [ ] Journal d'audit des actions sensibles ; logs sans secret ni jeton ; alertes (pics d'échecs de connexion, erreurs d'autorisation) ; runbook d'incident.

**SEC-37 — Domaine personnalisé sécurisé** [Should | 1 pt | si le PO choisit un domaine]
- [ ] DNSSEC, CAA, verrou registrar + MFA, HSTS `includeSubDomains`, procédure anti sous-domaine orphelin.

### R7

**SEC-40 — Upload sécurisé et traitement isolé (photos, glTF)** [Must | 5 pts]
- [ ] Taille et type vérifiés (octets magiques) côté client et serveur ; SVG refusé ; ré-encodage dans un bac à sable sans réseau avec limites de ressources ; conversion GLB ; contenus servis depuis une origine dédiée avec `nosniff` et `Content-Disposition` ; pas d'import par URL (ou proxy à liste blanche).

**SEC-41 — IA côté serveur : clé, quotas et coûts** [Must | 3 pts]
- [ ] Clé uniquement dans un secret manager côté serveur ; authentification requise ; quota par utilisateur et plafond global avec alerte ; sortie du modèle validée par schéma.

**SEC-42 — Confidentialité des photos** [Must | 3 pts]
- [ ] EXIF supprimés avant envoi ; consentement explicite ; photo source supprimée après génération ; DPA fournisseur sans entraînement ; information dans la politique de confidentialité.

### R8

**SEC-50 — AR à permissions minimales** [Should | 1 pt]
- [ ] Pas de `camera-access` ; `Permissions-Policy: xr-spatial-tracking=(self)` ; aucune donnée spatiale transmise ; CSP et en-têtes revus.

---

## 10. Amendements proposés aux stories existantes

| Story | Critère à ajouter |
|---|---|
| US-001 | `.npmrc`/`pnpm-workspace.yaml` avec `onlyBuiltDependencies` et `minimumReleaseAge` ; `.env` ignoré, `.env.example` factice ; `build.sourcemap` désactivé (ou `hidden` non déployé) pour le build de production. |
| US-003 | Le catalogue est validé par schéma (clés de prototype rejetées, bornes cohérentes `min ≤ défaut ≤ max`) en test. |
| US-008 / US-009 | Les paramètres de tessellation (segments, subdivisions) sont dérivés de valeurs bornées et plafonnés ; un test vérifie le nombre de triangles aux bornes min et max de chaque paramètre (≤ 10k). |
| US-018 | Fixtures malveillantes dans `tests/fixtures/setups/malicious/` (> 1 Mio, `__proto__`/`constructor` à tous les niveaux, 51 objets, `1e308`, chaîne de 1 Mo, `mount` cyclique, clé inconnue contenant du HTML, version future) toutes rejetées sans exception ; fuzzing fast-check « ne lève jamais » ; le message d'erreur n'affiche jamais le contenu du fichier ; la relecture sur événement `storage` passe par `parseSetup`. |
| US-022 | L'E2E échoue sur tout événement `securitypolicyviolation` ou erreur console CSP, sur `dist-e2e` servi avec les en-têtes de production. |
| US-023 | La capture PNG ne contient que le canvas (aucune donnée de l'interface ni métadonnée). |
| US-121, US-140 à US-143, US-151 | Dépendent respectivement de SEC-11, SEC-30 à SEC-36, SEC-40 à SEC-42. |

---

## 11. Risques acceptés

| Id | Risque | Justification | Réévaluer |
|---|---|---|---|
| M-07 | Setups lisibles sur un poste partagé | Pas de compte au MVP ; information (SEC-04) | R6 |
| M-15 | Code et structure publics | Dépôt public par choix du PO | — |
| M-26 | Dépendance à Cloudflare | Repli Netlify documenté | Avant 1.0 |
| H-S3 | Extensions de navigateur malveillantes | Hors de portée d'une application web | — |

---

## 12. Questions pour le PO

1. **Affiliation (R5)** : accepter des liens d'affiliation est-il compatible avec la promesse « neutre vis-à-vis des marques » ? Si oui, la déclaration « affiliate links » et un classement indépendant de la commission sont-ils acceptés comme règle produit ?
2. **Âge minimum (R6)** : le public gaming inclut des mineurs ; quel âge minimum pour créer un compte (13, 15 ou 16 ans) ?
3. **Hébergement des données (R6/R7)** : exiger une localisation dans l'UE pour le backend et le fournisseur IA, même si cela coûte plus cher ?
