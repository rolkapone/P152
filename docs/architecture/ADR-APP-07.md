# ADR-APP-07 — Structure de `src/` et règles de dépendance

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Décision.** Arborescence alignée sur les couches de la section 1, avec trois ajouts : `app/` (composition), `persistence/` (adapters d'E/S) et `core/commands`, `core/io`, `core/ports`.

```
src/
  main.tsx                 point d'entrée : monte <App/>
  app/                     composition root : App, providers, ErrorBoundary,
                           services.ts (choix des adapters), détection WebGL (S0)
  core/                    TypeScript PUR (aucun import React/three/DOM)
    schema/                Zod par version + migrations           (GE + dev)
    catalog/               chargement/validation du catalogue      (GE)
    geometry/ fit/ snap/ materials/                                 (GE)
    commands/              types de commandes + reducers purs      (dev)
    io/                    parseSetup / serializeSetup (ADR-APP-03) (dev)
    ports/                 interfaces : SetupRepository, CatalogSource… (dev)
  state/                   stores Zustand (document+history, session, transient),
                           dispatch, sélecteurs (alertes dérivées, verdict)
  persistence/             adapters : localStorageSetupRepository, fileExport,
                           fileImport (seul endroit qui touche Storage/Blob/File)
  render/                  scène R3F (GE) ; expose <Viewport/> et des hooks
  ui/
    components/            wrappers React Aria stylés (Button, NumberField, Dialog…)
    studio/                TopBar, LeftPanel (Desk, Objects), Properties, Alerts,
                           ViewportToolbar, ObjectsOnDeskList
    dialogs/               Welcome, ConfirmReplace, Help, AlertSettings
    a11y/                  announcer, shortcuts, SkipLinks
    i18n/                  config i18next, format.ts
    styles/                tokens.css (généré depuis le design system), global.css
  locales/en/*.json
tests/
  fixtures/setups/         un fichier par version de schéma + fichiers malveillants
  e2e/                     Playwright (QA)
```
Tests unitaires et de composants **colocalisés** (`*.test.ts(x)` à côté du fichier).

**Règles de dépendance** (vérifiées en CI par `no-restricted-imports` et la règle locale `p152/core-relative-imports`, voir ADR-APP-10) :
- `core` → rien d'autre que `core`.
- `state`, `persistence` → `core`.
- `render` → `core`, `state` (écrit uniquement via `dispatch`/`transientStore`).
- `ui` → `core` (types, clés), `state`, et seulement l'export public de `render` (`<Viewport/>`, hooks de caméra) ; jamais `three`.
- `app` → tout (c'est le seul endroit qui instancie les adapters).

**Alternatives écartées.**
1. **Découpage par fonctionnalité (`features/desk`, `features/alerts`…)** : naturel pour une UI, mais mélange code pur et code React/three dans chaque dossier et rend la règle « `core` testable sans navigateur » impossible à vérifier par lint.
2. **Monorepo multi-packages dès le MVP (pnpm workspaces : `core`, `web`)** : isolation parfaite et réutilisable par un futur backend, mais outillage et CI plus lourds sans bénéfice immédiat ; l'extraction de `src/core` en package sera triviale grâce aux règles ci-dessus le jour où un backend TS existe.
3. **Organisation par type technique (`components/`, `hooks/`, `utils/`)** : ne reflète pas les couches et laisse fuir three.js ou le DOM partout.
