# ADR-APP-06 — Composants accessibles : React Aria Components (headless), stylés avec nos tokens

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


> Précisé par ADR-APP-11 (région live propre à la scène, US-004).

**Contexte.** WCAG 2.2 AA (principes UX) : navigation clavier complète, focus visible et non masqué, onglets, menus, modales sans piège clavier, champs numériques avec unité et erreurs liées, info-bulles sur les icônes, barres d'outils, annonces live, cibles ≥ 24 px, zoom 200 %. Le design system (ui-designer) impose ses propres styles : pas de thème imposé par une lib.

**Décision.**
- **React Aria Components** (Adobe, headless, sans style) pour toutes les primitives interactives : `Tabs` (panneau gauche), `Menu`/`MenuTrigger` (menu File), `Dialog`/`Modal`/`AlertDialog` (S1, S5, S7, S8), `NumberField` (dimensions en mm, bornes, pas, saisie clavier, formatage `Intl`), `Toolbar` + `ToggleButton` (barre flottante, magnétisme), `Tooltip`, `GridList`/`ListBox` (bibliothèque, liste accessible « Objects on desk »), `Switch`, `TextField` (nom du setup).
- Chaque primitive est **enveloppée une fois** dans `ui/components/` (ex. `Button`, `NumberField`, `Dialog`) avec CSS Modules et tokens ; les écrans n'importent que ces wrappers (règle de lint), ce qui rend la lib remplaçable.
- **Annonces** : un service unique `announce(messageKey, values)` (sur le `LiveAnnouncer` de React Aria) alimenté par les libellés des commandes (ADR-APP-02), regroupé à une annonce par action.
- **Raccourcis clavier** : un gestionnaire unique (`ui/a11y/shortcuts.ts`) qui traduit les touches en commandes, inactif quand le focus est dans un champ de saisie (WCAG 2.1.4), documenté dans l'aide S7 depuis la même table.
- Contrôle automatique : `axe-core` en tests de composants (ADR-APP-08) et en E2E (QA).

**Conséquences.**
- (+) Gestion du focus, rôles ARIA, interactions clavier/tactile et internationalisation des nombres déjà éprouvées sur lecteurs d'écran ; `NumberField` couvre directement US-007 et US-011.
- (+) Aucun conflit avec le design system : 100 % des styles viennent de nos tokens.
- (−) API riche à apprendre ; poids à surveiller (import par composant, tree-shaking).

**Alternatives écartées.**
1. **Radix UI** : excellente qualité, mais pas de `NumberField` ni de gestion i18n des nombres, couverture des formulaires plus faible : il faudrait écrire nous-mêmes les champs les plus critiques de l'app.
2. **Bibliothèque stylée (MUI, Chakra, Mantine)** : thème et look imposés à surcharger contre le design system, poids plus élevé, runtime CSS-in-JS pour certaines.
3. **Composants maison** : piège à focus, navigation au clavier des onglets/menus, `aria-live`, champs numériques localisés : beaucoup de code délicat et de risques AA pour une équipe qui apprend.
