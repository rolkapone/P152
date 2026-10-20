# Design system — P152 (nom affiché : "Deskfit", validé par le PO au kickoff du Sprint 2)

> v0.3 (Sprint 2 : shell US-005 §15, choix du bureau US-006 §16, 6 tokens de mise en page ajoutés ; info-bulle immédiate au focus clavier). v0.2 (retour PO : direction inspirée du langage d'Apple, sans rien copier de protégé). UI en anglais, WCAG 2.2 AA, desktop d'abord (min 1366x768), thème par défaut = système. Valeurs : `tokens.css` (source consommée) et `tokens.json` (miroir). Catalogue visuel : `maquettes/index.html`.

## 1. Direction visuelle : **Épuré · Aéré · Précis**
- **Épuré** : neutres (clair/sombre) + **une seule couleur d'accent** (bleu). Aucun dégradé décoratif, aucune illustration. Les couleurs vives sont réservées au statut (verdict, alertes) et à la sélection.
- **Aéré** : beaucoup d'espace (padding de panneau 20, sections 32, marges flottantes 12), rayons généreux, une idée par bloc. La scène 3D occupe tout le viewport ; les panneaux et barres flottent dessus.
- **Précis** : chiffres tabulaires, unités toujours affichées, cotes lisibles ; verdict toujours visible (seules les Error donnent "Doesn't fit").
- Rendu 3D visé : **photo produit en studio** (fond clair continu, éclairage doux, ombres de contact douces). Détail côté 3D : `docs/design/3d/direction-artistique.md`.
- Nom provisoire **Deskfit** ; le logo est un mot-symbole texte (pas d'asset). Alternatives : "Fitdesk", "Setupfit".

## 2. Thèmes
Clair et sombre. Sans attribut `data-theme` sur `<html>`, l'UI suit `prefers-color-scheme` (**défaut = système**). Un choix manuel (`data-theme="light|dark"`, bouton dans Help, futur) prime. Les tokens `[data-theme]` marchent aussi sur un conteneur. Les tokens `--scene-*` définissent le studio de chaque thème (clair : studio blanc cassé ; sombre : studio anthracite).

## 3. Couleurs et contrastes (calculés, WCAG 2.x)
| Usage | Clair | Sombre | Ratio mini visé / obtenu |
|---|---|---|---|
| Texte `--color-text` sur surface | #1B1F27 / #FFF | #E8EBF0 / #171B22 | 4.5 / 16.3 · 14 |
| Texte atténué | #545D6C | #A3ACBA | 4.5 / 6.7 (5.8 sur surface-2) · 6.8 |
| Accent (lien, focus, texte) | #1F5FD1 | #6C9CFF | 4.5 / 5.8 · 6.4 |
| Texte sur bouton accent | #FFF sur #1F5FD1 | #0B1220 sur #6C9CFF | 4.5 / 5.8 · 7.0 |
| Contour de champ `border-strong` | #7A8394 | #7D8798 | 3 / 3.8 · 4.8 |
| Success | #137A3F sur #E3F4EA | #4CC38A sur #12301F | 4.5 / 4.8 · 6.4 |
| Error | #B42318 sur #FDECEA | #FF8A80 sur #3A1714 | 4.5 / 5.7 · 7.0 |
| Warning (texte) / icône | #8A4B00 / #B86E00 sur #FFF3DC | #F2B04A sur #33260D | 4.5 / 6.2 · 7.8 ; icône 3 / 3.6 |
| Info | #0B6B8A sur #E3F3F8 | #5CC4E0 sur #0F2A33 | 4.5 / 5.3 · 7.4 |
| Bouton destructif | #FFF sur #B42318 | #FFF sur #C4302B | 4.5 / 6.6 · 5.5 |
| Focus ring | #1F5FD1 | #8AB2FF | 3 / 5.8 · 8+ |
Ratios calculés à la main (luminance relative WCAG) ; le QA les revérifie avec axe-core. `--color-border` (#DDE0E7) est purement décoratif (séparateurs, cartes) ; tout contour porteur d'information (champs, bouton radio non coché) utilise `border-strong`. Les boutons secondaires sont des aplats `surface-2` sans contour : leur libellé suffit à les identifier (1.4.11).

**Sémantique de statut** (jamais la couleur seule, 1.4.1) : icône + mot de gravité + couleur.
| Niveau | Icône | Mot | Effet sur le verdict |
|---|---|---|---|
| Error | cercle-croix | "Error" | "Doesn't fit" |
| Warning | triangle | "Warning" (conseil) | aucun : "It fits - N tips" |
| Info | cercle-i | "Tip" | aucun |
| Succès | coche | "It fits" / "Done" | — |
Sur la scène : objet en Error = contour rouge + hachures diagonales + pastille icône ; Warning = contour pointillé orange + pastille. Sélection = contour **à 2 tons** (blanc + sombre) + accent, lisible sur studio clair ou sombre.

## 4. Typographie et police Inter (auto-hébergée)
- **Police : Inter** (SIL Open Font License 1.1). **Aucune requête tierce** (la CSP interdit les ressources externes) : pas de Google Fonts, pas de CDN, pas d'`@import` distant.
- **Fichier** : Inter **variable**, sous-ensemble **latin**, `woff2`, axe de graisse seul (100–900), ≈ 48 Ko. Nom : `inter-latin-wght-normal.woff2`. Emplacement : **`public/fonts/inter-latin-wght-normal.woff2`**, servi en same-origin (`font-src 'self'`).
- **Obtention** : copier le fichier `files/inter-latin-wght-normal.woff2` du paquet npm `@fontsource-variable/inter` (ou de la release officielle rsms/inter, `InterVariable.woff2` à sous-ensembler en latin) dans `public/fonts/`. Ne pas importer le CSS du paquet au runtime (le `@font-face` est déjà dans `tokens.css`).
- **`@font-face`** : dans `tokens.css` (hors bloc synchronisé), `font-display: swap`, `unicode-range` latin, `src: local("Inter Variable"), local("Inter"), url("/fonts/inter-latin-wght-normal.woff2")`. Précharger : `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/inter-latin-wght-normal.woff2">`.
- **Repli** : `system-ui`, Segoe UI, Roboto, Arial (génériques, non propriétaires du produit). Le symbole « ≈ » n'est pas dans le sous-ensemble latin : il s'affiche en police de repli (acceptable) ; sinon écrire "about 864 mm".
- **Licence à consigner** (propriétaire : technical-artist/developer, dans `docs/design/3d/licences-assets.md` ou un `THIRD_PARTY_LICENSES`) : « Inter, © The Inter Project Authors (https://github.com/rsms/inter), SIL Open Font License 1.1, auto-hébergée, non modifiée hors sous-ensemble ». Inclure le texte de l'OFL à côté du fichier (`public/fonts/OFL.txt`). Inter ne doit pas être revendue seule ; ne pas la renommer si on la modifie (Reserved Font Name).
- **Maquette** : la page utilise Inter si installée localement, sinon le repli système ; aucun réseau.

| Token | Taille | Usage |
|---|---|---|
| `--text-sm` | 14 px | libellés, aide, overline (minimum de l'UI) |
| `--text-md` | 16 px | corps, boutons, champs |
| `--text-lg` | 18 px | titres de panneau, verdict |
| `--text-xl` | 22 px | titres de modale |
| `--text-2xl` | 28 px | titres de section de page |
| `--text-3xl` | 36 px | titre du Welcome uniquement |
Graisses 400 / 500 / 600 ; interligne 1.5 (corps), 1.2 (titres) ; titres ≥ 22 px avec `--tracking-tight`. Overline : 14 px, 600, majuscules, tracking 0.06em. Chiffres tabulaires partout. Aucune taille < 14 px. Lisible à 200 % de zoom (panneaux repliables, reflow).

## 5. Espacements, rayons, ombres, verre
- **Espacement** (base 4) : 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64. Padding de panneau **20**, gap entre champs 16, entre sections 32, marge des panneaux flottants **12**.
- **Rayons (échelle unique 6 / 10 / 16 / 24 / pill)** : `sm 6` puces, tooltips, vignettes · `md 10` boutons, champs · `lg 16` cartes, alertes, toasts · `xl 24` panneaux et barres flottants, modales · `pill` verdict, barre de scène, segments. Règle d'imbrication : rayon interne = rayon externe − padding.
- **Ombres douces multicouches** (3 à 4 couches, faible opacité, plus larges en s'élevant) : `shadow-1` cartes · `shadow-2` menus, toasts · `shadow-3` modales · `glass-shadow` panneaux de verre (inclut un reflet interne 1 px). En sombre, l'élévation se lit aussi par la surface plus claire.
- **Effets de verre** (panneaux et barres au-dessus de la scène : top bar, panneaux gauche/droit, barres de scène, pastille d'aide) :
  - Recette : `background: var(--glass-tint)` + `backdrop-filter: blur(24px) saturate(180%)` + `border: 1px solid var(--glass-border)` + `--glass-shadow`. Primitive CSS : classe `.glass` dans `tokens.css`.
  - **Teinte à 86 % minimum**. Contrastes calculés sur le **pire fond possible** (noir pur sous verre clair → composite ≈ #DBDBDB ; blanc pur sous verre sombre → composite ≈ #3E3E3F) : texte 11.9 · 9.0 ; texte atténué 4.8 · 4.7 ; lien sur verre (`--glass-link`) 5.4 · 5.0 ; icônes d'erreur 4.75 · 4.7 ; anneau de focus 4.2 · 5.0 (≥ 3 exigé). Ces valeurs valent donc quel que soit le rendu 3D derrière.
  - Sur verre, le **statut** (success/warning/info) n'est jamais du texte nu : toujours en pastille ou bandeau à fond `*-bg` opaque. Les liens utilisent `--glass-link`, pas `--color-accent`. Les états sélectionnés utilisent `accent-subtle` opaque.
  - **Replis** (fond opaque `--color-surface`, bordure `--color-border`, sans flou) : si `backdrop-filter` n'est pas supporté (`@supports not`), **et** si `prefers-reduced-transparency: reduce`, **et** classe `.no-glass` (option utilisateur future). L'interface reste identique, seul le flou disparaît.
  - Les modales sont **opaques** (beaucoup de texte) ; seul leur voile (`.scrim`) floute légèrement la scène, avec le même repli.
- Contrôles : hauteur 36 (défaut), 32 (compact, dans panneaux/barres), 44 (actions principales de modale/Welcome). Cible minimale 32 × 32 (≥ 24 exigé par 2.5.8).

## 6. Icônes
**Lucide** (https://lucide.dev), licence **ISC** (libre, usage commercial, fichier de licence conservé), paquet `lucide-react`. Trait 1.75 px, 20 px (16 px en dense), `currentColor`. Jamais d'icône seule sans nom accessible (`aria-label` + Tooltip) ; dans la bibliothèque et les menus, icône + libellé. La page maquette utilise des tracés inline équivalents ; l'implémentation utilise les Lucide homonymes : `check-circle-2`, `x-circle`, `alert-triangle`, `info`, `undo-2`, `redo-2`, `help-circle`, `pencil`, `chevron-down`, `rotate-ccw`, `rotate-cw`, `copy`, `trash-2`, `magnet`, `monitor`, `keyboard`, `mouse`, `speaker`, `lamp-desk`, `cpu`, `panel-left`, `panel-right`, `panel-left-close` / `panel-left-open` / `panel-right-close` / `panel-right-open` (bascules de panneau), `circle-dashed` (verdict vide), `x`, `file`, `upload`, `download`.

## 7. États (tous composants interactifs)
| État | Traitement |
|---|---|
| Normal | champs : surface + contour `border-strong` ; boutons secondaires : aplat `surface-2` |
| Survol | fond plus marqué (`border`/`accent-hover`) + élévation légère des cartes (−1 px, shadow-2) ; jamais la seule indication |
| Appuyé | `scale(var(--press-scale))` + `accent-active` / fond assombri |
| **Focus visible** | anneau 3 px `--color-focus`, décalage 2 px + halo `surface` ; uniquement au clavier (`:focus-visible`/`[data-focus-visible]`) ; jamais masqué par un panneau flottant (`scroll-padding`) |
| Sélectionné / actif | fond `accent-subtle` + texte `accent-subtle-text` + indicateur (coche, graisse 600, contour accent) |
| Désactivé | texte `text-disabled`, `cursor: not-allowed`, `aria-disabled` ; pas d'info critique seulement en désactivé |
| Erreur de champ | contour 2 px `error`, icône croix, message sous le champ relié par `aria-describedby` ("Enter a width between 800 and 2400 mm.", bornes injectées depuis le catalogue) |
| Warning / Info | bandeau : fond `*-bg`, icône, mot de gravité, rayon `lg` |
| Chargement | "Loading 3D scene…" + barre `role="progressbar"` ; panneaux visibles ; statique en reduced motion |

## 8. Motion (fluide, jamais bloquante)
- **Durées** : `fast 120` (survol, appui) · `base 200` (menus, toasts, fondus) · `slow 320` (panneaux, barres, modales) · `camera 480` (transitions de caméra 3D).
- **Courbes** : `standard` (0.2,0,0,1) changements d'état · `out` (0.16,1,0.3,1) entrées et déplacements · `in-out` (0.65,0,0.35,1) caméra · **`spring`** (0.34,1.3,0.64,1) ressort léger, dépassement ≈ 3 %, pour apparition des barres flottantes, modales (scale 0.96→1), verdict qui change, toasts.
- Appui bouton : `scale(0.97)` en `fast`. Repli de panneau : translation + fondu en `slow` / `out`. Aucune animation clignotante, aucune boucle décorative.
- **`prefers-reduced-motion: reduce`** : tous les tokens de durée passent à 0, `--press-scale: 1`, et une règle globale neutralise `animation`/`transition` (déjà dans `tokens.css`). Le chargement devient une barre statique, la caméra saute directement à la vue. Les animations ne portent jamais d'information essentielle.

## 9. Composants du Studio (React Aria Components → wrapper `ui/components/`)
Mise en page : la scène remplit tout le viewport sous la top bar ; **top bar, panneaux gauche et droit, barre de scène sont des panneaux de verre flottants** (marge 12, rayon `xl`). Aucune mise en page tierce reprise : structure issue de nos wireframes UX.
| Composant | Base RAC | Contenu / règles clés |
|---|---|---|
| App bar (verre) | `Toolbar` + `MenuTrigger` | Hauteur 56 mini, rayon `xl`. Gauche : mot-symbole, nom du setup, puis (quand la fonction existe) "Saved in this browser", Undo/Redo, File ▼. Droite : **Verdict**, Help. Liens "Skip to 3D view" / "Skip to alerts" avant tout. **US-005 : seuls le mot-symbole, le nom (lecture seule) et le verdict vide sont rendus** (voir §15). |
| **Verdict** | `role="status"` (+ `aria-live="polite"`) | Pastille 40 px, 18 px/600, fond `*-bg` opaque. "It fits", "It fits · 2 tips", "Doesn't fit · 2 issues". **État vide (US-005) : "Nothing to check yet", fond `surface-2`, contour `border-strong`, icône `circle-dashed`.** Change avec un léger ressort. Toujours visible, jamais replié (passe sur une 2e ligne en dessous de ~400 px). |
| Panneau gauche (verre) | `Tabs` | 248 px, repliable. Onglets en **contrôle segmenté** (Desk / Objects) sur la même ligne que la bascule ; **lignes de bureau** en `RadioGroup` (vignette à l'échelle commune, contour accent 2 px + coche si actif : §16) ; bibliothèque en `GridList` (icône + libellé). |
| Panneau droit (verre) | sections | 312 px, repliable, défile en interne. Properties puis Alerts (§15). |
| Bascule de panneau | `Button` + `Tooltip` | 40 px, premier enfant du panneau, même coin replié ou non ; replié = pastille de verre de 56 px. Tiroir sous 1024 px (§15). |
| **NumberField mm** | `NumberField` | Label visible, valeur alignée à droite (tabulaire), suffixe "mm", boutons −/+ (pas 10, Maj 1, Ctrl 100), plage en aide. États : normal, focus, erreur, désactivé. |
| Liste d'alertes | `ListBox` | Groupées par gravité ; icône + mot + texte actionnable (quoi, combien, que faire) + "Show". |
| Barre flottante de scène (verre) | `Toolbar` | Bas-centre, pill. Vues : Reset view · Top · Front (`aria-pressed`) ; Snap. Barre contextuelle : Rotate −15°/+15° · Duplicate · Delete. |
| Modales | `Modal` + `Dialog` | **Opaques**, rayon `xl`, shadow-3, voile flouté (`.scrim`). 480 px (Welcome 640). Focus piégé, Échap ferme. |
| Toasts | `ToastRegion` | Bas-droite, rayon `lg`, shadow-2, 5 s (≥ 6 s avec action), pause au survol/focus, "Undo" plutôt que confirmation. |
| Bandeau d'erreur | `role="alert"` | Haut du Studio, fond `error-bg`, icône + texte + actions. |
| Tooltip | `Tooltip` | Fond `text` inversé, 14 px, **400 ms au survol, immédiate au focus clavier** (comportement React Aria, accepté au contrôle design US-004), Échap la ferme sans quitter le focus. |

## 10. Accessibilité (rappels)
Focus jamais masqué par les panneaux flottants ; ordre Tab top bar > gauche > scène > droite ; tout drag a son alternative (champs X/Y mm, flèches) ; annonces `aria-live` regroupées ; cibles ≥ 32 px ; texte ≥ 14 px ; reflow à 200 % ; jamais d'info par la couleur seule ; fonctionne sans verre (`prefers-reduced-transparency`) et sans animation (`prefers-reduced-motion`).

## 11. Emplacements futurs
Onglets Style / Ambience / Decor, Material, Day/Night, Shopping list : mêmes composants, aucun nouveau style, uniquement quand la fonction existe.

## 12. Inspiration et limites
**Ce qu'on reprend (principes génériques du design moderne, non protégeables)** : épure et espace généreux ; neutres + une seule couleur d'accent ; coins arrondis cohérents ; ombres douces multicouches ; panneaux translucides floutés au-dessus du contenu ; animations fluides à ressort léger ; rendu 3D façon photo produit en studio.

**Ce qu'on s'interdit** :
- la police **SF Pro** (ni aucune police propriétaire Apple) : on utilise **Inter** (OFL) auto-hébergée ;
- les icônes **SF Symbols** : on utilise **Lucide** (ISC) ou équivalents libres ;
- tout **logo Apple**, pomme, ou pictogramme de marque ; le mot-symbole "Deskfit" est le nôtre ;
- toute **mise en page identifiable** d'un produit Apple (barre de menus, Dock, fenêtres à boutons "feux tricolores", écrans copiés) : nos écrans suivent les wireframes UX ;
- le **vocabulaire de marque** Apple (noms commerciaux de matériaux/effets, de produits, de fonctions) dans l'UI, le code, les docs publiques ; on dit "glass", "floating panel", pas un nom de marque ;
- les captures, visuels ou assets d'un produit Apple, y compris comme référence dans les maquettes livrées.
Toute nouvelle inspiration est jugée sur ce critère : on reprend un principe, jamais une œuvre.

## 14. Scène 3D et barre de vue (US-004)
Maquette : `maquettes/US-004.html` (section 7 = consignes développeur, aucun nouveau token). Barre de vue = pill de verre, boutons pill 36 px (icône + libellé 14 px), Reset view sans état, Top/Front en `aria-pressed` (fond `accent-subtle` opaque + contour 2 px accent + coche remplaçant l'icône, sans décalage). Astuce = bandeau de verre `radius-xl`, "Got it" + X. Chargement : fond `--scene-floor` + `progressbar`. WebGL indisponible / contexte perdu : carte opaque `radius-xl`, `role="alert"`, "Try again". Info-bulles : fond `text` inversé, **400 ms au survol, immédiate au focus clavier** (maquette US-004 mise à jour au Sprint 2). Transition de vue : `--duration-camera` / `--ease-in-out`, 0 ms en reduced motion.

## 15. Shell du Studio (US-005)
Maquette : `maquettes/US-005.html` (consignes développeur en bas de page). **Nouveaux tokens (Sprint 2)** : `--drawer-max-w` 360 px, `--toggle-size` 40 px, `--row-min-h` 56 px, `--thumb-w` / `--thumb-h` 56 × 44 px, `--z-skip` 60 ; aucun autre.
- **Structure** : grille (marges et gap `--float-inset`), lignes `auto 1fr` ; DOM = ordre de tabulation (skip links, `header`, `aside` gauche, `main`, `aside` droit) ; la scène occupe tout le cadre sous les autres (z : scène 1, panneaux 2, barre du haut 3, skip links 60). La page ne défile jamais, les panneaux défilent en interne. Mise en page pilotée par la **largeur du conteneur** ; seuil de bascule en tiroirs : **1024 px**.
- **Barre du haut** : verre, rayon `xl`, hauteur mini 56, passe à la ligne si besoin (le verdict descend, calé à droite). Mot-symbole `h1` "Deskfit" 18/600 + pastille accent CSS ; nom du setup en 16/500 tronqué. **Pas de Undo/Redo, File, Help, "Saved" tant que la fonction n'existe pas** (aucun bouton mort) ; variante Undo/Redo désactivés montrée en attente de validation du PO.
- **Verdict vide** : voir §9. **Panneaux** : bascule en coin (gauche : haut-gauche ; droit : haut-droit), icônes `panel-*-close` / `-open`, nom accessible constant, `aria-expanded`, info-bulle "Hide panel" / "Show panel". Replié : la même bascule dans une pastille de verre de 56 px, contenu `visibility: hidden` après le fondu (hors Tab et hors arbre d'accessibilité). Transition 320 ms `out`, 0 en reduced motion. Le repli ne déplace jamais caméra ni dock.
- **Tiroirs (< 1024 px)** : mêmes composants, fermés au chargement, un seul ouvert, largeur `min(--drawer-max-w, 100% − 64px)` (la pastille de l'autre panneau reste visible), jamais sur la barre du haut, non modaux, Échap ferme et rend le focus à la bascule.
- **Onglets** (contrôle segmenté, pill) : sélectionné = fond `accent-subtle` + texte `accent-subtle-text` + graisse 600 + contour accent 2 px. Titres de section (`h2`) en style overline ; états vides : titre 16/600 + explication 14 `text-muted`.
- **Skip links** : pastilles opaques `surface`, 40 px, `shadow-3`, visibles au focus seulement, au-dessus de tout.
- **États de scène** : chargement (barre **indéterminée**, segment 40 % qui glisse, statique et centrée en reduced motion), `unsupported`, **`failed`** ("The 3D view didn't load", bouton "Try again", plus "Reload page" au 2e échec), `contextLost` : carte opaque `role="alert"`, boutons empilés. Dock et cadrage dans la **zone libre** entre les panneaux ouverts au chargement.

## 16. Choix du bureau (US-006)
Maquette : `maquettes/US-006.html`. `RadioGroup` nommé "Desk model", une ligne (56 px mini, rayon `lg`) par modèle, ordre du catalogue.
- **Ligne** : vignette 56 × 44 (plan de dessus, **échelle commune** = ajustée au plus grand modèle du catalogue, dessinée en SVG par l'UI, `aria-hidden`), "L × P cm" 16/600, nom 14 `text-muted`, coche à droite (réservée, jamais de décalage). Repos : fond `surface-2`. Survol : fond `border`, −1 px, `shadow-1`. **Actif** : contour accent 2 px (bordure transparente de 2 px réservée) + fond `accent-subtle` + coche + nom en 600. Focus : anneau standard (distinct du contour actif). Appui : `scale(0.97)`.
- **Résumé "Selected"** sous la liste (nom + cm, mm, légende), non interactif. Pas de "Custom size" (US-007).
- **Erreur de catalogue** : bandeau `error-bg` dans le panneau, "Desks couldn't load" + "Reload page" (`role="alert"`).
- Clavier : un seul arrêt de Tab ; flèches = déplacement **et** application ; annonce regroupée 400 ms après le dernier changement ; recadrage dans la zone libre avec marge ≥ 24 px, 480 ms.

## 13. Questions pour le PO
1. Nom **Deskfit** acceptable (provisoire) ?
2. Accent **bleu** sobre acceptable, ou autre teinte (vert sauge, violet) ? (une seule, pour tout le produit)
3. Option "Reduce transparency" à exposer dans Help/Settings en plus de la préférence système ? (proposé : oui, plus tard)
4. Validation de la teinte de verre à 86 % (choisie pour garantir AA sur tout fond ; plus transparent = plus de risque de contraste).
