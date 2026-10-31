# ADR-APP-05 — i18n : i18next + react-i18next, clés typées, formatage `Intl`

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** UI en anglais, aucun texte en dur (US-005), français possible plus tard (US-100). Les alertes arrivent de `core/fit` sous forme de `messageKey` + valeurs (ADR-3D-06) ; le catalogue (TA) fournit des noms d'objets traduisibles. Pluriels (« 2 issues »), unités (mm, cm, %), annonces `aria-live`.

**Décision.**
- **i18next + react-i18next**, ressources JSON dans `src/locales/<lang>/<namespace>.json` (`common`, `studio`, `alerts`, `catalog`, `errors`, `a11y`), anglais embarqué dans le bundle, autres langues chargées à la demande (import dynamique, pas de backend de traduction).
- **Clés typées** : augmentation de module TypeScript à partir de `en/*.json` (une clé inexistante ne compile pas). Test qui vérifie que toute langue ajoutée a exactement les clés de `en`.
- **Contrat avec `core/`** : `core` ne produit que des clés et des valeurs brutes (mm, ratio) ; tout formatage passe par `ui/i18n/format.ts` (`Intl.NumberFormat` avec `style: "unit", unit: "millimeter"`, pourcentages, `Intl.PluralRules` via i18next). Catalogue : le TA fournit `nameKey`, les chaînes sont dans `locales/<lang>/catalog.json`.
- **Garde-fous** : règle ESLint `i18next/no-literal-string` sur `src/ui/**` ; `escapeValue: false` (React échappe déjà) et interdiction de `dangerouslySetInnerHTML` : le texte riche passe par `<Trans>` avec composants explicites. `document.documentElement.lang` synchronisé avec la langue active.
- Pas de sélecteur de langue tant qu'il n'y a qu'une langue (architecture de l'information).

**Conséquences.**
- (+) Standard de fait, documentation abondante, pluriels/contexte/interpolation gérés, ajout du français = fichiers JSON + un sélecteur.
- (−) ≈ 15 Ko gz (i18next + react-i18next), acceptable.
- (−) Les traducteurs travaillent sur des JSON à clés (pas d'extraction automatique depuis le code) : l'anglais sert de référence.

**Alternatives écartées.**
1. **FormatJS / react-intl (ICU MessageFormat)** : syntaxe ICU puissante mais plus lourde à écrire et à relire pour l'équipe, bundle comparable ; pas de besoin de règles grammaticales complexes.
2. **Lingui** : catalogues compilés et extraction automatique élégants, mais exige un plugin de build (macros SWC/Babel) et un workflow d'extraction supplémentaire en CI pour un MVP monolingue.
3. **Dictionnaire maison** (`t(key)` sur un objet typé) : suffisant pour l'anglais seul, mais pluriels, interpolation, chargement paresseux et outillage des traducteurs seraient à réinventer au moment d'ajouter le français.
