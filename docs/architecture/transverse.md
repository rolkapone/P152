# Architecture — éléments transverses

> Index des ADR : [index.md](index.md). Récapitulatifs, sécurité transverse, dépendances, coût et points à valider, découpés de l'ancien `docs/architecture.md` (contenu inchangé, ordre d'origine).

### Récapitulatif des choix 3D

| Sujet | Choix | Écarté |
|---|---|---|
| Moteur | three.js + R3F + drei, WebGL2 (WebGPU spike R3) | Babylon.js, PlayCanvas, Unity/Godot Web, WebGL brut |
| Données du setup | JSON `schemaVersion` + migrations, mm, Zod, séparé du rendu | Scène three.js/glTF sérialisée, binaire, mètres |
| Modèles | Procédural piloté par catalogue (MVP), glTF à zones (R4+) | glTF par variante, scale non uniforme, CSG runtime |
| Assets | GLB + meshopt, KTX2 (Basis), gltf-transform en CI | FBX/OBJ, Draco seul, PNG/JPEG GPU |
| Matériaux | Bibliothèque en données, slots à rôles, presets déclaratifs | Matériaux en dur, couleur libre seule, MaterialX |
| Règles | `core/fit` pur 2,5D (OBB/SAT, polygones), Vitest | Physique, Box3 sur meshes, collisions mesh BVH |
| Interactions | Pointer events, proxys, drag sur plan, camera-controls, commandes | TransformControls, OrbitControls, drag physique, picking GPU |
| Perf | Rendu à la demande, budgets chiffrés, paliers adaptatifs | Boucle continue, lightmaps, ombres multi-lumières |
| XR | Origine au sol, @react-three/xr, repli USDZ | model-viewer, SDK commercial, natif |
| Scène de base (US-004) | Studio validé puis projeté, camera-controls + maths pures, état de vue dans `state/` | drei `<CameraControls>`, studio strict, cible abaissée |
| Distance et studio (US-006) | Distance max par bureau (fenêtres de référence), espace du studio borne chaque pose | cyclo agrandi, borne fixe plus haute, azimut limité |

### Points à trancher avec le developer (ADR applicatifs)
- Framework UI et outil de build (préférence 3D : React + Vite + TypeScript strict).
- Store et historique (préférence 3D : Zustand ; commandes sérialisables pour l'undo, un drag = une commande).
- Bibliothèque de validation de schéma (préférence 3D : Zod, partagée par `core/schema`, l'import JSON et les tests).
- i18n (les `messageKey` des alertes sont produits par `core/fit`, traduits par l'UI).
- Contrat d'exposition des mesures de perf pour la QA (`window.__p152perf` en build de test uniquement).

---

## 3. Application

> Rédigé par le developer (kickoff, 2026-10-19), en cohérence avec la section 1 et les ADR-3D. Aucune ligne de code n'existe encore : les noms de fichiers sont des cibles, pas un existant.

Contraintes d'entrée : UI en anglais avec i18n prête pour une 2e langue, pas de compte ni backend au MVP, sauvegarde locale + export/import JSON, desktop d'abord, WCAG 2.2 AA, un seul écran « Studio » (panneaux + modales), vision long terme jusqu'à R8.

### Sécurité transverse de l'application (entrée pour le threat model US-002)

- Entrées non fiables : stockage local, fichier importé, plus tard URL de partage et API. Toutes passent par `parseSetup` (taille ≤ 1 Mio, ≤ 50 objets, schéma strict, bornes, pas de clés de prototype).
- Aucun `eval`, `new Function` (Zod jitless), `dangerouslySetInnerHTML` ni `innerHTML` (règles ESLint `no-eval`, `react/no-danger`).
- CSP cible (posée par le devops à l'hébergement) : `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests`. **Valeur identique à celle d'ADR-OPS-06, qui fait référence** ; la seule source de vérité exécutable sera `config/security-headers.mjs` (SEC-03a). Toute modification se fait d'abord dans ADR-OPS-06 puis dans ce fichier, jamais ici seule.
- Pas de dépendance chargée depuis un CDN tiers à l'exécution (cohérent avec ADR-3D-04).
- Aucun secret côté client, ni au MVP ni après (les clés d'API futures vivent côté serveur).

### Dépendances applicatives proposées (justification)

| Dépendance | Rôle | Pourquoi plutôt qu'une alternative |
|---|---|---|
| react, react-dom, vite, typescript | Socle (APP-01) | Imposé par R3F ; Vite standard actuel |
| zustand | État (APP-02) | Store hors React pour le drag ; Redux plus verbeux |
| zod | Schéma (APP-03) | Types dérivés, mode jitless ; Ajv exige `new Function` |
| i18next, react-i18next | i18n (APP-05) | Standard, pluriels, chargement paresseux ; maison = réinventer |
| react-aria-components | Accessibilité (APP-06) | Couvre NumberField et i18n des nombres ; Radix non |
| lucide-react (1.61.0 exacte, ISC, US-005) | Icônes (design-system §6) | Icônes au trait libres, une par module (tree-shaking), sans dépendance ni style inline (CSP) ; SF Symbols interdits, tracés recopiés à la main = maintenance sans suivi de licence. Licence livrée dans `THIRD_PARTY_LICENSES.md` du build |
| vitest, @testing-library/react, @testing-library/dom, @testing-library/user-event, jsdom, axe-core, fast-check | Tests (APP-08) | Un seul runner ; fuzzing de l'import ; axe-core direct plutôt que vitest-axe non maintenu (ADR-APP-11) |
| *(aucune)* : règles ESLint natives + règles locales `config/eslint-plugin-p152.mjs` | Garde-fous (APP-07, APP-05) | Couches et « pas de texte en dur » vérifiées en CI sans dépendance ; `eslint-plugin-boundaries` et `eslint-plugin-i18next` écartés (ADR-APP-10) |

### Récapitulatif des choix applicatifs

| Sujet | Choix | Écarté |
|---|---|---|
| Framework / build | React 19 + TS strict + Vite, SPA statique | Svelte/Threlte, Vue/TresJS, Next.js SSR, CRA/webpack |
| État / undo | Zustand (document, session, transient), commandes pures, snapshots immuables, coalescence | Redux Toolkit, zundo, Valtio/MobX, commandes inverses |
| Schéma / import | Zod jitless, pipeline `parseSetup` unique, 1 Mio, 50 objets | Ajv, Valibot, type guards maison |
| Persistance | `localStorage` derrière `SetupRepository` async ; IndexedDB à R4/R7 ; export/import fichier | IndexedDB dès le MVP, OPFS, URL, File System Access |
| i18n | i18next + react-i18next, clés typées, `Intl` | react-intl, Lingui, maison |
| Composants a11y | React Aria Components + wrappers stylés par tokens | Radix, MUI/Chakra/Mantine, maison |
| Structure | Couches `core/state/persistence/render/ui/app`, lint de frontières | Par feature, monorepo immédiat, par type technique |
| Tests | Vitest Node + jsdom, RTL, axe, fast-check, seuils en cliquet | Jest, browser mode partout, snapshots DOM |
| Backend futur | Ports/adapters, offline-first, validation partagée ; Supabase ou API maison à trancher avant R5/R6 | Backend au MVP, accès direct au stockage, fournisseur choisi maintenant |

---

## 4. Build, CI et hébergement

> Rédigé par le devops (kickoff, 2026-10-19). **Proposition : rien n'est initialisé, poussé ni déployé.** Le repo (US-001) est créé après validation de la stack par le PO ; tout remote, compte d'hébergement ou déploiement exige l'accord explicite du PO. Les noms de fichiers sont des cibles. Environnement de l'équipe : **Windows 11** (PowerShell / Git Bash) : tous les scripts du projet sont écrits en **Node (`.mjs`) ou en scripts de `package.json`**, jamais en bash/Makefile Unix-only.

Principes : (1) une commande locale `pnpm check` rejoue exactement ce que fait la CI ; (2) CI = source de vérité, les hooks locaux ne sont qu'un confort ; (3) tout est épinglé (Node, pnpm, actions, images) ; (4) coût cible **0 €** ; (5) un seul fichier source pour les en-têtes de sécurité, utilisé par le build, le serveur de preview E2E et l'hébergeur.

### Coût (objectif : 0 € / quasi gratuit)

| Poste | Choix | Coût |
|---|---|---|
| Dépôt + CI | GitHub (Actions illimité sur dépôt public, 2 000 min/mois sur privé), Dependabot, CodeQL (public) | 0 € |
| Hébergement + previews + CDN | Cloudflare Pages, plan gratuit | 0 € |
| Git LFS | Quota gratuit GitHub (à surveiller dès R2) ; au-delà, forfait de données ou stockage externe | 0 € au MVP |
| Outils (pnpm, ESLint, Prettier, Vitest, Playwright, gltf-transform, gitleaks) | Open source | 0 € |
| Nom de domaine | Optionnel, sur décision du PO | ~10 €/an |
| Backend / Auth / base | Aucun au MVP (ADR-APP-09) ; Supabase ou API maison à chiffrer avant R5/R6 | 0 € au MVP |

### Récapitulatif des choix build / CI / hébergement

| Sujet | Choix | Écarté |
|---|---|---|
| Paquets / runtime | pnpm 10 + Node 24 LTS épinglés, scripts d'install en liste blanche, Dependabot | npm, Yarn, Bun |
| Qualité | ESLint 9 flat + typescript-eslint + Prettier + `tsc`, hooks légers (simple-git-hooks, lint-staged, commitlint) | Biome, Husky/pas de hooks, dprint/Standard |
| CI | GitHub Actions, jobs parallèles, actions épinglées par SHA, slots `e2e` (qa) et `security` (secdevops), `ci-ok` | job unique, GitLab/CircleCI/Jenkins, tags mobiles, Turborepo/Nx |
| Assets | Git LFS pour binaires > 1 Mo, `check-assets` sur budgets TA + licences | binaires dans Git, bucket externe, dépôt séparé |
| Conteneurs | Aucun pour l'app ; image Playwright épinglée pour E2E (compose + CI) ; FPS réels mesurés hors CI | devcontainer complet, nginx dès le MVP, Playwright nu |
| Hébergement | Cloudflare Pages + `_headers` + CSP stricte (sans `unsafe-eval`), déploiement CI sur ordre du PO | GitHub Pages (pas d'en-têtes), Netlify (repli), Vercel, VPS/S3 |
| Branches / release | trunk-based, `feature/*` + `--no-ff`, previews par PR, tags semver + CHANGELOG, prod sur ordre du PO | GitFlow, commits directs/squash, CD automatique, release-please |

### Points à valider par le PO avant l'initialisation du repo
1. Stack et hébergement proposés (GitHub + Cloudflare Pages), dépôt public ou privé (impacte protections de branche, CodeQL et minutes de CI).
2. Création du dépôt distant et du compte Cloudflare (non faits ; aucun push ni déploiement avant accord).
3. Domaine personnalisé : oui/non (coût ~10 €/an).
