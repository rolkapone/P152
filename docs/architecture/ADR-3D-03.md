# ADR-3D-03 — Modèles paramétrables : génération procédurale pilotée par le catalogue (MVP), glTF « à zones » ensuite

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** 9 types d'objets + bureaux, tous paramétrables (diagonale/ratio/courbure d'écran, formats de clavier, tailles de tapis, hauteur de lampe, dimensions libres du bureau). Budget ≤ 10k triangles par objet. Les assets viennent du technical-artist (TA) via un catalogue, pas en dur dans le code. R4/R7 ajouteront des modèles glTF non paramétriques.

**Décision.**
- **MVP : générateurs procéduraux** par type (`render/generators/<type>.ts`) qui produisent une géométrie (formes simples arrondies : `RoundedBox`, extrusions, lathe) à partir des paramètres. Le **catalogue** (`assets/catalog/object-types/*.json`, maintenu par le TA) décrit pour chaque type : paramètres, défauts, bornes min/max, presets (ex. TKL, 60 %), proportions de style (rayons, épaisseurs de bezel…), **slots matière** nommés, matériaux par défaut, budget triangles, et **règles de placement** (`restsOn`, `canSupport`, `mountable`, `edgeClamp`).
- **Séparation stricte footprint / géométrie** : chaque type a une fonction **pure** `footprint(params) → FootprintPart[]` dans `core/geometry` (rectangles orientés + plage de hauteur, éventuellement plusieurs parties : pied d'écran au sol + dalle en hauteur ; pince seule pour le bras). Les règles utilisent le footprint, jamais le mesh. Un test vérifie que la boîte englobante du mesh généré correspond au footprint (tolérance 1 mm).
- **Une géométrie fusionnée par slot matière** (1 à 3 draw calls par objet) ; géométries mises en cache par clé de paramètres.
- **R4+ : glTF « à zones »** : un modèle importé déclare dans `extras` glTF ses slots matière, son pivot de pose et, s'il est redimensionnable, des zones extensibles (principe 9-slice : seules certaines bandes se déforment, les coins arrondis restent). Sinon il est à dimensions fixes et son footprint est calculé à l'import puis stocké dans le catalogue.

**Conséquences.**
- (+) Dimensions exactes au mm pour n'importe quelle valeur, poids réseau quasi nul au MVP (aucun fichier modèle), cohérent avec H1 (objets génériques simples).
- (+) Le TA ajuste l'aspect (proportions, défauts, matières) en éditant des données, sans toucher au code de rendu.
- (−) Le réalisme reste limité par la génération procédurale ; c'est accepté au MVP (décision PO n°5) et levé en R4 par les glTF.
- (−) Deux chemins de rendu à maintenir à terme (procédural + glTF), unifiés derrière une même interface `ObjectRenderer`.

**Alternatives écartées.**
1. **Un glTF par variante** : explosion combinatoire (diagonales × ratios × courbure × pied), et impossible pour les dimensions libres.
2. **Un glTF unique mis à l'échelle non uniformément** : déforme bezels, coins arrondis et touches ; dimensions visuelles fausses par rapport aux dimensions saisies.
3. **CSG / modélisation paramétrique à l'exécution (ex. OpenCascade WASM)** : plusieurs Mo de WASM, lent sur mobile, disproportionné pour des volumes simples.
