# ADR-OPS-02 — Outillage qualité : ESLint 9 (flat) + typescript-eslint + Prettier + `tsc`, hooks légers

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** TS strict, règles d'architecture (ADR-APP-07) et « pas de texte en dur » (ADR-APP-05), appliquées par des règles natives et locales (ADR-APP-10, à la place de `eslint-plugin-boundaries` / `eslint-plugin-i18next`), `no-eval` / `react/no-danger` (sécurité), a11y. Le lint doit tourner identique sous Windows et en CI.

**Décision.**
- **Lint** : ESLint 9 (flat config `eslint.config.js`) + `typescript-eslint` (règles « strict type-checked »), `eslint-plugin-react-hooks`, `jsx-a11y`, `no-restricted-imports` et règles locales `p152/*` (ADR-APP-10), `no-eval`, `react/no-danger`. `--max-warnings 0`.
- **Format** : Prettier (config minimale dans `.prettierrc`, fins de ligne `lf` imposées par `.editorconfig` et `.gitattributes` `* text=auto eol=lf` pour éviter le bruit CRLF Windows). Pas de règles de style dans ESLint (`eslint-config-prettier`).
- **Typecheck** : `tsc --noEmit` (script séparé, car Vite ne vérifie pas les types).
- **Scripts** (`package.json`) : `dev`, `build`, `preview`, `lint`, `format`, `format:check`, `typecheck`, `test`, `test:cov`, `test:e2e`, `check:assets`, `check:bundle`, **`check`** (= format:check + lint + typecheck + test:cov + build + check:bundle).
- **Hooks Git** : `simple-git-hooks` + `lint-staged` (pre-commit : Prettier + ESLint sur les fichiers indexés) et `commitlint` (commit-msg : Conventional Commits, types `feat|fix|test|ci|docs|chore|sec|asset|refactor|perf`). Les hooks sont **rapides (< 5 s), contournables (`--no-verify`) et jamais la seule barrière** : la CI refait tout.
- **EditorConfig** + extension recommandée dans `.vscode/extensions.json` (aucun réglage perso commité).

**Conséquences.** (+) Les règles d'architecture et i18n/sécurité décidées dans les ADR-APP sont réellement appliquées. (−) ESLint type-checked est plus lent (≈ quelques dizaines de secondes en CI, acceptable) ; deux outils (ESLint + Prettier) à configurer.

**Alternatives écartées.**
1. **Biome (lint + format en un outil)** : très rapide et simple, mais n'a ni `boundaries`, ni `i18next/no-literal-string`, ni l'équivalent complet de `jsx-a11y` / règles type-aware : on perdrait les garde-fous exigés par ADR-APP-05/07. Réévaluable quand ces règles existeront.
2. **Husky** : standard, mais le gestionnaire de hooks ajoute un dossier et des scripts shell à faire marcher sous Windows ; `simple-git-hooks` suffit (un champ dans `package.json`). **Lefthook** (binaire Go, config YAML) est une bonne option de repli si les hooks deviennent complexes.
3. **Pas de hooks du tout** : possible, mais les erreurs de format/commit arriveraient en CI après coup, ce qui coûte des cycles de revue (limités à 3 par story).
4. **dprint / Standard / XO** : peu d'écosystème pour nos plugins et moins connu de l'équipe.
