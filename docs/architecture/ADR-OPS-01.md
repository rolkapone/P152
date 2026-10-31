# ADR-OPS-01 — Gestionnaire de paquets et runtime : pnpm 10 + Node 24 LTS, versions épinglées

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** Poste Windows, équipe qui apprend, supply chain npm exposée (scripts `postinstall` malveillants). Besoin d'installations reproductibles et rapides en CI.

**Décision.**
- **Node.js 24 (LTS active)**, fixé dans `.nvmrc`, `package.json#engines` (`>=24 <25`) et `actions/setup-node` (`node-version-file: .nvmrc`). Changement de LTS = ADR court + PR dédiée.
- **pnpm 10**, version exacte dans `package.json#packageManager`. Installation : `npm i -g pnpm@<version>` (Corepack n'est plus livré avec les Node récents, ne pas en dépendre) ; en CI `pnpm/action-setup`.
- `pnpm-lock.yaml` commité ; CI en `pnpm install --frozen-lockfile`. `.npmrc` : `engine-strict=true`. Config pnpm : **`onlyBuiltDependencies`** en liste blanche (aucun script d'installation de dépendance n'est exécuté sauf ceux validés, ex. `esbuild`), et **`minimumReleaseAge`** (ex. 3 jours) pour ne pas installer une version publiée la veille.
- Dépendances en versions **exactes** pour les outils de build/test (`save-exact=true`), mises à jour par PR groupées via **Dependabot** (npm + github-actions, hebdomadaire).

**Conséquences.** (+) Store global dédupliqué (rapide sur Windows, peu de disque), résolution stricte (pas de dépendance fantôme), blocage des scripts d'installation par défaut. (−) pnpm à installer en plus de Node ; certains outils mal écrits cassent avec `node_modules` non plat (rare, `public-hoist-pattern` en dernier recours).

**Alternatives écartées.**
1. **npm** : zéro installation, mais dépendances fantômes possibles, installation plus lente, pas de liste blanche native des scripts d'installation. Acceptable, mais moins protecteur pour une app qui importe beaucoup (three, R3F, React Aria).
2. **Yarn (Berry)** : bon outil, mais PnP/plugins ajoutent des spécificités d'outillage (ESLint, Vite) sans bénéfice ici ; Yarn classique est en fin de vie.
3. **Bun** : rapide, mais runtime et gestionnaire encore moins alignés avec nos outils de CI (Playwright, gltf-transform) ; risque de divergences Windows/Linux inutile pour un projet d'apprentissage.
