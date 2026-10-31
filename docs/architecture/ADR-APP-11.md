# ADR-APP-11 — Première interface (US-004) : tokens copiés et vérifiés, préférences locales, région live propre à la scène

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


> Statut : **Accepté** (2026-10-20, revue US-004 APPROVE). Précise ADR-APP-04/05/06/07/08 sans les contredire.

**Contexte.** US-004 livre la première UI 2D (barre de vue, astuce, écrans de chargement et d'erreur de la scène) avant le shell US-005. Il faut fixer comment l'app consomme les tokens, où vit la préférence « astuce masquée », comment sont faites les annonces et comment on teste l'accessibilité des composants.

**Décision.**
- **Tokens** : `src/ui/styles/tokens.css` est une **copie octet pour octet** de `docs/design/ui/tokens.css` depuis la ligne `BEGIN SYNCED` (exclue de Prettier) ; `tests/unit/tokens-sync.test.ts` échoue si les deux divergent. Le `@font-face` Inter (fichier auto-hébergé) arrive avec US-005 : d'ici là, pile de repli de `--font-sans` (le test interdit tout `url()` pour éviter un 404). Styles en **CSS Modules** n'utilisant que des `var(--…)` ; les primitives globales `.glass` et `[data-focus-visible]` de tokens.css sont réutilisées telles quelles.
- **Préférences d'affichage** : port synchrone `PreferencesRepository` (`core/ports`), adapter `persistence/preferences/localPreferences.ts` (une clé par drapeau, `p152:v1:pref:sceneTipDismissed = "1"`, aucune désérialisation, tout accès dans un `try/catch` : stockage bloqué ou plein = valeurs par défaut, l'app continue), store Zustand `state/preferences` branché par `app/`. Synchrone (et non asynchrone comme `SetupRepository`) pour lire la valeur avant le premier rendu (pas de clignotement de l'astuce).
- **Composants** : wrappers React Aria dans `ui/components/` (`Button`, `ToolbarButton` / `ToolbarToggleButton`, `Tooltip`, `ProgressBar`, `Icon`). La barre de vue est un `div role="toolbar"` et **pas** le `Toolbar` de RAC : celui-ci fait de la barre un seul arrêt de tabulation, alors que l'UX exige Tab sur chaque bouton (UX-3) ; les flèches gauche/droite déplacent aussi le focus entre les boutons.
- **Annonces** : une région `role="status" aria-live="polite"` propre à la scène (`ui/studio/scene/SceneAnnouncer.tsx`) plutôt que le `LiveAnnouncer` de React Aria prévu par ADR-APP-06 : l'UX demande une zone unique et vérifiable (UX-1, UX-8) et un regroupement à 600 ms ; chaque message est un nouveau nœud pour qu'une phrase répétée soit relue. Le regroupement est une fonction pure (`viewAnnouncements.ts`). Le service `announce()` global d'ADR-APP-06 reste à créer en US-005 et pourra reprendre ce composant.
- **Tests de composants** : Testing Library (`@testing-library/react`, `/dom`, `/user-event`) et **`axe-core` appelé directement** (`tests/unit/helpers/ui.tsx`, contraste désactivé en jsdom, vérifié en E2E) au lieu de `vitest-axe` (dernière version 0.1.0, non maintenue) ; même version d'axe-core que `@axe-core/playwright`.

**Conséquences.**
- (+) Une modification des tokens par l'ui-designer casse la CI tant que la copie n'est pas refaite (pas de dérive silencieuse).
- (+) L'app fonctionne sans stockage (navigation privée, iframe sandboxée) : l'astuce est alors masquée pour la session seulement.
- (−) Chunk principal ≈ 154 Ko gz avec React Aria (budget du shell fixé en US-005, ci-dessous).
- **Budget du shell (US-005 T7), à valider par le PO** : plafonds gzip (zlib par défaut, 1 kB = 1000 o) **chunk principal ≤ 195 kB** et **chunk 3D ≤ 295 kB**, mesurés à 176,5 et 267,2 kB gz le 2026-10-31 (environ 10 % de marge). `scripts/check-bundle.mjs` (dans `pnpm check` et la CI) échoue au-delà, et aussi si le chunk 3D (`SceneCanvas-*.js`) disparaît ou est chargé par `index.html` (il doit rester en `lazy()`). Valeurs dans `config/bundle-budget.mjs`, testées par `tests/unit/bundle-budget.test.ts` ; un relèvement passe par cet ADR et l'accord du PO.
- (−) Deux mécanismes d'annonce coexisteront si US-005 choisit le `LiveAnnouncer` : à unifier alors.

**Alternatives écartées.**
1. **Importer `docs/design/ui/tokens.css` directement** : embarquerait le `@font-face` vers un fichier absent (404 en console) et ferait dépendre le build de `docs/`.
2. **Générer tokens.css par un script de build** : plus d'outillage pour un fichier copié tel quel.
3. **`Toolbar` de React Aria** : un seul arrêt de tabulation, contraire à UX-3.
