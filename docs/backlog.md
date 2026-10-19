# Backlog — P152 (nom provisoire du produit : « Deskfit »)

## Plan de release

| Indicateur | Valeur |
|---|---|
| Points MVP (Must + Should) | **95** (Must 85, Should 10) |
| Dont stories sécurité (SEC-01 à SEC-05) | 8 (Must 7, Should 1) |
| Points « Could » MVP (hors total, bonus) | 9 (US-021, US-023, SEC-06) |
| Points livrés | 3 (US-001 DONE le 2026-10-19 ; US-002 en cours) |
| Vitesse moyenne | 15 pts/sprint (par défaut, pas d'historique ; recalcul en fin de Sprint 1) |
| Sprints restants estimés avant MVP | **7** (92 pts restants / 15 = 6,1 arrondi à 7) |
| Dernière mise à jour | 2026-10-19 (Sprint 1 en cours : US-001 DONE, US-002 IN PROGRESS) |

Détail du recalcul : 83 pts (kickoff) + SEC-01 (3) + SEC-02 (1) + SEC-03 (2) + SEC-04 (1) + SEC-05 (1) + US-024 (2, réglages d'alertes) + US-025 (2, Help et préférences d'affichage) = **95**.
Hypothèse : le premier déploiement public n'a lieu qu'à la fin du MVP (SEC-03 avant ce déploiement, SEC-05 juste avant la release).

Légende : priorité MoSCoW, estimation en points (1, 2, 3, 5, 8). Tags `[UI]` = écran, `[3D]` = scène/rendu/assets.
Convention de langue : documents en français ; textes visibles dans l'app en **anglais** (libellés cités entre guillemets = texte UI anglais). Unités métriques (mm/cm), **sauf la diagonale d'écran affichée en pouces avec son équivalent en mm** (décision 8).
Les critères UX/UI de ce document viennent de `docs/design/ux/principes.md`, `docs/design/ux/wireframes-mvp.md` (W1 à W11) et `docs/design/ui/design-system.md`. Maquettes : `docs/design/ui/maquettes/index.html` ; DA 3D : `docs/design/3d/direction-artistique.md` ; catalogue : `docs/design/3d/assets-mvp.md` et `assets/catalog/`.

## Questions pour le PO

1. **Bornes du bureau (non bloquant avant US-006/US-007)** : US-007 et le wireframe W3 annoncent largeur 600–3000 mm, mais le catalogue du technical-artist définit largeur 800–2400, profondeur 500–1000, hauteur 600–1300 mm. Quelles bornes retenir ? Par défaut, l'équipe applique les bornes du catalogue (source de vérité exécutable) et corrige les textes UX.

### Questions ouvertes à long terme (non bloquantes pour le MVP, issues du threat model §12)
- **Affiliation (R5)** : des liens d'affiliation sont-ils compatibles avec la promesse de neutralité vis-à-vis des marques ? Si oui, déclaration « affiliate links » et classement indépendant de la commission ?
- **Âge minimum des comptes (R6)** : 13, 15 ou 16 ans ?
- **Hébergement des données dans l'UE (R6/R7)** : exigé pour le backend et le fournisseur IA, même à coût supérieur ?

---

# MVP — « Est-ce que ça rentre ? »

## Epic A — Fondations techniques

### US-001 — Setup repo, build et CI  [Must | 3 pts]
En tant qu'équipe, je veux un repo avec build, lint, tests et CI afin de livrer chaque story de façon fiable.
**État au 2026-10-19 : DONE.** Mergée dans `main` (merge `--no-ff` dfdfcfe). Revue APPROVE au cycle 2/3 (`docs/reviews/US-001.md` ; cycle 1 bloqué sur l'audit tinypool/vitest, corrigé par Vitest 4.1.12). Secdevops PASS (`docs/security/scans/US-001.md`). Checks locaux verts (`docs/ci/local-run-US-001.md`). **Écart consigné** : la CI distante n'a pas été exécutée (décision PO : pas de dépôt ni de push au Sprint 1) ; son exécution réelle est reportée au Sprint 2 (SEC-01, SEC-02).
Critères d'acceptation :
- [x] Étant donné un clone propre, quand on lance `pnpm install --frozen-lockfile` puis le build, alors il réussit sans erreur (premier `pnpm install && pnpm check` exécuté, `pnpm-lock.yaml` commité).
- [x] Étant donné les jobs de `ci.yml`, quand on lance en local les mêmes commandes que ceux-ci (lint, types, tests unitaires, build), alors tout est vert. *(Décision PO 2026-10-19 : pas de dépôt GitHub ni de push au Sprint 1 ; la vérification de l'exécution réelle de la CI sur une PR est reportée au Sprint 2.)*
- [x] Étant donné le repo, alors `.env` est dans `.gitignore` et `.env.example` existe.
- [x] Les fichiers binaires > 1 Mo sont suivis par Git LFS (`.gitattributes` présent, `check:assets` vert).
- [x] *(sécurité)* `.npmrc`/`pnpm-workspace.yaml` avec `onlyBuiltDependencies` en liste blanche et `minimumReleaseAge` (3 jours) ; `.env` ignoré, `.env.example` factice ; `build.sourcemap` désactivé (ou `hidden` non déployé) pour le build de production.
Notes techniques / dépendances : devops. Bloque toutes les autres stories. **Prérequis PO** : installer Node 24 LTS et pnpm 10.34.7 ; accord explicite pour créer le dépôt GitHub public et pousser.

### US-002 — Threat model initial  [Must | 2 pts]
En tant que PO, je veux un threat model du produit afin d'anticiper les risques de sécurité dès la conception.
**État au 2026-10-19 : IN PROGRESS** (branche `feature/US-002-threat-model`, implémenteur secdevops). Livrable produit au kickoff (`docs/security/threat-model.md` v1.0, `docs/security/ci-security.md`, brouillons `docs/security/ci/`), commité directement sur `main` (304e3f9). Reste pour la DoD : (1) relecture et mise à jour par secdevops selon les décisions PO (dépôt public, Cloudflare Pages, pas de push au Sprint 1, Vitest 4.1) et les findings du scan US-001 (`docs/security/scans/US-001.md`, dont `_headers` bloquant et findings LOW de SEC-06) ; (2) revue formelle reviewer sur le diff de la branche contre `main` (story documentaire : ni contrôle design ni QA) ; (3) merge `--no-ff` par le devops.
Critères d'acceptation :
- [x] Étant donné l'architecture MVP, quand le threat model est rédigé, alors `docs/security/threat-model.md` liste actifs, surfaces d'attaque (import de fichiers, stockage local, dépendances) et mesures.
- [x] Les scans SAST, dépendances et secrets sont définis pour la CI (`docs/security/ci-security.md`).
- [ ] Le threat model et `ci-security.md` sont cohérents avec les décisions PO et le scan US-001 (SEC-03a avant le premier push, findings LOW tracés en SEC-06, Vitest 4.1), avec liens exacts et aucun secret.
- [ ] Revue APPROVE du reviewer (3 cycles max) et merge `--no-ff` dans `main` (DoD).
Notes techniques / dépendances : secdevops. À réviser avant R6 (comptes) et R7 (import). Les stories SEC-01 à SEC-05 en sont issues.

### US-003 — Architecture socle et modèle de données du setup  [Must | 3 pts]
En tant que développeur, je veux une architecture documentée et un modèle de données versionné afin que la vision long terme (matières, éclairage, déco, partage) n'impose pas de refonte.
Critères d'acceptation :
- [ ] Étant donné `docs/architecture.md`, alors les choix de stack et leurs ADR sont consignés (fait, statut « Accepté » au 2026-10-19).
- [ ] Le schéma du setup (bureau, objets, position, rotation, paramètres, champ matériau réservé, version de schéma) est défini et validé par des tests.
- [ ] Le catalogue d'objets est décrit par des données (`assets/catalog/`), indépendamment du code de la scène.
- [ ] Les textes de l'interface passent par un système i18n (anglais par défaut ; le français reste une option ultérieure non engagée).
- [ ] *(sécurité)* Le catalogue est validé par schéma en test (clés de prototype rejetées, bornes cohérentes `min ≤ défaut ≤ max`).
Notes techniques / dépendances : developer + graphics-engineer + devops. Dépend de US-001. Le catalogue du technical-artist existe déjà (10 fichiers JSON, matériaux, styles) : la story le charge et le valide.

### SEC-01 — Pipeline sécurité en CI  [Must | 3 pts]
En tant qu'équipe, je veux que chaque PR soit scannée (secrets, SAST, dépendances, licences, workflows, build) afin qu'aucune vulnérabilité CRITICAL/HIGH ni aucun secret n'atteigne `main`.
Critères d'acceptation :
- [ ] Le slot `# SECDEVOPS-SLOT` de `ci.yml` contient les jobs de `docs/security/ci-security.md` (gitleaks, CodeQL, Semgrep, zizmor, SCA + licences, `build-hardening`) et un job agrégateur `security` requis par `ci-ok`.
- [ ] *(reporté au Sprint 2 : exige le dépôt distant, décision PO 2026-10-19)* Une PR de test contenant un faux secret, un `innerHTML`, une dépendance vulnérable HIGH, et un `dist` contenant `__p152test` fait échouer la CI (4 cas vérifiés puis annulés).
- [ ] `.gitleaks.toml`, `.semgrep/p152.yml`, `scripts/check-licenses.mjs`, `.github/dependabot.yml` et le workflow hebdomadaire sont en place ; actions et images épinglées par SHA/digest.
- [ ] *(reporté au Sprint 2 : exige le dépôt distant)* Les rapports SARIF remontent dans l'onglet Code scanning.
Notes techniques / dépendances : devops + secdevops. Dépend de US-001 (CI exécutée au moins une fois). Le contrôle `dist/_headers` de `build-hardening` **reste bloquant** (décision secdevops, scan US-001) : il n'y a pas d'avertissement toléré. La génération de `public/_headers` est donc livrée par SEC-03a **avant le premier push** (Sprint 2, en tête). Les findings LOW du scan US-001 sont regroupés dans SEC-06.

### SEC-02 — Durcissement du dépôt GitHub public  [Must | 1 pt]
En tant qu'équipe, je veux un dépôt public durci afin de réduire le risque de compromission de la chaîne de production.
Critères d'acceptation :
- [ ] MFA actif sur les comptes ayant un accès en écriture.
- [ ] Ruleset sur `main` : PR obligatoire, `ci-ok` requis, résultats Code scanning (≥ High) bloquants, force-push et suppression interdits.
- [ ] Secret scanning + push protection, Dependabot alerts, private vulnerability reporting activés ; `SECURITY.md` publié.
- [ ] Actions : `GITHUB_TOKEN` en lecture seule par défaut, approbation requise pour les workflows des contributeurs externes, épinglage SHA obligatoire si l'option est disponible.
- [ ] `CODEOWNERS` couvre `.github/`, `config/security-headers.mjs`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, `.gitleaks.toml`, `.semgrep/`.
Notes techniques / dépendances : devops. **Les réglages du compte/dépôt GitHub ne sont appliqués qu'avec l'accord explicite du PO** (le PO réalise ou valide chaque action). Dépend de US-001 et de la création du dépôt distant.

### SEC-03a — Génération des en-têtes de sécurité (`_headers`, CSP)  [Must, avant le premier push | 1 pt]
En tant qu'équipe, je veux que le build produise les en-têtes de sécurité afin que le contrôle `build-hardening` passe et que le premier push n'échoue pas.
Critères d'acceptation :
- [ ] Étant donné `config/security-headers.mjs` (source unique), quand on lance le build, alors `public/_headers` est généré et `dist/_headers` existe avec CSP stricte sans `unsafe-inline`/`unsafe-eval`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP, HSTS.
- [ ] Un test unitaire vérifie que le contenu de `dist/_headers` correspond à `config/security-headers.mjs` ; le contrôle `dist/_headers` de `sec-build-hardening` (ci.yml) est vert, sans avertissement toléré.
- [ ] Le preview/E2E servi avec ces en-têtes ne produit aucune violation CSP en console.
Notes techniques / dépendances : devops + secdevops. **Sprint 2, en tête, avant tout push** (décision secdevops : contrôle bloquant). Dépend de US-001 (DONE). Débloque SEC-01 (jobs) et US-022 (E2E sous CSP).

### SEC-03b — Déploiement sécurisé sur Cloudflare Pages  [Must avant le premier déploiement | 1 pt]
En tant qu'équipe, je veux un déploiement protégé afin qu'aucun bundle altéré n'atteigne les utilisateurs.
Critères d'acceptation :
- [ ] Environnement GitHub `production` : approbation du PO, déploiement depuis les tags `v*` uniquement ; secrets Cloudflare présents uniquement dans cet environnement (et `preview` séparé avec son propre jeton).
- [ ] Jeton Cloudflare à portée « Pages : Edit » sur le seul compte ; MFA Cloudflare ; procédure de rotation écrite dans `docs/security/`.
- [ ] Après chaque déploiement, un contrôle automatique lit les en-têtes de l'URL réelle et échoue si un en-tête diffère de `config/security-headers.mjs`.
- [ ] Les previews portent `X-Robots-Tag: noindex` et ne sont jamais construites depuis un fork.
Notes techniques / dépendances : devops + secdevops. Dépend de SEC-03a et SEC-02. À livrer avant le premier déploiement, sur ordre du PO. Pas de domaine personnalisé (`*.pages.dev`).

### SEC-06 — Durcissement CI (findings LOW du scan US-001)  [Could | 2 pts, priorité basse]
En tant qu'équipe, je veux traiter les findings LOW du scan US-001 afin de réduire la surface de la chaîne CI. À planifier après SEC-01 (peut être pris en tâches dans SEC-01 si de la place).
Critères d'acceptation :
- [ ] `persist-credentials: false` sur les `actions/checkout` des jobs `quality`, `unit`, `build` et `assets` de `ci.yml` (zizmor sans alerte `artipacked`).
- [ ] `id-token: write` retiré de `security-scheduled.yml` (permissions minimales par job).
- [ ] `security-scheduled.yml` exécute aussi gitleaks (historique complet) et CodeQL en hebdomadaire.
- [ ] zizmor est installé à version et empreinte fixées (hash vérifié), plus via `uvx` sans empreinte.
- [ ] Dependabot (`docker-compose`) suit les digests des images semgrep et playwright, ou une procédure de mise à jour documentée les remplace.
- [ ] Migration d'ESLint 9 (déprécié) vers la version supportée, ADR consigné, `pnpm check` vert.
Notes techniques / dépendances : devops + secdevops. Source : `docs/security/scans/US-001.md`. Hors total MVP (Could).

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
Critères d'acceptation :
- [ ] Étant donné la scène, quand je fais glisser la souris (clic gauche sur le vide), alors la caméra tourne autour du bureau.
- [ ] Quand j'utilise la molette, alors la caméra zoome entre une distance min et max sans traverser le bureau ni passer sous le plateau.
- [ ] Quand je fais un clic droit glissé, alors la scène se déplace (pan) dans des limites définies.
- [ ] Un bouton "Reset view" restaure la vue par défaut ; des boutons "Top" et "Front" (décision PO) placent la vue de dessus / de face (`aria-pressed` sur la vue active, info-bulle sur chacun, accessibles au clavier).
- [ ] Les libellés visibles n'emploient pas de jargon 3D ("orbit", "pan", "mesh") ; une astuce "Drag to turn the view, scroll to zoom, right-drag to move the view" est affichée (masquable).
- [ ] Les transitions de caméra (480 ms, courbe `in-out`) sont désactivées sous `prefers-reduced-motion` (saut direct à la vue).
- [ ] Le rendu est de type « photo produit en studio » (fond clair continu, éclairage doux, ombres de contact douces) ; les tokens `--scene-*` donnent un studio clair en thème clair et anthracite en thème sombre.
- [ ] Le rendu tient ≥ 60 FPS sur desktop milieu de gamme avec une scène vide et un bureau, à 1366×768 minimum. Unités : mètre, origine au sol.
- [ ] Les entrées utilisent les Pointer Events (préparation du tactile, US-021).

Critères UX testables (source : `docs/design/ux/stories/US-004.md` §7) :
- [ ] UX-1 Au chargement, "Loading 3D scene…" est visible avec `role="progressbar"` ; à la fin, "3D view ready. Desk 140 by 70 cm." est annoncé dans la zone `aria-live="polite"` et le canvas occupe la même place sans décalage de mise en page.
- [ ] UX-2 La barre de vue (`role="toolbar"`, `aria-label="View"`) affiche, avec libellés visibles et icônes, "Reset view", "Top", "Front" ; chaque bouton mesure ≥ 32 px de haut (jamais < 24 px) et sa zone de clic est séparée de ≥ 8 px de la suivante.
- [ ] UX-3 Tab atteint dans l'ordre : scène → Reset view → Top → Front → "Got it" → "Hide tip" ; aucun piège clavier ; l'anneau de focus est visible (contraste ≥ 3:1) sur fond clair et sombre, et n'est pas masqué par l'astuce.
- [ ] UX-4 Chaque bouton de vue affiche une info-bulle après ~400 ms au survol **et** au focus clavier ("Reset view (0)", "View from above (1)", "View from the front (2)") ; Échap la ferme sans quitter le focus.
- [ ] UX-5 Après clic ou Entrée/Espace sur Top, `aria-pressed="true"` sur Top uniquement, coche + contour visibles (pas la couleur seule) ; annonce "Top view." ; après un glisser, un zoom ou Reset view, plus aucun bouton n'est pressé.
- [ ] UX-6 Reset view ramène exactement la vue par défaut depuis n'importe quelle vue, y compris après des limites atteintes ; Top montre le plateau entier, à plat, bord arrière en haut ; Front montre le bureau entier de face.
- [ ] UX-7 Clic gauche glissé sur le vide tourne la vue ; molette zoome ; clic droit glissé déplace la vue, sans menu contextuel du navigateur ; la vue ne passe jamais sous le plateau/sol ; le zoom ne traverse jamais le bureau ; au zoom max (éloigné) le bureau reste visible et le déplacement ne le sort jamais complètement du cadre.
- [ ] UX-8 Au clavier, viewport focalisé : flèches tournent (15° gauche/droite, 10° haut/bas), + / - zooment (pas de 10 %), Maj+flèches déplacent, 0/1/2 activent Reset/Top/Front ; ces touches n'agissent pas hors du viewport ; une annonce unique est émise après 600 ms d'inactivité, aucune pendant un glisser souris.
- [ ] UX-9 Une transition de vue dure 480 ms (courbe `in-out`) ; une action de l'utilisateur pendant la transition l'interrompt sans à-coup.
- [ ] UX-10 Avec `prefers-reduced-motion: reduce`, Reset/Top/Front sautent à la vue sans animation, sans inertie ; la barre de chargement est statique.
- [ ] UX-11 L'astuce "Drag to turn the view, scroll to zoom, right-drag to move the view." est visible à la première visite ; "Got it" ou "Hide tip" la masque, le focus passe sur Reset view, et elle ne réapparaît pas après rechargement (préférence locale).
- [ ] UX-12 Barre et astuce sont en verre ≥ 86 % d'opacité avec repli opaque (sans `backdrop-filter`, avec `prefers-reduced-transparency`) ; texte ≥ 4,5:1 et icônes ≥ 3:1 sur studio clair et sombre ; texte ≥ 14 px.
- [ ] UX-13 Si WebGL 2 est indisponible, le message "The 3D view can't start" (`role="alert"`, focus sur le titre) et "Try again" remplacent la scène ; aucune barre de vue ; aucune exception non gérée en console ; "Try again" relance l'initialisation. Contexte perdu : "The 3D view stopped".
- [ ] UX-14 L'interface de la scène reste utilisable à 200 % de zoom navigateur et à 1366×768 : la barre ne recouvre pas le bureau au cadrage par défaut ; l'astuce reste lisible sans masquer la barre.
- [ ] UX-15 Aucun libellé visible, info-bulle ou annonce ne contient "orbit", "pan", "mesh" ou "camera".

Décisions UX **VALIDÉES par le PO le 2026-10-19** :
- Astuce masquée : reste masquée définitivement tant que Help (US-025) n'existe pas ; rouvrable via Help en US-025.
- Raccourcis 0 / 1 / 2 pour Reset / Top / Front : acceptés, actifs seulement quand la scène a le focus (WCAG 2.1.4).
- Message WebGL indisponible : texte neutre, **sans nom d'application** (ni « Deskfit » ni autre) ; texte isolé dans les fichiers i18n.

Notes techniques / dépendances : graphics-engineer + technical-artist ; ux-designer/ui-designer pour la barre flottante de scène. Dépend de US-001, US-003. Références : maquette `docs/design/ui/maquettes/index.html` (barre de scène), `docs/design/3d/apercu/index.html`, `docs/design/3d/direction-artistique.md` §3 et §10, wireframe W2.
Références de design US-004 : UX `docs/design/ux/stories/US-004.md` ; maquette `docs/design/ui/maquettes/US-004.html` (**section 7 = consignes developer**, `docs/design/ui/design-system.md` §14) ; paramètres de scène `assets/catalog/scene/studio.json` ; spécification 3D `docs/design/3d/US-004-scene.md` (transition caméra 480 ms, cible (0 ; 0,72 ; 0), caméra jamais sous Y = 0,9 m ni dans le bureau).

### US-005 — Shell de l'application en anglais  [UI] [Must | 5 pts]
En tant qu'utilisateur, je veux une interface claire en anglais (zone 3D, panneau d'objets, panneau de propriétés, alertes) afin de m'y repérer sans aide.
Critères d'acceptation :
- [ ] Étant donné l'app, quand elle se charge, alors la mise en page (wireframe W2) affiche la scène plein viewport avec top bar, panneau gauche (onglets Desk / Objects), panneau droit (Properties puis Alerts) et astuce en pied, en panneaux flottants ; les deux panneaux latéraux sont repliables.
- [ ] Tous les textes visibles sont en anglais et proviennent des fichiers i18n (aucun texte en dur dans les composants) ; `lang="en"` sur le document ; la structure permet d'ajouter une langue plus tard.
- [ ] Les composants respectent le design system (tokens générés depuis `docs/design/ui/tokens.css`, aucune couleur/taille en dur) et l'accessibilité WCAG 2.2 AA (contraste 4,5:1 texte / 3:1 éléments, focus visible non masqué, libellés, cibles ≥ 32 px, texte ≥ 14 px, reflow à 200 % de zoom, mise en page valide dès 1366×768).
- [ ] Effet de verre : panneaux et barres flottants utilisent le verre à **86 % d'opacité minimum** (flou 24 px) ; fond **opaque de repli** (sans flou) quand `backdrop-filter` n'est pas supporté, quand `prefers-reduced-transparency: reduce`, ou quand la classe `.no-glass` est posée (option "Reduce transparency", voir US-025) ; l'interface reste identique, seul le flou disparaît. Les contrastes AA sont tenus sur le pire fond possible.
- [ ] `prefers-reduced-motion: reduce` neutralise animations et transitions (durées à 0, pas d'effet d'appui, barre de chargement statique).
- [ ] Le thème par défaut suit le système (`prefers-color-scheme`) ; thèmes clair et sombre fonctionnels.
- [ ] Ordre de tabulation : top bar → panneau gauche → scène → panneau droit ; liens "Skip to 3D view" et "Skip to alerts" en tête.
- [ ] **Inter auto-hébergée** : fichier `public/fonts/inter-latin-wght-normal.woff2` servi en same-origin (`font-src 'self'`, aucune requête tierce), `@font-face` avec `font-display: swap` et repli système, précharge dans `index.html` ; **licence SIL OFL 1.1 consignée** (`public/fonts/OFL.txt` + entrée dans `docs/design/3d/licences-assets.md`/`THIRD_PARTY_LICENSES`). Icônes Lucide (ISC, licence conservée) ; aucune police ni icône Apple.
- [ ] Les états vide, chargement ("Loading 3D scene…", barre `role="progressbar"`, shell visible) et erreur / navigateur sans WebGL (W11) sont définis.
- [ ] Le nom provisoire « Deskfit » est un mot-symbole texte (pas d'asset logo).
Notes techniques / dépendances : ux-designer, ui-designer, developer. Dépend de US-001. Références : maquette `docs/design/ui/maquettes/index.html`, `docs/design/ui/design-system.md` §2–§5 et §9, wireframes W2 et W11. Les ESLint `boundaries` et `i18next` arrivent avec cette story (écart ADR consigné).

## Epic C — Bureau

### US-006 — Choisir un bureau dans un catalogue  [UI][3D] [Must | 5 pts]
En tant qu'utilisateur, je veux choisir un bureau parmi des modèles aux dimensions réelles afin de partir de mon vrai mobilier.
Critères d'acceptation :
- [ ] Étant donné le panneau gauche, alors un onglet **"Desk"** (à côté de "Objects", contrôle segmenté, wireframe W3) liste au moins 5 bureaux types (ex. 120×60, 140×70, 160×80, 180×80 cm, bureau d'angle) sous forme de cartes avec dimensions en cm/mm.
- [ ] Quand je clique une carte, alors le bureau est appliqué immédiatement (carte active : contour accent 2 px + coche, pas la couleur seule), il apparaît à l'échelle réelle (1 m = 1 unité) et le choix est annoncé aux lecteurs d'écran.
- [ ] Quand je change de bureau, alors les objets déjà posés sont conservés et les alertes recalculées.
- [ ] Le bureau a un plateau et des pieds lisibles ; hauteur standard 720-750 mm par défaut.
- [ ] Au tout premier lancement, le même sélecteur est proposé en modale ("Choose your desk", bouton "Use this desk") si la story US-020 est livrée ; sinon le Studio s'ouvre sur le bureau par défaut (140×70 cm).
Notes techniques / dépendances : technical-artist (`assets/catalog/object-types/desk.json`, presets compact/standard/large existants ; le bureau d'angle `desk.corner` reste à produire), graphics-engineer, developer pour l'onglet. Dépend de US-004, US-005. Références : wireframe W3, maquettes du panneau gauche. Voir la question sur les bornes des dimensions.

### US-007 — Dimensions personnalisées du bureau  [UI] [Should | 3 pts]
En tant qu'utilisateur, je veux saisir largeur, profondeur et hauteur de mon bureau afin de refléter exactement le mien.
Critères d'acceptation :
- [ ] Étant donné un bureau sélectionné, quand je déplie "Custom size" (replié par défaut) et saisis des valeurs, alors le bureau est redimensionné en temps réel.
- [ ] Les valeurs hors bornes sont refusées avec un message sous le champ, relié par `aria-describedby`, ex. "Enter a width between X and Y mm." (bornes = celles du catalogue, voir question PO) ; l'ancienne valeur est conservée et le focus revient au champ en erreur.
- [ ] Les champs sont des NumberField avec libellé visible, suffixe "mm", pas 10 mm (Maj 1, Ctrl 100).
- [ ] Les alertes sont recalculées après modification.
Notes techniques / dépendances : dépend de US-006. Wireframes W3 et W7.

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
Notes techniques / dépendances : developer, ui-designer. Dépend de US-005. Référence : wireframe W10, design system §2 et §5. Reçoit la mention de confidentialité de SEC-04.

### US-022 — Budgets de performance et tests E2E de référence  [Must | 3 pts]
En tant qu'équipe, je veux des tests E2E et une mesure de perf automatisés afin de protéger la qualité à chaque story.
Critères d'acceptation :
- [ ] Un scénario E2E (choisir bureau, ajouter 3 objets, déplacer, déclencher une alerte, recharger) passe en CI.
- [ ] Une mesure de FPS est enregistrée sur une scène de 20 objets avec seuil d'échec configurable (viewport minimal 1366×768).
- [ ] Des captures sont archivées comme artefacts.
- [ ] *(sécurité)* L'E2E échoue sur tout événement `securitypolicyviolation` ou erreur console CSP, sur `dist-e2e` servi avec les en-têtes de production.
Notes techniques / dépendances : qa-tester + devops. Dépend de US-012, US-017, US-018, SEC-03a (en-têtes). Ossature Playwright déjà présente (`tests/e2e/`).

### US-021 — Utilisation tactile et mobile  [UI] [Could | 5 pts]
En tant qu'utilisateur mobile, je veux manipuler la scène au doigt afin de consulter mon setup sur smartphone.
Critères d'acceptation :
- [ ] Orbite à un doigt, zoom en pincement, déplacement d'un objet au doigt.
- [ ] Mise en page adaptée en largeur 360 px ; ≥ 30 FPS sur smartphone récent.
Notes techniques / dépendances : desktop d'abord (décision PO, min 1366×768), tactile en Could. Pointer events dès US-004.

### US-023 — Capture d'écran du setup  [UI][3D] [Could | 2 pts]
En tant qu'utilisateur, je veux exporter une image de mon setup afin de le montrer à mes proches.
Critères d'acceptation :
- [ ] Un bouton télécharge un PNG de la vue courante sans interface.
- [ ] *(sécurité)* La capture PNG ne contient que le canvas (aucune donnée de l'interface ni métadonnée).
Notes techniques / dépendances : prépare le partage (R6).

**Récapitulatif MVP** : Must 85 pts (US-001 à 006, 008 à 018, 022, 024, 025, SEC-01, 02, 03a, 03b, 05) ; Should 10 pts (US-007, 019, 020, SEC-04) ; Could 9 pts (US-021, 023, SEC-06, hors total). Total MVP : **95 pts**.

---

# Plus tard — vision long terme (stories de haut niveau, à détailler avant leur sprint)

Les ids US-1xx sont provisoires. Estimations indicatives (epic-level) ; toute story > 8 pts sera redécoupée. Les stories de sécurité SEC-1x et suivantes proviennent du threat model (§9) et conditionnent les stories fonctionnelles de leur release.

## Option i18n — Langue secondaire française (non engagée)
- US-100 — Traduction française de l'interface via les fichiers i18n existants [UI] ~3 (option, à décider par le PO)

## R2 — Style : couleurs, matières, styles en un clic
- US-101 — Couleur et matière par objet (noir mat, blanc, bois, métal, etc.) [UI][3D] [Should] ~8
- US-102 — Bibliothèque de matériaux PBR optimisés [3D] [Should] ~5
- US-103 — Styles en un clic : all white, all black, coloré, cosy (le style Cosy, plus chaud et plus sombre, est conservé) [UI][3D] [Should] ~8
- US-104 — Aperçu avant/après d'un style [UI] [Could] ~3
- **SEC-10 — Activation encadrée de `'wasm-unsafe-eval'` pour meshopt/KTX2** [Must à la 1re story qui charge un GLB/KTX2 | 1 pt] : ADR consigné ; décodeurs servis depuis l'origine, versions épinglées, empreinte vérifiée au build ; le contrôle CI accepte `'wasm-unsafe-eval'` et refuse toujours `'unsafe-eval'`.
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
- **SEC-11 — Ingestion sécurisée des modèles et textures tiers** [Must | 3 pts] : provenance (URL, auteur, licence SPDX, date, SHA-256) ; licences admises CC0 et CC-BY 4.0 (attribution affichée) ; `gltf-validator` sans erreur, ré-export `gltf-transform`, aucune `uri` externe ; tests avec glTF piégés.
- **SEC-12 — Intégrité du catalogue distant** [Should | 2 pts, si le catalogue sort du bundle] : manifeste versionné avec SHA-256 par fichier, servi depuis l'origine, validation par schéma.
- Revue du threat model au début de R4.

## R5 — Courses et catalogue produits
- US-130 — Catalogue de vrais produits neutre vis-à-vis des marques (dimensions réelles) [UI] ~8
- US-131 — Liste de courses avec prix total [UI] ~5
- US-132 — Remplacer un objet générique par un produit réel [UI][3D] ~5
- US-133 — Mise à jour des prix et données produits (source à définir) ~8
- **SEC-20 — Liens sortants et affiliation sûrs et transparents** [Must | 3 pts] : le setup ne contient que `productId` ; URL du seul catalogue de confiance, `https:` et domaine en liste blanche ; `rel="noopener noreferrer sponsored"` ; mention « affiliate links » ; aucun script tiers. Soumise à la question d'affiliation du PO.
- **SEC-21 — Intégrité et fraîcheur des données produits et prix** [Should | 3 pts] : source et date affichées, prix masqué au-delà d'un âge configurable, secrets marchands côté serveur, récupération limitée à une liste blanche d'hôtes (anti-SSRF).
- Revue du threat model au début de R5.

## R6 — Comptes, partage, communauté
- US-140 — Comptes utilisateurs et sauvegarde cloud [UI] ~8
- US-141 — Partage d'un setup par lien [UI] ~5
- US-142 — Galerie d'inspiration communautaire [UI] ~8
- US-143 — Modération et signalement ~5
- **SEC-30 — Révision du threat model et ADR de backend sécurisé** [Must, avant toute story de compte | 2 pts] : spike backend (Supabase ou API maison) évalué par secdevops.
- **SEC-31 — Authentification et sessions sécurisées** [Must | 5 pts]
- **SEC-32 — Autorisation des setups et des liens de partage** [Must | 3 pts]
- **SEC-33 — Conformité RGPD** [Must | 5 pts] (dépend des questions PO : âge minimum, hébergement UE)
- **SEC-34 — Sécurité des contenus partagés (UGC) et modération** [Must | 5 pts]
- **SEC-35 — Anti-abus et maîtrise des coûts** [Must | 3 pts]
- **SEC-36 — Journalisation de sécurité, supervision et réponse à incident** [Must | 3 pts]
- **SEC-37 — Domaine personnalisé sécurisé** [Should | 1 pt, seulement si le PO choisit un domaine ; aucun domaine pour l'instant]
- Dépendances : US-140 à US-143 dépendent de SEC-30 à SEC-36.

## R7 — Import d'objets personnels
- US-150 — Spike : faisabilité photo vers 3D par IA (coût, qualité) ~3
- US-151 — Import photo vers objet 3D [UI][3D] ~8 — **dépend de SEC-40 à SEC-42**
- US-152 — Calage des dimensions réelles d'un objet importé [UI][3D] ~5
- **SEC-40 — Upload sécurisé et traitement isolé (photos, glTF)** [Must | 5 pts]
- **SEC-41 — IA côté serveur : clé, quotas et coûts** [Must | 3 pts]
- **SEC-42 — Confidentialité des photos** [Must | 3 pts]
Prérequis : threat model upload, quotas.

## R8 — Réalité augmentée mobile
- US-160 — Spike WebXR / alternatives ~3
- US-161 — Affichage du setup en AR à l'échelle réelle [UI][3D] ~8
- **SEC-50 — AR à permissions minimales** [Should | 1 pt] : pas de `camera-access`, `Permissions-Policy: xr-spatial-tracking=(self)`, aucune donnée spatiale transmise.

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
14. **GitHub + Cloudflare Pages**, **dépôt public**, **pas de domaine personnalisé** (`*.pages.dev`). → US-001, SEC-02, SEC-03 ; SEC-37 reste en « Plus tard ». Aucun push ni déploiement sans ordre explicite du PO.

## Style (validées le 2026-10-19)
15. **Direction visuelle inspirée du langage visuel d'Apple sans rien copier de protégé** : Inter auto-hébergée + Lucide ; pas de SF Pro, SF Symbols, logo ni mise en page Apple. → US-005.
16. **Verre à 86 % d'opacité minimum** avec repli opaque. → US-005.
17. **Option "Reduce transparency" dans Help**, en plus de la préférence système `prefers-reduced-transparency`. → US-025.
18. **Style « Cosy » plus chaud et plus sombre conservé** (R2, US-103).
19. **Nom provisoire « Deskfit »**.
20. **Thème par défaut = système** (clair/sombre). → US-005, US-025.
21. **Rendu 3D « photo produit en studio »**. → US-004.

## Questions encore ouvertes (long terme, non bloquantes)
- Affiliation compatible avec la neutralité de la marque (R5, threat model §12 q.1).
- Âge minimum des comptes (R6, §12 q.2).
- Hébergement des données dans l'UE (R6/R7, §12 q.3).
- Bornes des dimensions du bureau (voir « Questions pour le PO », en tête de document ; à trancher avant US-006/US-007).
