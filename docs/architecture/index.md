# Architecture — P152 (index)

> Statut : **Accepté** par le PO le 2026-10-19 (tous les ADR-3D, ADR-APP et ADR-OPS ci-dessous). Dépôt public, GitHub + Cloudflare Pages, pas de domaine perso, écran minimal 1366×768.
> Cet index renvoie à un fichier par ADR (ancien `docs/architecture.md` découpé ; contenu inchangé). Les sections étaient partagées : la section **Scène 3D** est tenue par le graphics-engineer, la section **Application** par le developer, la section **Build / CI / déploiement** par le devops.


## Sommaire
1. Vue d'ensemble et découpage en couches (ci-dessous)
2. Scène 3D (ADR-3D-01 à ADR-3D-11)
3. Application (ADR-APP-01 à ADR-APP-11)
4. Build, CI et hébergement (ADR-OPS-01 à ADR-OPS-07)
5. Éléments transverses (récapitulatifs, sécurité transverse, dépendances, coût, points à valider) : [transverse.md](transverse.md)

## Liste des ADR

### Scène 3D

| ADR | Titre | Statut |
|---|---|---|
| [ADR-3D-01](ADR-3D-01.md) | Moteur 3D : three.js via React Three Fiber (+ drei) | Accepté |
| [ADR-3D-02](ADR-3D-02.md) | Modèle de données du setup : JSON versionné, en mm, séparé du rendu | Accepté |
| [ADR-3D-03](ADR-3D-03.md) | Modèles paramétrables : génération procédurale pilotée par le catalogue (MVP), glTF « à zones » ensuite | Accepté |
| [ADR-3D-04](ADR-3D-04.md) | Format d'assets : glTF 2.0 (GLB) + meshopt, textures KTX2, pipeline gltf-transform | Accepté |
| [ADR-3D-05](ADR-3D-05.md) | Matériaux et styles : bibliothèque de matériaux en données, slots par objet, presets déclaratifs | Accepté |
| [ADR-3D-06](ADR-3D-06.md) | Moteur de règles « ça rentre ? » : fonctions pures 2,5D dans `core/fit` | Accepté |
| [ADR-3D-07](ADR-3D-07.md) | Interactions : pointer events, picking par proxys, drag sur plan, caméra contrainte, commandes | Accepté |
| [ADR-3D-08](ADR-3D-08.md) | Performance : rendu à la demande, budgets chiffrés, paliers de qualité | Accepté |
| [ADR-3D-09](ADR-3D-09.md) | Chemin vers WebXR (AR mobile, R8) | Accepté |
| [ADR-3D-10](ADR-3D-10.md) | Scène de base (US-004) : studio validé champ par champ, vue contrainte en fonctions pures, état de la vue dans `state/` | Proposé (texte de l'ADR ; absent de la table d'acceptation ci-dessous) |
| [ADR-3D-11](ADR-3D-11.md) | Distance de la caméra selon le bureau et espace du studio (US-006, risque R11) | Accepté |

### Application

| ADR | Titre | Statut |
|---|---|---|
| [ADR-APP-01](ADR-APP-01.md) | Framework UI et build : React + TypeScript strict + Vite (SPA statique) | Accepté |
| [ADR-APP-02](ADR-APP-02.md) | État : Zustand en trois stores, commandes pures, historique par snapshots immuables | Accepté |
| [ADR-APP-03](ADR-APP-03.md) | Validation, migration et import non fiable du setup : Zod (mode jitless) + pipeline unique | Accepté |
| [ADR-APP-04](ADR-APP-04.md) | Persistance locale : `localStorage` derrière un repository asynchrone ; export/import par fichier | Accepté |
| [ADR-APP-05](ADR-APP-05.md) | i18n : i18next + react-i18next, clés typées, formatage `Intl` | Accepté |
| [ADR-APP-06](ADR-APP-06.md) | Composants accessibles : React Aria Components (headless), stylés avec nos tokens | Accepté |
| [ADR-APP-07](ADR-APP-07.md) | Structure de `src/` et règles de dépendance | Accepté |
| [ADR-APP-08](ADR-APP-08.md) | Stratégie de tests : Vitest (unitaires + composants), fixtures partagées, fuzzing de l'import | Accepté |
| [ADR-APP-09](ADR-APP-09.md) | Backend futur sans réécriture : ports et adapters, offline-first | Accepté |
| [ADR-APP-10](ADR-APP-10.md) | Socle `core/` livré en US-003 : contrats du schéma v1, du catalogue et des garde-fous | Accepté |
| [ADR-APP-11](ADR-APP-11.md) | Première interface (US-004) : tokens copiés et vérifiés, préférences locales, région live propre à la scène | Accepté |

### Build, CI et hébergement

| ADR | Titre | Statut |
|---|---|---|
| [ADR-OPS-01](ADR-OPS-01.md) | Gestionnaire de paquets et runtime : pnpm 10 + Node 24 LTS, versions épinglées | Accepté |
| [ADR-OPS-02](ADR-OPS-02.md) | Outillage qualité : ESLint 9 (flat) + typescript-eslint + Prettier + `tsc`, hooks légers | Accepté |
| [ADR-OPS-03](ADR-OPS-03.md) | CI : GitHub Actions, jobs parallèles, actions épinglées par SHA, emplacements sécurité et E2E | Accepté |
| [ADR-OPS-04](ADR-OPS-04.md) | Assets lourds : Git LFS (> 1 Mo), contrôle en CI, aucun binaire hors règles | Accepté |
| [ADR-OPS-05](ADR-OPS-05.md) | Conteneurs : pas d'image applicative au MVP ; image Playwright épinglée pour les E2E reproductibles | Accepté |
| [ADR-OPS-06](ADR-OPS-06.md) | Hébergement : Cloudflare Pages (statique), en-têtes de sécurité versionnés | Accepté |
| [ADR-OPS-07](ADR-OPS-07.md) | Environnements, branches et release : trunk-based court, `--no-ff`, semver, CHANGELOG | Accepté |

---

## 1. Vue d'ensemble et découpage en couches

Principe directeur : **la donnée du setup est la source de vérité ; la scène 3D n'est qu'une projection de cette donnée.** Aucune règle métier ne dépend du rendu.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ui/        Panneaux 2D, i18n, design system          (developer)     │
├──────────────────────────────────────────────────────────────────────┤
│ state/     Store du setup, commandes, undo/redo,     (developer,     │
│            persistance locale, import/export          avec GE)       │
├──────────────────────────────────────────────────────────────────────┤
│ render/    Scène three.js / R3F : bureau, objets,    (graphics-      │
│            caméra, picking, drag, surbrillances,      engineer)      │
│            matériaux, éclairage, qualité, XR                         │
├──────────────────────────────────────────────────────────────────────┤
│ core/      TypeScript PUR (aucun import three/React/DOM) :           │
│   schema/    schéma du setup + migrations                            │
│   catalog/   chargement/validation du catalogue (données TA)         │
│   geometry/  footprints, OBB, polygones, unités mm                   │
│   fit/       moteur de règles "ça rentre ?"                          │
│   snap/      magnétisme (grille, bords, objets)                      │
└──────────────────────────────────────────────────────────────────────┘
assets/catalog/   données du technical-artist : types d'objets, bureaux,
                  matériaux, presets de style, éclairages (JSON validé)
assets/models/    GLB optimisés (R4+), assets/textures/ KTX2, assets/env/ HDRI
```

Règles de dépendance (à faire respecter par lint, ex. `eslint-plugin-boundaries` ou `dependency-cruiser`) :
- `core/` n'importe rien d'autre que lui-même (testable en Node, sans navigateur ni GPU).
- `render/` lit `core/` et `state/` ; il n'écrit dans `state/` que via des **commandes** (move, rotate, select…).
- `ui/` ne touche jamais aux objets three.js.

### Repère et unités (convention commune)
- **Données (setup, catalogue)** : millimètres, entiers ou décimaux, angles en degrés.
- **Scène** : mètres (1 unité = 1 m). Conversion **uniquement** à la frontière `render/` (`mmToM`), jamais dans `core/`.
- Repère monde : Y vers le haut, **Y = 0 au sol**, bureau centré en X/Z sur l'origine, bord côté utilisateur vers **+Z**, X vers la droite de l'utilisateur. (Origine au sol = placement AR direct, cf. ADR-3D-09.)
- Position d'un objet dans le setup : `x`, `z` en mm **dans le repère du plateau** (origine au centre du plateau), `rotationY` en degrés ; la hauteur est déduite (posé sur le plateau ou sur un support), sauf objets montés (`mount`).

---

### Décisions du PO (2026-10-19) — statut des ADR : Accepté

| ADR | Statut | Date |
|---|---|---|
| ADR-3D-01 à ADR-3D-09 | Accepté | 2026-10-19 |
| ADR-APP-01 à ADR-APP-09 | Accepté | 2026-10-19 |
| ADR-APP-10 | Accepté (2026-10-20, revue US-003 APPROVE) | 2026-10-20 |
| ADR-APP-11 | Accepté (2026-10-20, revue US-004 APPROVE) | 2026-10-20 |
| ADR-OPS-01 à ADR-OPS-07 | Accepté | 2026-10-19 |

- **Hébergement du code** : GitHub, dépôt **public** (Actions illimité, CodeQL, rulesets avec `ci-ok` obligatoire possibles). Le dépôt distant n'est **pas encore créé** : création et premier push uniquement sur ordre explicite du PO.
- **Hébergement de l'app** : Cloudflare Pages (`*.pages.dev`), **pas de domaine personnalisé** pour l'instant. Aucun déploiement avant ordre du PO (`deploy.yml` absent).
- **Taille d'écran minimale supportée** : 1366×768 (desktop). Les budgets de perf et la QA se calent dessus.
- **Dépôt public** : aucun secret ni donnée personnelle dans l'historique ; `.env` ignoré, `.env.example` documenté.
- **Écart d'implémentation (US-001)** : `eslint-plugin-boundaries`, `eslint-plugin-i18next` et `commitlint` seront ajoutés avec les premières règles réelles (US-005) *(mise à jour US-003 et US-005 : frontières de couches et texte en dur appliqués par des règles ESLint natives et locales, voir ADR-APP-10 ; les deux plugins ont été écartés en US-005 T0, `eslint-plugin-i18next` ne couvrant pas les ternaires en mode `jsx-text-only`)* ; en attendant, ESLint recommended + react-hooks + jsx-a11y + no-eval, et `scripts/commit-msg.mjs` pour Conventional Commits. Versions d'outils choisies : ESLint 9.39, TypeScript 5.9, Vite 7, Vitest 4.1 (4.1.12 depuis la revue US-001 ; dernières majeures compatibles avec les ADR ; ESLint 10 / TS 7 / Vite 8 existent mais ne sont pas retenus).
