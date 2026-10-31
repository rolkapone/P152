# ADR-APP-01 — Framework UI et build : React + TypeScript strict + Vite (SPA statique)

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** R3F (ADR-3D-01) impose React pour la scène. L'UI 2D est riche (onglets, formulaires numériques, menus, modales, live regions) et doit être accessible AA. Pas de backend : l'app doit pouvoir être servie comme fichiers statiques.

**Décision.**
- **React 19** + **TypeScript** en mode `strict` (+ `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), **Vite** pour le dev et le build, sortie **SPA statique** (aucun rendu serveur).
- Un seul point d'entrée, un seul écran ; pas de routeur au MVP (les modales sont pilotées par l'état). Un routeur sera ajouté quand une 2e page existera (galerie R6).
- Code splitting : la scène (`render/` + three) est chargée en `lazy()` derrière l'écran S0 « Loading », ce qui permet d'afficher le shell et le message « WebGL unsupported » sans charger three.js.
- Styles : **CSS Modules** + variables CSS générées depuis les tokens du design system (`ui/styles/tokens.css`), aucune couleur ni taille en dur.

**Conséquences.**
- (+) Une seule pile pour scène et UI, partage direct du store et des types ; écosystème a11y React le plus fourni (ADR-APP-06).
- (+) Déploiement trivial (CDN/hébergement statique), compatible avec une CSP stricte.
- (−) Discipline de rendu nécessaire (sélecteurs fins, pas de re-render des panneaux à chaque frame de drag).

**Alternatives écartées.**
1. **Svelte / SvelteKit (+ Threlte)** : plus léger et agréable, mais remettrait en cause R3F/drei (écosystème 3D plus mince) et offre moins de bibliothèques headless accessibles matures.
2. **Vue 3 (+ TresJS)** : même problème d'écosystème 3D et a11y plus restreint ; deux paradigmes si on garde R3F.
3. **Next.js / Remix (SSR)** : le rendu serveur n'apporte rien à un outil 3D sans contenu indexable, impose un runtime serveur ou des contournements, et complique la CSP. À réévaluer seulement pour la galerie publique R6 (pages partageables indexables), qui pourrait être une app séparée.
4. **Create React App / webpack** : CRA abandonné, webpack plus lent et plus verbeux à configurer que Vite.
