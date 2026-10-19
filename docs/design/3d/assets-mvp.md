# Assets du MVP — bureau + 9 types

> Source de vérité exécutable : `assets/catalog/object-types/*.json` (un fichier par type). Ce document en est la lecture humaine. Dimensions en **mm réels**, scène en mètres (conversion à la frontière `render/`).
> Tous les objets MVP sont **procéduraux** (ADR-3D-03) : aucun fichier modèle, aucune texture, aucune licence tierce. Un Z-up/Y-up n'est pas en jeu (génération en code, Y vers le haut).

## Synthèse

| # | Type (`catalogId`) | Génération | Tris max | Draw calls | Slots matière (rôle) |
|---|---|---|---|---|---|
| 0 | Desk (`desk.rect`) | procédural | 1 500 | 2 | top (top), legs (legs) |
| 1 | Monitor (`monitor.generic`) | procédural | 2 500 | 3 | body, screen, stand (metal) |
| 2 | PC case (`pc-case.generic`) | procédural | 3 000 | 5 | body, panel (accent), glass, led |
| 3 | Keyboard (`keyboard.generic`) | procédural, touches instanciées | 2 500 | 3 | body, keycaps, accent |
| 4 | Mouse (`mouse.generic`) | procédural | 1 200 | 2 | body, accent |
| 5 | Mouse pad / desk mat (`mousepad.generic`) | procédural (extrusion) | 400 | 1 | surface (mat) |
| 6 | Controller stand (`controller-stand.generic`) | procédural | 2 000 | 3 | body, accent, led |
| 7 | Monitor arm (`monitor-arm.generic`) | procédural | 2 500 | 1 | metal |
| 8 | Speakers pair (`speakers.generic`) | procédural | 4 000 | 4 | body, baffle (accent), driver, led |
| 9 | Desk lamp (`lamp.generic`) | procédural | 3 000 | 3 | body, shade, bulb |

Tous sous le plafond ADR-3D-03 de 10 k triangles par objet. Scène de référence (bureau + 20 objets variés) : environ 50 k triangles et 40-60 draw calls (plafond 300 k / 150 desktop, 150 k / 80 mobile). **Les budgets ci-dessus sont des plafonds de conception ; le graphics-engineer les mesure (`renderer.info`) et la QA les vérifie.**

## Détail par type (paramètres et plages)

**0. Desk** — `width` 800-2400 (déf. 1400), `depth` 500-1000 (700), `height` 600-1300 (740), `thickness` 18-40 (25), `legStyle` post | frame. Presets : compact 1000×600, standard 1400×700, large 1800×800. Le bureau d'angle (L) sera une entrée distincte `desk.corner` (paramètres propres) quand sa story arrivera. Footprint : rectangle du plateau.

**1. Monitor** — `diagonalIn` 19-49 (27), `ratio` 16:9 | 16:10 | 21:9 | 32:9, `curveRadius` 0 | 1000 | 1500 | 1800 mm, `stand` stand | vesa | none, `bezel` 3-15 (7), `depth` 15-80 (40), socle 200-320 × 160-260. Presets : 24", 27", 32", 34" ultrawide courbé 1800R, 49" super-ultrawide. Largeur/hauteur déduites de la diagonale et du ratio (27" 16:9 = 598 × 336 mm de dalle). Footprint à 2 parties : socle au plateau (`base`) + dalle en hauteur (`overhang`) ; en mode `vesa`, la dalle seule, montée sur bras.

**2. PC case** — `width` 160-260 (210), `height` 280-600 (450), `depth` 300-560 (420), `glassSide` none | left | right, `frontPanel` solid | mesh, `fans` 0-3. Presets : mini-ITX 190×330×360, micro-ATX 220×400×400, mid-tower 210×450×420, full-tower 240×560×520. Pose sur bureau ou au sol.

**3. Keyboard** — `format` 60 | 65 | 75 | tkl | 96 | full (déf. **full**, cf. UX « clavier 100 % ») ; dimensions du boîtier : 60 % 295×100, 65 % 325×110, 75 % 330×135, TKL 360×140, 96 % 385×135, full 440×140 ; hauteur 18-40 mm (28), inclinaison 0-9° (6). Touches coniques de 12 triangles en un `InstancedMesh`, sans légendes. Zone libre devant à contrôler : 150 mm (alertes).

**4. Mouse** — `length` 95-135 (120), `width` 50-80 (65), `height` 28-48 (38), `shape` symmetric (MVP) | ergonomic (plus tard). Presets compact 100×58×33, standard, large 130×75×42.

**5. Mouse pad / desk mat** — `width` 200-1800 (900), `depth` 200-900 (400), `thickness` 2-6 (4), `corner` 0-30 (8). Presets : S 250×210, M 320×270, L 450×400, desk mat 900×400, XXL 1200×600. Peut supporter clavier, souris et pied d'écran (exceptions de chevauchement, ADR-3D-06).

**6. Controller stand** — `width` 80-200 (110), `depth` 80-180 (100), `height` 100-260 (150), `showController` oui/non (silhouette générique, ni console ni marque).

**7. Monitor arm** — `poleHeight` 250-500 (400), `reach` 300-800 (450), `clampDeskThickness` 15-80 (30), `vesa` 75 | 100, `maxDiagonalIn` indicatif. `edgeClamp: true` : posé sur le bord du plateau, footprint à 3 parties (pince au bord, mât, bras/platine en hauteur). Porte un moniteur `stand: vesa`.

**8. Speakers (paire)** — `width` 90-250 (150), `height` 150-400 (260), `depth` 110-300 (200), `spacing` 400-1600 entre axes (1000), `toeIn` 0-30° (12). Presets mini 100×170×130, bookshelf 150×260×200, large 200×330×260. Un objet, deux parties de footprint.

**9. Desk lamp** — `baseDiameter` 100-220 (160), `height` 300-650 (450), `headDiameter` 80-220 (140), `reach` 0-500 (250), `colorTempK` 2200-6500 (3000), `on` (faux). Footprint : base + tête en surplomb.

## Décor (hors catalogue MVP)
La plante de l'aperçu (pot + 11 feuilles instanciées, 2 draw calls) illustre le style cosy ; ce n'est pas un type du MVP. La déco (étagères, figurines, cadres, plantes) arrive en R4 depuis des bibliothèques CC0 (cf. `licences-assets.md`).

## Assets externes (HDRI, textures)
**Aucun au MVP.** Environnement = `RoomEnvironment` de three.js (procédural). Candidats pour R2/R3, à télécharger seulement après validation, avec relevé de licence dans `licences-assets.md` avant tout commit :
- HDRI studio 1k, `.hdr` ou KTX2 préfiltré (≤ 1k) : Poly Haven (CC0), catégorie « studio ».
- Textures bois/tissu/métal brossé 1k (couleur + normale + rugosité, converties en KTX2) : ambientCG ou Poly Haven (CC0).
- Déco R4 : Kenney, Quaternius, Poly Haven (CC0).
Pipeline : `gltf-transform` (dedup, weld, resize, meshopt, ktx2) + `gltf-validator`, échec CI si budget dépassé.
