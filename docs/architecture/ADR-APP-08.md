# ADR-APP-08 — Stratégie de tests : Vitest (unitaires + composants), fixtures partagées, fuzzing de l'import

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** DoD : tests verts, pas de baisse de couverture. ≥ 15 cas pour les règles, migrations testées, import non fiable, accessibilité AA. La QA possède l'E2E (Playwright, US-022).

**Décision.**
- **Vitest** (même config et même transformation que Vite) pour tout le code non E2E :
  - `core/**`, `state/**`, `persistence/**` : environnement **Node** (`persistence` avec un `Storage` en mémoire) ; tests de reducers, d'historique (coalescence, limite, redo invalidé après une nouvelle commande), de migrations sur `tests/fixtures/setups/v*.json`, du pipeline d'import (fichiers trop gros, JSON invalide, version future, clés inconnues, `__proto__`, 51 objets, bornes, NaN/Infinity encodés, chaînes géantes, mount cyclique).
  - **Fuzzing par propriétés** avec **fast-check** sur `parseSetup` : « ne lève jamais d'exception, renvoie toujours un `Result` », et aller-retour `serialize → parse` identique pour tout setup valide généré.
  - `ui/**` : **React Testing Library** + `@testing-library/user-event` en environnement **jsdom**, `vitest-axe` (axe-core) sur chaque écran/dialogue ; `<Viewport/>` remplacé par un double (la scène est testée par le GE et en E2E).
- **Seuils de couverture** (lignes/branches) : `core/commands` + `core/io` ≥ 95 %, `state` + `persistence` ≥ 90 %, global ≥ 80 % ; seuil en cliquet (jamais abaissé), échec CI sinon.
- Contrat QA/perf : `window.__p152perf` et un hook `window.__p152test` (lecture du setup, dispatch de commandes pour préparer une scène de 20 objets) exposés **uniquement** si `import.meta.env.VITE_E2E === "true"`, éliminés du build de production (vérifié par un test sur le bundle).

**Conséquences.**
- (+) Un seul runner, rapide, pas de configuration Babel/Jest à part ; fixtures partagées entre unitaires, E2E et futur backend.
- (−) jsdom n'est pas un vrai navigateur (layout, focus visible) : ces points relèvent de l'E2E Playwright.

**Alternatives écartées.**
1. **Jest** : seconde chaîne de transformation (ESM/TS) à maintenir à côté de Vite, plus lent.
2. **Vitest Browser Mode / Cypress Component Testing pour tous les composants** : plus fidèle mais nettement plus lent et plus lourd en CI ; réservé, si besoin, aux composants dont le comportement dépend du layout.
3. **Tests de snapshot DOM** : fragiles, n'expriment pas les critères d'acceptation ; on teste des comportements (rôles, libellés, interactions).
