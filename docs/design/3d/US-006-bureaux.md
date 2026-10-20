# US-006 — Catalogue de bureaux et ombre de contact (technical-artist)

Statut : proposition pour validation du PO (Sprint 2). Aucun asset externe : tout est procédural, rien à ajouter à `licences-assets.md`. Aucun code modifié. Données modifiées : `assets/catalog/object-types/desk.json` (v2), nouveau `assets/catalog/object-types/desk-corner.json`. `studio.json` n'est **pas** modifié (voir section 4, en attente du PO).

Aperçu : `docs/design/3d/apercu-bureaux/index.html` (three.js 0.170.0 via jsDelivr, accès internet requis ; ouvrir le fichier dans un navigateur). Il montre le rendu studio validé, un sélecteur de cartes (les 7 bureaux), le choix du plateau, des objets témoins, le mode clair/sombre, et l'avant/après de l'ombre de contact (Before / After / Split).

## 1. Catalogue de bureaux

Tous : hauteur 740 mm (bornes 600–1300), épaisseur 25 mm, pieds `post`, slots `top` (défaut `mat.birch`) et `legs` (défaut `mat.black-metal`), neutres et sans marque. Libellé de carte en anglais, dérivé de l'id du preset tant que les presets ne portent pas de nom (voir section 2).

| Entrée | Preset | Carte (EN) | Dimensions (mm) | Triangles (aperçu) |
|---|---|---|---|---|
| `desk.rect` | `compact` | Compact desk, 100 × 60 cm | 1000 × 600 | 1272 |
| `desk.rect` | `basic` | Basic desk, 120 × 60 cm | 1200 × 600 | 1272 |
| `desk.rect` | `standard` (défaut) | Standard desk, 140 × 70 cm | 1400 × 700 | 1272 |
| `desk.rect` | `large` | Large desk, 160 × 80 cm | 1600 × 800 | 1272 |
| `desk.rect` | `gaming` | Gaming desk, 180 × 80 cm | 1800 × 800 | 1272 |
| `desk.corner` | `standard` | Corner desk, 160 × 140 cm | 1600 × 1400, bras 600, aile 600 | 980 |
| `desk.corner` | `large` | Corner desk large, 180 × 160 cm | 1800 × 1600, bras 700, aile 700 | 980 |

Changements dans `desk.json` : `large` passe de 1800 × 800 à **1600 × 800** et `gaming` (1800 × 800) est ajouté, pour couvrir 120/140/160/180 cm comme demandé ; `basic` (120 × 60) est ajouté. Aucun test ni code ne référence `large` (vérifié). Les 5 cartes rectangulaires et les 2 cartes d'angle donnent 7 cartes ; le sprint demande au moins 5 plus l'angle.

Budget : `desk.rect` reste à 1500 triangles / 2 draw calls (1272 mesurés dans l'aperçu). `desk.corner` : 2500 triangles / 2 draw calls (980 mesurés). Très en dessous du plafond de 10 000 de `limits.ts`.

### Bureau d'angle `desk.corner`

Paramètres (tous en mm, hors `orientation`) :

| Param | Défaut | Min | Max | Sens |
|---|---|---|---|---|
| `width` | 1600 | 1200 | 2400 | boîte englobante en X (longueur du bras principal) |
| `depth` | 1400 | 1000 | 2000 | boîte englobante en Z (longueur de l'aile, du bord arrière au bord avant) |
| `armDepth` | 600 | 500 | 800 | profondeur du bras principal, contre le mur du fond |
| `wingWidth` | 600 | 500 | 800 | largeur de l'aile de retour |
| `orientation` | `right` | `right`, `left` | | côté de l'aile vu depuis l'utilisateur (côté +Z) ; l'utilisateur s'assoit dans l'angle du L |
| `height`, `thickness`, `legStyle` | 740, 25, `post` | comme `desk.rect` | | |

Les bornes statiques garantissent la cohérence sans règle croisée : `armDepth` ≤ 800 < `depth` min 1000, et `wingWidth` ≤ 800 < `width` min 1200. `validateCatalog` n'a donc rien à ajouter.

Repère : origine = centre de la boîte englobante `width × depth`, bord arrière à `z = -depth/2`, côté utilisateur +Z, comme `desk.rect`. Cadrage caméra et boîte d'exclusion restent valables (voir section 5). Orientation `right` : l'aile est du côté +X ; `left` est le miroir (symétrie en X).

Forme : contour du L à 6 sommets, `[-hx,-hz] → [hx,-hz] → [hx,hz] → [hx-w,hz] → [hx-w,-hz+a] → [-hx,-hz+a]` (hx = width/2, hz = depth/2, a = armDepth, w = wingWidth). Plateau : un seul `ExtrudeGeometry` (coins arrondis 25 mm en plan, 12 mm au coin rentrant, chanfrein de bord 9 mm, 3 segments) = 1 draw call. Pieds : 6 poteaux (rayon 22 → 18 mm) à 60 mm des bords, aux 6 sommets du contour réduit ; traverses (70 × 16 mm, à 45 mm sous le plateau) côté arrière et côté extérieur de l'aile. Empreinte au sol et pour les alertes : union de deux rectangles (bras `width × armDepth`, aile `wingWidth × (depth − armDepth)`), déclarée dans `placement.footprintParts` (descriptif).

### La forme en L demande-t-elle d'étendre le schéma ?

**Non pour les données** : `desk-corner.json` passe `ObjectTypeSchema` et `validateCatalog` sans changement (params libres, enum de chaînes, `footprintParts` et `clearanceFrontMm` existent déjà ; `validate.test.ts` « catalog in assets/catalog » reste vert). **Oui pour le générateur** (graphics-engineer, environ 1 pt) : `deskLayout` ne sait faire que le rectangle. À écrire : le contour du L, l'extrusion du plateau, les 6 pieds et 2 traverses, les rectangles d'empreinte. Le code de référence est dans l'aperçu (`buildDesk`, `roundedPolygon`).

Extensions de schéma **optionnelles** (non bloquantes, à décider avec le developer) :

1. `PresetSchema` : ajouter `name?: { en: string ≤ 80 }` et `materials?: Record<Key, MaterialId>`. Permet des noms de cartes éditoriaux (« Gaming ») et des finitions par bureau. Impact `validateCatalog` : dans `checkObjectType`, pour chaque `preset.materials`, vérifier que le slot existe (`slots[].id`) et que le matériau existe (`unknownMaterial`) ; ~10 lignes plus tests. Sans cette extension, l'UI dérive le nom depuis l'id du preset (« Gaming ») et la dimension depuis les params, et les matériaux par défaut sont ceux des slots.
2. Rien d'autre : pas de `shape`, pas de contrainte inter-paramètres.

### Impact sur les tests existants (à signaler au developer)

`src/core/catalog/validate.test.ts` (ligne ~149) supprime `desk.json` et attend `missingDesk` ; il échoue maintenant, car `desk-corner.json` est aussi un type `desk`. Corriger le test pour supprimer les deux fichiers (comportement du code correct). C'est le seul échec observé (43/44 tests de `src/core/catalog`).

Suivi du bureau choisi dans `studio.json` : `desk.type` reste `desk.rect` / `standard` (valide). L'état courant du bureau vient du setup, pas de ce fichier.

## 2. Matériaux et styles

Aucune nouvelle matière ni couleur : `mat.birch` et `mat.black-metal` par défaut ; les styles existants s'appliquent par rôle `top` et `legs` aux deux types de bureau (testé dans l'aperçu avec les finitions Birch, Oak, Walnut, White, Black).

## 3. Aperçu

`docs/design/3d/apercu-bureaux/index.html` : cartes des 7 bureaux (carte active : contour accent 2 px + coche), annonce en `role="status"` des dimensions et du preset, mode clair/sombre, vues Reset/Top/Front recadrées selon la taille du bureau (transition 480 ms), objets témoins (écran 27 pouces, clavier, souris) qui suivent le bureau. Le sélecteur est une maquette du rendu, pas l'interface finale (le panneau « Desk » vient du ui-designer).

## 4. Ombre de contact : proposition chiffrée

Constat (QA de US-004) : sous un bureau vide, le plan d'ombre est trop lourd. Mesure sur le gradient réel (`src/render/math/contactShadow.ts`, plan = empreinte / 0,62) pour le bureau 1400 × 700 :

| Réglage | Opacité | Empreinte | Alpha sous le bureau | À 100 mm du bord (X) | À 200 mm du bord (X) |
|---|---|---|---|---|---|
| Avant (`studio.json` actuel) | 0,42 | 1500 × 800 (fixe) | 0,42 | 0,31 | 0,18 |
| **Après (proposé)** | **0,24** | **1200 × 540** (bureau − 200 × 140) | 0,24 | ~0,04 | ~0,00 |

Effet : la tache sombre ne déborde plus du plateau, l'ombre portée VSM de la lampe clé porte seule l'ombre franche, l'ombre de contact ne fait plus que « poser » les pieds et l'ombre sous le plateau. Les pieds (70 mm) partagent le matériau, donc passent aussi de 0,42 à 0,24 : ils restent lisibles dans l'aperçu. Le flou reste celui du dégradé (smoothstep), non réglable par donnée.

Changement dans `studio.json`, champ `lighting.contactShadow` :
`"opacity": 0.42 → 0.24` et `"deskFootprintMm": [1500, 800] → [1200, 540]`. Ce sont deux valeurs de données (validées par `StudioSceneSchema` : `Unit01` et `Millimetres`) : **pas de changement de code pour le bureau par défaut**, donc traitable dans la marge du sprint, une fois validé par le PO. Je ne l'ai pas appliqué avant sa validation.

**Mais, dès que US-006 permet de changer de bureau, l'empreinte fixe devient fausse** (déjà vrai pour 1000 × 600 ou 1800 × 800, et absurde pour le L, voir « Before » dans l'aperçu avec le bureau d'angle). Il faut donc, dans US-006 : dériver l'empreinte du bureau (largeur − 200 mm, profondeur − 140 mm ; pour le L, deux rectangles bras + aile) dans `Desk.tsx` / `deskLayout`. Proposition de donnée : ajouter `contactShadow.deskInsetMm: [200, 140]` (clé tolérée par `z.looseObject`, à lire dans `toStudioConfig`) et garder `deskFootprintMm` comme valeur de repli. C'est un petit changement de code (graphics-engineer, ~10 lignes, dans le périmètre de US-006).

## 5. Autres points à traiter par le graphics-engineer pour US-006

- `camera.limits.deskKeepOutMm` est fixe (demi-largeur 700, demi-profondeur 350, hauteur 740) : à dériver de la boîte englobante du bureau, sinon la caméra peut entrer dans un bureau de 1800 mm ou d'angle.
- Distances de caméra des vues Reset/Top/Front : l'aperçu les met à l'échelle `k = max(1, max(w/1400, d/800) × 0,92)` ; `camera.limits.maxDistance` passe de 4,5 à 6 m dans l'aperçu pour les grands bureaux d'angle (à valider avec le graphics-engineer).
- Le plateau du L doit rester une seule géométrie (1 draw call) ; mise à jour `renderer.shadowMap.needsUpdate` à chaque changement de bureau.
- Les alertes « ça rentre ? » (US-010 et suivantes) doivent utiliser l'union des deux rectangles pour `desk.corner`, pas la boîte englobante ; l'angle intérieur est vide.
- `legStyle: frame` est déclaré pour `desk.rect` mais non généré aujourd'hui ; je ne l'ai donc proposé pour aucun preset, et `desk.corner` ne l'expose pas.

## 6. Questions pour le PO

1. Valider l'ombre allégée (opacité 0,24, empreinte bureau − 200 × 140 mm) ? Je l'applique dans `studio.json` à votre accord.
2. Sept cartes (5 rectangulaires + 2 d'angle) ou seulement 5 + 1 ? Le bureau d'angle « large » est facultatif.
3. Le bureau d'angle est livré avec un seul sens à l'écran (`right`) ou avec un choix gauche/droite dès US-006 ? Les données et le générateur gèrent les deux ; seule l'interface (contrôle segmenté dans le panneau) est en jeu.
4. Accepter le changement de `large` (1800 × 800 devient 1600 × 800, `gaming` reprend 1800 × 800) ?
5. Bornes du bureau (question 1 du backlog) : j'ai gardé largeur 800–2400 mm, profondeur 500–1000 mm, hauteur 600–1300 mm pour `desk.rect`, conformément à votre décision ; le bureau d'angle a ses propres bornes (largeur 1200–2400, profondeur 1000–2000).
