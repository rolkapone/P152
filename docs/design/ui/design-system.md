# Design system — P152 (nom affiché : "Deskfit", validé par le PO au kickoff du Sprint 2)

> **v0.4** (retour du PO au Sprint 2 : "l'app doit être designée comme une app native premium de l'écosystème Apple"). Refonte de l'apparence et des patterns, pas de la structure UX : barre d'outils unifiée, barre latérale « source list », inspecteur « grouped form », scène 3D en canvas plein cadre sous des matériaux translucides. Hiérarchie de matériaux (ultra-thin / thin / regular / thick), coins concentriques, échelle typographique calquée sur les styles dynamiques, ressorts, contrôles pilule / segmenté / switch. Liquid Glass : exploration séparée, **pas par défaut** (§17).
> v0.3 (shell US-005 §15, bureau US-006 §16) ; v0.2 (direction initiale). UI en anglais, WCAG 2.2 AA, desktop d'abord (min 1366x768), thème par défaut = système.
> Valeurs : `tokens.css` (source consommée, copiée dans `src/ui/styles/tokens.css`) et `tokens.json` (miroir). Catalogue visuel : `maquettes/index.html` (inclut un **audit de contraste calculé en direct**). Maquettes : `US-004.html`, `US-005.html`, `US-006.html`, `explorations/liquid-glass.html`.

## 1. Direction visuelle : **Natif · Premium · Précis**
- **Natif** : l'app a l'allure d'une application de bureau / tablette soignée. Structure de fenêtre (barre d'outils unifiée en haut, barre latérale à gauche, inspecteur à droite), contrôles familiers (boutons pilule, contrôle segmenté, switch, listes groupées, menus, popovers, feuilles), sélection par teinte d'accent, focus en halo. La mise en page suit nos wireframes UX ; seuls l'apparence et les patterns changent.
- **Premium** : matériaux translucides à plusieurs niveaux de flou (vibrancy) sur la scène 3D, coins concentriques, ombres très douces, filets d'1 px lumineux, typographie à chasse optique, ressorts. Neutres « system gray » + **une seule couleur d'accent** (bleu système) ; les couleurs vives sont réservées au statut et à la sélection.
- **Précis** : chiffres tabulaires, unités toujours affichées, cotes lisibles ; **verdict toujours visible** (seules les Error donnent "Doesn't fit"). Contrastes calculés sur le **pire fond sous les matériaux** (noir pur sous matériau clair, blanc pur sous matériau sombre), vérifiés en direct dans le catalogue.
- Rendu 3D visé : **photo produit en studio** (inchangé). Détail : `docs/design/3d/direction-artistique.md`. Mot-symbole texte « Deskfit » (pastille d'accent CSS, aucun logo).

## 2. Thèmes
Clair et sombre. Sans attribut `data-theme` sur `<html>`, l'UI suit `prefers-color-scheme` (**défaut = système**). Un choix manuel (`data-theme="light|dark"`, futur, US-025) prime. Les tokens `[data-theme]` marchent aussi sur un conteneur (les maquettes s'en servent). Les tokens `--scene-*` définissent le studio de chaque thème (inchangés, sauf `--scene-selection` aligné sur l'accent). **Accent utilisateur** (plus tard) : seuls `--color-accent*`, `--color-accent-solid*`, `--color-accent-subtle*`, `--color-focus*` et `--scene-selection` changent ; chaque accent proposé devra passer l'audit de contraste du catalogue.

## 3. Couleurs et contrastes (calculés, WCAG 2.x)
Neutres : fond de fenêtre `bg` #F2F2F7 / #0B0B0D, `surface` (lignes de groupe, champs, feuilles) #FFFFFF / #1C1C1E, `surface-2` (aplats) #EBEBF0 / #2C2C2E, `raised` (pouce du segmenté) #FFFFFF / #48484C, `fill` / `fill-hover` (pistes, survol : gris 14 % / 10 %, 28 % / 18 % en sombre), `separator` (filets décoratifs).

| Usage | Clair | Sombre | Ratio visé / obtenu (clair · sombre) |
|---|---|---|---|
| Texte `--color-text` sur surface | #1C1C1E / #FFF | #F5F5F7 / #1C1C1E | 4.5 / 17.0 · 15.6 |
| Texte atténué `--color-text-muted` sur surface-2 | #4C4C54 | #C7C7D0 | 4.5 / 7.1 · 8.3 |
| Accent texte / anneau `--color-accent` sur surface (sur bg) | #0A64E8 | #5AA0FF | 4.5 / 5.2 (4.7) · 6.4 |
| Texte sur aplat d'accent `--color-on-accent-solid` | #FFF sur #0A64E8 | #FFF sur #0A6CF0 | 4.5 / 5.2 · 4.8 |
| Sélection : `accent-subtle-text` sur `accent-subtle` | #0A46B8 sur #DDEAFE | #B3D1FF sur #17335E | 4.5 / 6.7 · 8.1 |
| Contour de champ / piste de switch `border-strong` sur surface (sur bg) | #86868E | #8E8E98 | 3 / 3.6 (3.2) · 5.2 |
| Anneau de focus `--color-focus` sur surface | #0A52C2 | #7DB4FF | 3 / 7.0 · 8.0 |
| Success | #137A3F sur #E3F4EA | #4CC38A sur #12301F | 4.5 / 4.8 · 6.4 |
| Error | #B42318 sur #FDECEA | #FF8A80 sur #3A1714 | 4.5 / 5.7 · 7.0 |
| Warning (texte) / icône | #8A4B00 / #B86E00 sur #FFF3DC | #F2B04A sur #33260D | 4.5 / 6.2 · 7.8 ; icône 3 / 3.6 |
| Info | #0B6B8A sur #E3F3F8 | #5CC4E0 sur #0F2A33 | 4.5 / 5.3 · 7.4 |
| Bouton destructif | #FFF sur #B42318 | #FFF sur #C4302B | 4.5 / 6.6 · 5.5 |

**Deux rôles pour l'accent** : `--color-accent` (texte, anneaux, sélection, barres de progression de la scène) et `--color-accent-solid` (aplats pleins avec texte blanc : bouton principal, switch actif). Identiques en clair ; en sombre ils diffèrent (un bleu clair lit bien sur fond sombre mais ne porte pas de texte blanc à 4.5:1). Les anciens `--color-accent-hover/-active` et `--color-on-accent` gardent leur rôle (survol/appui d'un aplat `--color-accent`, texte dessus) ; le **nouveau bouton principal utilise `--color-accent-solid*` + `--color-on-accent-solid`**.

**Sémantique de statut** (jamais la couleur seule, 1.4.1) : icône + mot de gravité + couleur.
| Niveau | Icône | Mot | Effet sur le verdict |
|---|---|---|---|
| Error | cercle-croix | "Error" | "Doesn't fit" |
| Warning | triangle | "Warning" (conseil) | aucun : "It fits - N tips" |
| Info | cercle-i | "Tip" | aucun |
| Succès | coche | "It fits" / "Done" | — |
Sur la scène : objet en Error = contour rouge + hachures + pastille icône ; Warning = contour pointillé orange + pastille. Sélection = contour **à 2 tons** (blanc + sombre) + accent, lisible sur studio clair ou sombre. Sur matériau, le **statut n'est jamais du texte nu** : toujours une pastille ou un bandeau à fond `*-bg` opaque.

## 4. Typographie : Inter, échelle de styles dynamiques
- **Police : Inter** (SIL Open Font License 1.1), **auto-hébergée**, aucune requête tierce (CSP `font-src 'self'`). Fichier : `public/fonts/inter-latin-wght-normal.woff2` (variable, sous-ensemble latin, axe de graisse seul, ≈ 48 Ko), obtenu du paquet npm `@fontsource-variable/inter` (ne pas importer son CSS). `@font-face` dans `tokens.css` (hors bloc synchronisé, `font-display: swap`, `local()` d'abord). Précharger : `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/inter-latin-wght-normal.woff2">`. Repli : `system-ui`, Segoe UI, Roboto, Arial (génériques). Le symbole « ≈ » n'est pas dans le sous-ensemble : écrire "about 864 mm".
- **Licence à consigner** (developer / technical-artist, `docs/design/3d/licences-assets.md` ou `THIRD_PARTY_LICENSES`) : « Inter, © The Inter Project Authors (https://github.com/rsms/inter), SIL Open Font License 1.1, auto-hébergée, non modifiée hors sous-ensemble ». Inclure l'OFL (`public/fonts/OFL.txt`). Ne pas vendre la police seule ; ne pas la renommer si on la modifie.
- **Pourquoi pas la police système Apple** : interdite par le brief. L'écart de rendu est comblé par (1) la **chasse optique** par taille (Inter n'a pas d'axe de taille optique : on la simule avec le crénage), (2) les **options OpenType**, (3) des graisses 400 / 500 / 600 / 700 et des interlignes serrés, (4) `-webkit-font-smoothing: antialiased`.
- **Chasse optique** : `-0.0223 + 0.185 · e^(-0.1745 · taille_px)` (formule de métriques dynamiques d'Inter), arrondie par style.
- **Options OpenType** (`--font-features`) : `kern`, `calt`, `ss03` (guillemets et virgules ronds). Variante à évaluer (`--font-features-alt`) : + `cv11` (« a » à un étage) et `ss01` (chiffres ouverts) : plus amicale, moins neutre ; **non retenue par défaut** (bascule comparable dans `maquettes/index.html`). Les chiffres sont tabulaires partout. Piège : le raccourci `font:` remet `font-feature-settings` à zéro ; les classes `.t-*` le réappliquent.

| Style | Token `--font-*` | Taille / interligne | Graisse | Chasse | Usage |
|---|---|---|---|---|---|
| Large Title | `large-title` | 34 / 41 | 700 | -0.022em | Welcome uniquement |
| Title 1 | `title-1` | 28 / 34 | 700 | -0.021em | titres de page |
| Title 2 | `title-2` | 22 / 28 | 600 | -0.018em | titres de feuille, cartes d'erreur |
| Title 3 | `title-3` | 20 / 25 | 600 | -0.017em | titres de section |
| Headline | `headline` | 16 / 22 | 600 | -0.011em | titres de panneau, dimensions des lignes, verdict |
| Body | `body` | 16 / 22 | 400 | -0.011em | corps |
| Callout | `callout` | 15 / 20 | 400 (boutons 500) | -0.009em | boutons, onglets, nom du setup |
| Subheadline | `subheadline` | 14 / 19 | 400 (en-têtes de groupe 600) | -0.006em | aides, texte secondaire, astuce |
| Footnote | `footnote` | 14 / 18 | 400 | -0.006em | légendes, info-bulles, messages de champ |
| Caption | `caption` | 14 / 18 | 500 | 0 | étiquettes |

**Minimum 14 px** (règle du projet, critères UX-18 / UX-14) : Subheadline, Footnote et Caption partagent donc 14 px et se distinguent par la graisse. Un 13 px aurait rapproché la densité d'une app de bureau native mais casse cette règle ; question 3 au PO. Tokens de taille conservés : `--text-sm` 14, `--text-md` 16, `--text-lg` 17 (était 18), `--text-xl` 22, `--text-2xl` 28, `--text-3xl` 34 (était 36) ; `--tracking-tight` vaut maintenant -0.018em ; `--leading-normal` 1.45 (était 1.5). Classes utilitaires `.t-large-title` … `.t-caption` dans `tokens.css`. Lisible à 200 % de zoom.

## 5. Espacements, rayons, ombres, matériaux
- **Espacement** (base 4) : 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64. Padding de volet **12** (zone) et lignes de groupe **16** ; `--panel-pad` passe à 16 ; marge des panneaux flottants **12** (`--float-inset`, repli tablette uniquement).
- **Rayons concentriques** : `sm 6` vignettes, tooltips · `md 10` champs, segments · `lg 14` groupes, cartes, popovers, alertes · `xl 22` panneaux flottants, feuilles, modales · `pill`. **Règle : rayon interne = rayon externe − marge** (22 − 8 = 14 ; 14 − 4 = 10 ; 10 − 4 = 6), avec `calc()` quand le rayon interne n'est pas dans l'échelle (ex. entrée de menu : `calc(var(--radius-lg) - 6px)`). Les ex-valeurs `lg 16` et `xl 24` ont baissé (14, 22).
- **Ombres très douces** : `shadow-1` cartes · `shadow-2` menus, popovers, toasts · `shadow-3` feuilles, cartes d'erreur · `glass-shadow` éléments flottants (liseré lumineux intérieur + contour 0.5 px + ombre). Un trait de 0.5 px remplace les bordures dures. En sombre l'élévation se lit aussi à la surface plus claire.
- **Matériaux (vibrancy)** : quatre niveaux, chacun = teinte translucide + flou + saturation (180 %) + liseré intérieur d'1 px (`--material-hairline`) + contour extérieur 0.5 px (`--material-outline`).

| Niveau | Classe | Opacité clair / sombre | Flou | Usage | Contenu autorisé (pire fond) |
|---|---|---|---|---|---|
| ultra-thin | `.material-ultra-thin` | 55 % | 16 px | poignées, glyphes flottants | **glyphes seuls** (≥ 3:1) |
| thin | `.material-thin` | 72 % | 20 px | barre de vue | texte principal + icônes + anneau de focus |
| regular | `.material-regular` | 80 % | 28 px | barre d'outils, barre latérale, inspecteur, astuce | **tout texte** (y compris atténué), liens `--glass-link` |
| thick | `.material-thick` | 90 % | 36 px | menus, popovers, toasts, feuilles flottantes | tout, y compris statuts |

  Classes complémentaires : `.rim` (liseré + contour), `.float` (liseré + ombre douce, pour un élément qui flotte), `.glass` = regular + float (**alias historique conservé**), `.scrim` (voile des feuilles, flou léger). Un volet **collé au bord de la fenêtre** (macOS) n'a ni ombre ni liseré : un filet `--color-separator` suffit.
  **Contrastes sur le pire fond** (noir pur sous clair, blanc pur sous sombre ; calculés en direct dans `maquettes/index.html` §9) :

| Cas (clair · sombre) | ultra-thin | thin | regular | thick |
|---|---|---|---|---|
| Texte principal | 4.8 · 3.5 (glyphes) | 7.9 · 6.1 | 9.9 · 8.0 | 12.8 · 11+ |
| Texte atténué | non autorisé | non autorisé (4.0 · 3.9) | 4.9 · 5.2 | 6.4 · 6+ |
| Texte atténué sur ligne survolée (+ fill-hover) | — | — | 4.5 · 4.6 | 5.5 · 5.5 |
| Lien `--glass-link` | — | — | 4.7 · 5.1 | 6.1 · 6+ |
| Anneau de focus | — | 3.3 · 3.1 | 4.0 · 4.1 | 5.3 · 5+ |

  Les états sélectionnés utilisent `accent-subtle` **opaque** ; les pastilles de verdict, bandeaux, cartes d'erreur sont opaques. Les modales / feuilles sont **opaques** (beaucoup de texte), seul le voile `.scrim` floute la scène.
  **Replis** (fond opaque `--material-solid`, `--material-solid-raised` pour thick ; sans flou ; mise en page identique) : `backdrop-filter` non supporté (`@supports not`), `prefers-reduced-transparency: reduce`, classe `.no-glass` (option US-025).
- **Contrôles** : hauteur 36 (défaut), 32 (compact), 44 (actions principales de feuille, cibles tactiles). Cibles ≥ 32 (≥ 24 exigé par 2.5.8) ; boutons de barre d'outils 40.

## 6. Icônes
**Lucide** (https://lucide.dev), licence **ISC**, paquet `lucide-react`. Épaisseur de trait `--icon-stroke` **1.6** (plage 1.5 à 1.75 pour se rapprocher d'un rendu de symboles système), tailles alignées sur le texte : `--icon-sm` 16 (texte 14), `--icon-md` 18 (texte 15-16), `--icon-lg` 20 (barre d'outils), `--icon-xl` 24 (états vides), `currentColor`. Jamais d'icône seule sans nom accessible (`aria-label` + info-bulle) ; dans les listes et menus, icône + libellé. Lucide utilisés : `check`, `x`, `info`, `triangle-alert` (`alert-triangle`), `circle-check`, `circle-x`, `circle-dashed`, `rotate-ccw`, `undo-2`, `redo-2`, `panel-left-close/-open`, `panel-right-close/-open`, `chevron-down/-right`, `plus`, `minus`, `box`, `mouse-pointer-2`, `ellipsis`, `search`, `trash-2`, `copy`, `monitor`, `file`, `upload`, `download`. Les maquettes embarquent des tracés équivalents inline.

## 7. États (tous composants interactifs)
| État | Traitement |
|---|---|
| Normal | boutons : aplat `fill` pilule ; champs : fond `surface` + contour 1 px `border-strong` (biseau) ; lignes : transparent |
| Survol | `fill-hover` / `border` (boutons gris) ; teinte plus foncée (boutons pleins) ; jamais la seule indication |
| Appuyé | `scale(var(--press-scale))` avec retour en ressort + teinte plus foncée |
| **Focus visible** | anneau 3 px `--color-focus`, décalage 2 px, **halo** `--color-focus-halo` (accent translucide) ; uniquement au clavier (`:focus-visible`, `[data-focus-visible]`) ; dans une liste à débordement masqué : anneau intérieur (`outline-offset: -3px`) ; jamais masqué par un panneau |
| Sélectionné / actif | fond `accent-subtle` opaque + texte `accent-subtle-text` + graisse 600 + **coche** (repère hors couleur) ; segmenté : pouce `raised` élevé + graisse 600 + texte d'accent |
| Désactivé | `text-disabled`, `cursor: not-allowed`, `aria-disabled` ; pas d'info critique seulement en désactivé |
| Erreur de champ | contour 2 px `error` + icône croix + message sous le champ relié par `aria-describedby` ("Enter a width between 800 and 2400 mm.") |
| Warning / Info | bandeau : fond `*-bg`, icône, mot de gravité, rayon `lg` |
| Chargement | "Loading 3D scene…" + barre `role="progressbar"` ; panneaux visibles ; statique en reduced motion |

## 8. Motion : ressorts, jamais bloquante
- **Durées** : `fast 120` (survol, appui) · `base 200` (menus, fondus) · `slow 320` (barres, bandeaux) · **`spring 460`** (panneaux, feuilles, popovers, pouce du segmenté) · `camera 480`.
- **Courbes** : `standard` (0.2,0,0,1) états · `out` (0.16,1,0.3,1) entrées · `in-out` (0.65,0,0.35,1) caméra · **`spring`** : vrai ressort amorti (ζ 0.72, dépassement ≈ 4 %) exporté en `linear()` avec repli `cubic-bezier(0.34,1.3,0.64,1)` si non supporté · **`spring-soft`** : amorti critique, sans dépassement (panneaux, feuilles, popovers qui s'étendent).
- Usage : appui bouton `scale(0.97)` qui revient en `spring` ; pouce du segmenté (translation en `spring`) ; switch (bille en `spring`, s'étire à l'appui) ; panneaux (translation + fondu `spring-soft`) ; barre de vue et astuce (entrée `rise` en `spring`) ; feuille (échelle .94 → 1 + voile en fondu). Aucune animation clignotante, aucune boucle décorative.
- **`prefers-reduced-motion: reduce`** : toutes les durées passent à 0, `--press-scale: 1`, neutralisation globale des `animation`/`transition`. Chargement : barre statique ; caméra : saut direct. Les animations ne portent jamais d'information essentielle.

## 9. Composants (React Aria Components → wrappers `ui/components/`)
| Composant | Base RAC | Règles clés |
|---|---|---|
| **Barre d'outils unifiée** (`material-regular`, filet bas) | `header` (banner, **sans** rôle toolbar : un arrêt de Tab par commande) | 52 px mini, passe sur 2 lignes sous 640 px. Gauche : bascule barre latérale, mot-symbole `h1`, filet, nom du document. Droite : **verdict**, bascule inspecteur. US-005 : pas de Undo/Redo, File, Help, "Saved" (§15). |
| **Verdict** (statut) | `role="status"` | Pastille 36 px, Callout 600, fond `*-bg` opaque. "It fits", "It fits · 2 tips", "Doesn't fit · 2 issues". **Vide : "Nothing to check yet", fond `surface-2`, icône `circle-dashed`.** Toujours visible. |
| Bouton | `Button` | Pilule 36 : **défaut** (aplat `fill`), **principal** (`accent-solid`), **tinted** (`accent-subtle`), **plain** (texte `glass-link`), **destructif**, **ghost**. Tailles 32 / 36 / 44. Icône seule : cercle, `aria-label` + info-bulle. Bouton de barre d'outils 40. Appui : `scale(.97)` en ressort. |
| **Contrôle segmenté** | `Tabs` / `RadioGroup` | Piste `fill`, pouce `raised` qui glisse en ressort ; sélectionné = graisse 600 + texte d'accent. Hauteur 32. |
| **Switch** | `Switch` | 46 × 28, actif = `accent-solid`, bille blanche qui s'étire à l'appui. Piste inactive `border-strong` (3:1). |
| **Champ / NumberField mm** | `NumberField` | Biseau : fond `surface` + contour `border-strong` ; label visible à gauche, valeur à droite (tabulaire), suffixe "mm" (ou "cm" + équivalent mm, US-007), **stepper** −/+ en pilule (pas 10 mm, Maj 1, Ctrl 100), plage en aide. Colonne étroite (barre latérale) : libellé au-dessus, champ + stepper dessous (§16). États : normal, focus (halo), erreur (contour 2 px + icône + texte), désactivé. |
| **Liste groupée** (inspecteur) | `Table`/lignes | Carte `surface` rayon `lg`, lignes 44 mini, filet décalé de 16, libellé à gauche / valeur à droite, en-tête de groupe Subheadline 600 muted, légende Footnote. |
| **Ligne de source list** (bureaux) | `RadioGroup` | Ligne 56 + vignette + texte secondaire + coche ; sélection = teinte d'accent (§16). |
| Barre de vue (`material-thin float`) | `Toolbar` | Pilule, bas-centre de la zone libre ; boutons pilule 36 ; actif = teinte d'accent + coche (§14). |
| Menu / popover | `Menu` / `Popover` | `material-thick float`, rayon `lg`, entrée de menu 32 px survolée en `accent-solid`. Popover 320 px. |
| **Feuille** (sheet) | `Modal` + `Dialog` | **Opaque**, rayon `xl`, `shadow-3`, voile `.scrim`, entrée en ressort (échelle .94 → 1). 480 px (Welcome 640). Focus piégé, Échap ferme. Petite largeur : feuille ancrée en bas (poignée 36 × 5). |
| Toasts | `ToastRegion` | Pilule `material-thick float`, bas-droite, 5 s (≥ 6 s avec action), pause au survol/focus, "Undo" plutôt que confirmation. |
| Bandeau d'erreur | `role="alert"` | Fond `error-bg`, icône + texte + actions, rayon `lg`. |
| Info-bulle | `Tooltip` | Fond `text` inversé, Footnote, rayon `sm`, **400 ms au survol, immédiate au focus clavier**, Échap la ferme sans quitter le focus. |
| Panneaux latéral / droit | `aside` | Voir §15. |

## 10. Accessibilité (rappels)
Focus jamais masqué par les panneaux ; ordre Tab : liens d'évitement > barre d'outils > barre latérale > scène > inspecteur (voir l'écart noté au §15) ; tout drag a son alternative (champs X/Y mm, flèches) ; annonces `aria-live` regroupées ; cibles ≥ 32 px ; texte ≥ 14 px ; reflow à 200 % ; jamais d'info par la couleur seule ; fonctionne sans matériaux translucides (`prefers-reduced-transparency`, `.no-glass`) et sans animation (`prefers-reduced-motion`).

## 11. Emplacements futurs
Onglets Style / Ambience / Decor, Material, Day/Night, Shopping list : mêmes composants (segmenté, listes groupées, lignes de source list), aucun nouveau style, uniquement quand la fonction existe.

## 12. Inspiration et limites
**Ce qu'on reprend (principes d'interface génériques des plateformes de bureau et de tablette)** : structure de fenêtre (barre d'outils unifiée, barre latérale, inspecteur, feuilles, popovers) ; hiérarchie de matériaux translucides (vibrancy) avec flou, saturation et liseré ; coins concentriques ; échelle de styles typographiques (Large Title à Caption) ; gris « système » clairs et sombres + un accent ; contrôles pilule, segmenté, switch ; sélection par teinte d'accent ; halo de focus ; mouvement à ressort ; repli des volets en superpositions sur tablette ; rendu 3D façon photo produit.

**Ce qu'on s'interdit** :
- la police **SF Pro** (ni aucune police propriétaire d'une plateforme) : **Inter** (OFL) auto-hébergée ;
- les icônes **SF Symbols** : **Lucide** (ISC) ou équivalents libres ;
- tout **logo Apple**, pomme, pictogramme de marque ; le mot-symbole « Deskfit » est le nôtre ;
- toute **reproduction identifiable d'un écran d'app Apple** (Finder, Freeform, Keynote, Réglages…), de la barre de menus, du Dock, des fenêtres à boutons « feux tricolores » (nos fenêtres n'en ont pas) ;
- tout **nom de marque Apple dans l'UI** (textes, noms accessibles), **dans le code** (identifiants, noms de classes ou de tokens : on écrit `material-regular`, pas un nom de produit) et dans les noms de fichiers d'assets ; les noms de plateformes (macOS, iPadOS, iOS) et « Liquid Glass » ne servent que dans les **documents et maquettes de design**, en usage descriptif de la cible visée ;
- les captures, visuels ou assets d'un produit Apple, y compris comme référence dans les maquettes.
Toute nouvelle inspiration est jugée sur ce critère : on reprend un principe, jamais une œuvre.

## 14. Scène 3D et barre de vue (US-004)
Maquette : `maquettes/US-004.html` (§7 = consignes développeur). **Barre de vue** : `material-thin float`, pilule, padding 4 (3 sous 420 px), boutons pilule 36 (icône 18 + libellé Callout 500), 2 px d'écart. Reset view sans état ; Top / Front en `aria-pressed` : fond `accent-subtle` opaque + texte `accent-subtle-text` + graisse 600 + **coche à la place de l'icône** (sans décalage) ; **le contour accent de 2 px est supprimé** (la coche est le repère hors couleur). **Astuce** : `material-regular float`, rayon `xl`, "Got it" (bouton défaut petit) + X (ghost icône 32). Chargement : fond `--scene-floor` + `progressbar` 6 px. WebGL indisponible / échec / contexte perdu : carte opaque `role="alert"` (rayon `xl`, `shadow-3`, pastille d'erreur 48, Title 2). Info-bulles : **400 ms au survol, immédiate au focus clavier**, au-dessus du bouton. Transition de vue : `--duration-camera` / `--ease-in-out`, 0 en reduced motion. Entrée de la barre et de l'astuce : `rise` en `--ease-spring`.

## 15. Shell du Studio (US-005)
Maquette : `maquettes/US-005.html` (consignes développeur et écarts en bas de page).
- **Structure de fenêtre** : grille `auto 1fr` sur un conteneur (`container: app / inline-size`), barre d'outils en rangée 1 ; `aside` gauche, `main` et `aside` droit positionnés dans la rangée 2 / tout le cadre. DOM = ordre de tabulation : liens d'évitement, `header`, `aside` gauche, `main`, `aside` droit. La **scène occupe tout le cadre** (z 1) sous les volets (z 3) et la barre d'outils (z 4) ; liens d'évitement z 60. La page ne défile jamais ; les volets défilent en interne. Mise en page pilotée par la **largeur du conteneur** : volets **collés** ≥ 1024 px, superpositions flottantes en dessous ; barre d'outils sur 2 lignes < 640 px ; inspecteur en feuille < 560 px.
- **Zone libre** (cadrage caméra, dock) = entre les volets : **806 px à 1366 px** (758 px avec les panneaux flottants de la v0.3). Chrome « inset » (iPad paysage, ≥ 1024 px) : volets inset de 12 px, rayon `xl` → 560 px à 1180 px. Sous 1024 px : toute la largeur. Le cadrage ne bouge pas au repli ni à l'ouverture d'un volet (recalcul au chargement, Reset view, Top, Front, changement de bureau) ; le dock ne bouge pas au repli, mais **se recentre quand un volet s'ouvre** pour n'être jamais recouvert (contrôle US-005 ; UX-7 à reformuler). Le chrome inset n'est pas livré en US-005 (déclencheur à définir, par ex. `(hover: none) and (pointer: coarse)`) : volets collés en repli.
- **Barre d'outils** : élément `header` (banner unique, UX-3), **pas de `role="toolbar"`** (il fusionnerait les bascules en un seul arrêt de Tab et contiendrait le titre et le statut).
- **Barre d'outils unifiée** (`material-regular`, filet `separator`, 52 px mini) : bascule gauche (bouton de barre d'outils 40, icônes `panel-left-close/-open`, nom constant "Desk and objects panel", `aria-expanded` / `aria-controls`, info-bulle "Hide panel" / "Show panel"), mot-symbole `h1` (Headline 700 + pastille d'accent 10 px), filet, nom du document (Callout 500, tronqué, `title`), **verdict**, bascule droite ("Properties and alerts panel"). **Pas de Undo/Redo** (décision PO), ni File, Help, "Saved" tant que la fonction n'existe pas.
- **Barre latérale** (`material-regular`, 248, filet interne) : contrôle segmenté Desk / Objects (`tablist`, pouce en ressort), titre de section Headline + aide Subheadline, état vide = pastille 44 + Headline + Subheadline dans une carte blanche `lg`. **Inspecteur** (`material-regular`, 312) : sections Properties puis Alerts, états vides identiques.
- **Repli** : translation + fondu en `spring-soft` / `spring`, `visibility: hidden` après la transition (hors Tab et hors arbre d'accessibilité), le focus reste sur la bascule. **Superposition** (< 1024) : volet flottant `xl`, `glass-shadow`, largeur `min(--drawer-max-w, 100% − 64px)`, fermé au chargement, un seul ouvert, non modal, jamais sur la barre d'outils, Échap ferme et rend le focus à la bascule. L'**inspecteur** est un **popover** (320) sous la barre d'outils sur tablette, une **feuille ancrée en bas** (poignée, rayon `xl` en haut) sur téléphone.
- **États de scène** : chargement (barre **indéterminée**, statique en reduced motion), `unsupported`, **`failed`** ("The 3D view didn't load", "Try again", plus "Reload page" au 2e échec), `contextLost` : carte opaque `role="alert"`, boutons empilés, focus sur le titre. La barre d'outils, le verdict et les volets restent utilisables.
- **Liens d'évitement** : pastilles opaques `surface` 40 px, `shadow-3`, visibles au focus seulement.
- **Écarts à valider avec l'ux-designer** : (1) les bascules passent **dans la barre d'outils** (comme une fenêtre native) : la bascule droite est donc atteinte juste après la gauche, avant les volets et la scène (UX-5 la place en dernier). Option si l'ordre doit rester : placer la bascule droite après `main` dans le DOM et la positionner visuellement dans la barre par la grille. (2) Voir §16 pour l'écart entre lignes.

## 16. Choix du bureau (US-006)
Maquette : `maquettes/US-006.html`. `RadioGroup` "Desk model" : **liste groupée** (carte `surface`, rayon `lg`) de **7 lignes** (5 rectangulaires, 2 d'angle), ordre du catalogue.
- **Ligne** : 56 mini, padding 6 / 12 / 6 / 8, écart 8, coche 16 (`--icon-sm`) depuis US-007 (texte de 115 px dans la colonne utile réelle de **223 px**), vignette 56 × 44 (plan de dessus **à l'échelle commune** ≈ 0.2275 px/cm depuis US-007 : la borne max de Custom size, 240 cm, et le plus grand modèle du catalogue tiennent dans la boîte moins 1.4 pour le contour, jamais rogné ; dessinée en SVG par l'UI, `aria-hidden`, remplissage 16 % + contour 1.4 px en `currentColor` : le L se lit sans couleur), "L ×&nbsp;P&nbsp;cm" Headline tabulaire avec **espaces insécables** (U+00A0 après × et avant l'unité, partout où une cote s'affiche : « cm » jamais seul à la ligne), nom Subheadline `text-muted`, coche à droite (place réservée). Repos transparent ; survol `fill-hover` ; appui `fill` ; **actif** : fond `accent-subtle` + dimensions en `accent-subtle-text` + coche + `aria-checked` ; focus : anneau 3 px **intérieur** (`outline-offset: -3px`, distinct de la sélection).
- **Écart avec l'UX (à valider)** : plus d'« espace ≥ 8 px entre lignes » : la liste est un seul objet groupé avec **filet séparateur** (pattern natif) ; les cibles restent de 56 × 216 px.
- **Résumé "Selected"** sous la liste : carte groupée à 2 lignes (nom et cm en Headline, mm en Subheadline muted), légende Footnote "Width × depth × height". Non interactif. En taille personnalisée : "Custom, 150 × 75 cm".
- **Taille personnalisée (US-007)**, maquette `maquettes/US-007.html` : 8e ligne radio "Custom size" (jamais utilisée : "Set your own size" et plan 140 × 70 en pointillé 3/2 ; utilisée : cotes + "Custom size" ; **désactivée** si bureau d'angle : "Rectangular desks only" en `text-muted`, non focusable). La carte devient un wrapper : `RadioGroup` puis, **en frère hors du radiogroup**, le bloc de 3 NumberField cm (libellé + équivalent mm Footnote muted sur une ligne, champ biseau flex + stepper pilule 2 × 36 dessous, erreur `circle-alert` + Footnote `error` + contour 2 px). Ouverture `grid-template-rows` 200 ms, instantanée en reduced motion ; bornes en légende `.grp-f` sous la carte.
- **Erreur de catalogue** : bandeau `error-bg` dans le volet, "Desks couldn't load" + "Reload the page to try again." + "Reload page" (`role="alert"`).
- Clavier : un seul arrêt de Tab ; flèches = déplacement **et** application ; Début / Fin ; Espace ; annonce regroupée 400 ms après le dernier changement ; recadrage dans la zone libre avec marge ≥ 24 px, 480 ms. 7 lignes + résumé tiennent à 1366 × 768 sans défilement.

## 17. Liquid Glass : exploration, pas par défaut
Page : `maquettes/explorations/liquid-glass.html` (barre d'outils et barre de vue au-dessus d'une scène factice ; variantes A à D ; sondes de contraste et de FPS en direct).
- **Technique** : réfraction du bord par `backdrop-filter: url(#svg)` + `feDisplacementMap` (carte générée en canvas, injectée en data URI, aucune ressource externe) ; reflets spéculaires (liseré dégradé masqué + éclat radial qui suit le pointeur) ; contrôles qui s'étirent et se transforment en ressort (pouce du segmenté, pilule qui devient menu — ceux-ci en CSS seul).
- **Lisibilité AA** : un verre très clair (28 % de teinte) donne 1.7:1 sur le pire fond : impossible de porter du texte. Seules les variantes **à teinte 80 %** (B, C) sont acceptables : le « liquide » vit dans le bord (réfraction, reflets, liseré). Le verre clair ne convient qu'à des commandes à glyphes seuls ou sur pastille opaque.
- **Coût** : chaque lentille refiltre le fond à chaque image tant que la scène WebGL bouge ; à budgéter (≤ 100 000 px² de lentille ≈ barre d'outils + barre de vue, désactivée pendant l'orbite, dégradation automatique vers B au-delà de 20 ms par image). **Non mesuré** dans cet environnement : la page contient une sonde de FPS pour comparer A, B, C sur la machine du PO ; le QA devra mesurer.
- **Compatibilité** : flou/saturation partout (préfixe `-webkit-` sur Safari) ; **réfraction SVG uniquement dans Chromium** (Safari et Firefox l'ignorent) → repli sur la variante B (reflets, sans réfraction). Donc l'effet ne peut pas être l'identité du produit sur les appareils Apple (Safari).
- **Repli « Reduce transparency »** : fonds opaques `--material-solid`, ni liseré ni lentille (démontré par l'interrupteur de la page).
- **Recommandation** : ne pas livrer par défaut ; plus tard, apparence optionnelle « Liquid » (US-025), limitée à la barre d'outils et à la barre de vue, variante C avec repli B. Nouveaux tokens à prévoir à ce moment-là seulement : `--lens-scale`, `--lens-bezel`, `--specular-*`.

## 18. Changements v0.3 → v0.4 et impact sur le code
**Noms conservés, valeurs changées** : `--color-*` (neutres, accent, ombres), `--radius-lg` 16 → 14, `--radius-xl` 24 → 22, `--shadow-1/2/3`, `--glass-*` (désormais alias du matériau regular), `--topbar-h` 56 → 52, `--panel-pad` 20 → 16, `--text-lg` 18 → 17, `--text-3xl` 36 → 34, `--tracking-tight` -0.011 → -0.018em, `--tracking-overline` 0.06 → 0.04em, `--leading-normal` 1.5 → 1.45, `--ease-spring` (vrai ressort), `--scene-selection`, `--color-focus` (clair), `.glass` (plus de bordure : liseré dans l'ombre).
**Tokens ajoutés** : `--font-features(-alt)`, `--font-large-title` … `--font-caption` (10) et `--tracking-large-title` … `--tracking-caption` (10), `--weight-bold`, `--leading-snug`, `--icon-sm/md/lg/xl`, `--icon-stroke`, `--popover-w`, `--sheet-w`, `--duration-spring`, `--ease-spring-soft`, `--material-ultra-thin/thin/regular/thick`, `--material-filter-*`, `--material-solid(-raised)`, `--material-hairline/outline/rim/saturate`, `--color-raised`, `--color-separator`, `--color-fill(-hover)`, `--color-accent-solid(-hover/-active)`, `--color-on-accent-solid`, `--color-focus-halo`, classes `.material-*`, `.rim`, `.float`, `.t-*`.
**À adapter dans le code déjà écrit** (restylage prévu à US-005) : (1) `Button` principal : `--color-accent-solid*` et `--color-on-accent-solid` à la place de `--color-accent*` / `--color-on-accent` (sinon texte blanc sur bleu clair en sombre) ; boutons pilule, défaut = `--color-fill`, survol `--color-border`. (2) `ToolbarButton` : suppression du contour accent 2 px, coche en repère ; barre en `.material-thin` + `.float`. (3) `SceneOverlay` : astuce en `.material-regular` + `.float` ; carte d'erreur avec Title 2 ; barre de chargement 6 px (`--color-accent-solid`, piste `--color-fill`). (4) `global.css` : `font-feature-settings: var(--font-features)`, `-webkit-font-smoothing: antialiased`. (5) Le focus passe par le halo : ne plus redéfinir `box-shadow` sur `:focus-visible` (les états sélectionnés ne doivent pas écraser le halo). (6) Aucune valeur en dur : tout en `var(--…)`.

## 13. Questions pour le PO
1. Nom **Deskfit** acceptable (provisoire) ?
2. Accent **bleu système** acceptable ? Un accent choisi par l'utilisateur (plus tard) est prévu par les tokens.
3. **Taille minimale du texte** : garder 14 px (accessibilité, critères UX en vigueur) ou autoriser 13 px (Footnote / Caption) pour se rapprocher de la densité d'une app de bureau native ?
4. **Liquid Glass** : confirmer « option plus tard, limitée à la barre d'outils et à la barre de vue, repli sans réfraction hors Chromium » (§17) ?
5. **Options OpenType** : valider la variante par défaut (`ss03`) ou préférer la variante amicale (`cv11` + `ss01`) après comparaison dans le catalogue ?
6. **Liste des bureaux** : valider le pattern groupé (filet) à la place des lignes séparées de 8 px.
7. Option « Reduce transparency » à exposer dans Help / Settings en plus de la préférence système (proposé : oui, US-025) ?
