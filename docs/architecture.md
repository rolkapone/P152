# Architecture — P152

> Statut : **Accepté** par le PO le 2026-10-19 (tous les ADR-3D, ADR-APP et ADR-OPS ci-dessous). Dépôt public, GitHub + Cloudflare Pages, pas de domaine perso, écran minimal 1366×768.
> Ce document est partagé : la section **Scène 3D** est tenue par le graphics-engineer, la section **Application** par le developer, la section **Build / CI / déploiement** par le devops.

## Sommaire
1. Vue d'ensemble et découpage en couches
2. Scène 3D (ADR-3D-01 à ADR-3D-10)
3. Application (ADR-APP-01 à ADR-APP-10)
4. Build, CI et hébergement (ADR-OPS-01 à ADR-OPS-07)

---

## 1. Vue d'ensemble et découpage en couches

Principe directeur : **la donnée du setup est la source de vérité ; la scène 3D n'est qu'une projection de cette donnée.** Aucune règle métier ne dépend du rendu.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ui/        Panneaux 2D, i18n, design system          (developer)     │
├──────────────────────────────────────────────────────────────────────┤
│ state/     Store du setup, commandes, undo/redo,     (developer,     │
│            persistance locale, import/export          avec GE)       │
├──────────────────────────────────────────────────────────────────────┤
│ render/    Scène three.js / R3F : bureau, objets,    (graphics-      │
│            caméra, picking, drag, surbrillances,      engineer)      │
│            matériaux, éclairage, qualité, XR                         │
├──────────────────────────────────────────────────────────────────────┤
│ core/      TypeScript PUR (aucun import three/React/DOM) :           │
│   schema/    schéma du setup + migrations                            │
│   catalog/   chargement/validation du catalogue (données TA)         │
│   geometry/  footprints, OBB, polygones, unités mm                   │
│   fit/       moteur de règles "ça rentre ?"                          │
│   snap/      magnétisme (grille, bords, objets)                      │
└──────────────────────────────────────────────────────────────────────┘
assets/catalog/   données du technical-artist : types d'objets, bureaux,
                  matériaux, presets de style, éclairages (JSON validé)
assets/models/    GLB optimisés (R4+), assets/textures/ KTX2, assets/env/ HDRI
```

Règles de dépendance (à faire respecter par lint, ex. `eslint-plugin-boundaries` ou `dependency-cruiser`) :
- `core/` n'importe rien d'autre que lui-même (testable en Node, sans navigateur ni GPU).
- `render/` lit `core/` et `state/` ; il n'écrit dans `state/` que via des **commandes** (move, rotate, select…).
- `ui/` ne touche jamais aux objets three.js.

### Repère et unités (convention commune)
- **Données (setup, catalogue)** : millimètres, entiers ou décimaux, angles en degrés.
- **Scène** : mètres (1 unité = 1 m). Conversion **uniquement** à la frontière `render/` (`mmToM`), jamais dans `core/`.
- Repère monde : Y vers le haut, **Y = 0 au sol**, bureau centré en X/Z sur l'origine, bord côté utilisateur vers **+Z**, X vers la droite de l'utilisateur. (Origine au sol = placement AR direct, cf. ADR-3D-09.)
- Position d'un objet dans le setup : `x`, `z` en mm **dans le repère du plateau** (origine au centre du plateau), `rotationY` en degrés ; la hauteur est déduite (posé sur le plateau ou sur un support), sauf objets montés (`mount`).

---

## 2. Scène 3D

### ADR-3D-01 — Moteur 3D : three.js via React Three Fiber (+ drei)

**Contexte.** App web 3D grand public, desktop puis mobile, rendu PBR/ombres/bloom/LED à terme, WebXR en R8, équipe qui apprend. Budget ≥ 60 FPS desktop milieu de gamme, ≥ 30 FPS smartphone récent. L'interface 2D est riche (panneaux, formulaires, accessibilité AA) et sera faite dans un framework UI.

**Décision.**
- **three.js** comme moteur de rendu (renderer **WebGL2** au MVP).
- **React Three Fiber (R3F)** pour décrire la scène de façon déclarative à partir de l'état, **drei** pour les briques éprouvées (CameraControls, Outlines, Environment, Bvh, PerformanceMonitor…), **pmndrs/postprocessing** pour le post-traitement (R3).
- **Préférence transmise au developer** (l'ADR applicatif lui revient) : React + TypeScript strict + Vite ; état dans **Zustand** (store hors arbre React, lisible/écrivable depuis la boucle de rendu sans re-render : indispensable pour le glisser à 60 FPS). Si le developer retient un autre framework UI, la décision three.js tient toujours ; seule la couche R3F serait remplacée par du three.js impératif.
- **WebGPU** : non activé au MVP. Le `WebGPURenderer` de three.js (avec repli WebGL2) sera réévalué par un spike en début de R3 (éclairage/LED), une fois la compatibilité de l'écosystème post-traitement confirmée.

**Conséquences.**
- (+) Plus grand écosystème web 3D (exemples, loaders glTF/KTX2/meshopt, WebXR intégré, USDZExporter), bundle modulaire (~150-200 Ko gz pour three + R3F + drei utilisés).
- (+) Scène = fonction de l'état : le chargement d'un setup, l'undo et les styles en un clic se réduisent à « changer la donnée ».
- (−) R3F impose React : couplage avec le choix UI (atténué par la préférence ci-dessus). Discipline requise : pas de `setState` React par frame, mutations transitoires via refs/`useFrame`.
- (−) three.js ne fournit ni éditeur ni physique : gizmos, contraintes et règles sont à notre charge (c'est voulu, cf. ADR-3D-06/07).

**Alternatives écartées.**
1. **Babylon.js** : moteur très complet (inspecteur, GUI, WebXR, physique), mais bundle nettement plus lourd pour notre usage, API impérative moins naturelle pour une scène pilotée par l'état, intégration React moins mature ; ses points forts (GUI 3D, physique) ne servent pas notre cas.
2. **PlayCanvas** : excellent en perf mobile, mais workflow centré sur son éditeur en ligne (projet hébergé chez le fournisseur) et intégration avec une UI React riche moins directe ; mauvais fit pour une équipe qui versionne tout dans Git.
3. **Unity / Godot export Web** : payload initial de plusieurs Mo, démarrage lent sur mobile, accessibilité et intégration HTML de l'UI 2D pauvres, débogage web difficile.
4. **WebGL/WebGPU brut** : contrôle total mais réinvente loaders, matériaux PBR, ombres, XR : incompatible avec le rythme du MVP.

---

### ADR-3D-02 — Modèle de données du setup : JSON versionné, en mm, séparé du rendu

**Contexte.** Le setup doit être sauvegardé localement, exporté/importé (fichier = surface d'attaque), migré entre versions, et porter dès maintenant les besoins futurs : matériaux par slot (R2), style/éclairage (R3), objets montés et déco (R3/R4), produit réel (R5), partage (R6), modèles importés (R7).

**Décision.** Un document JSON `Setup` validé par schéma (préférence : **Zod** côté `core/schema`, d'où l'on dérive types TS et JSON Schema publiable), indépendant de three.js :

```jsonc
{
  "format": "p152.setup",
  "schemaVersion": 1,            // entier, incrémenté à chaque changement cassant
  "id": "uuid", "name": "My setup",
  "createdAt": "ISO", "updatedAt": "ISO",
  "units": "mm",
  "desk": {
    "catalogId": "desk.rect", "catalogVersion": 1,
    "params": { "width": 1400, "depth": 700, "height": 740 },  // L-shape : params dédiés
    "materials": {}             // surcharges par slot (top, legs), ajout US-003 (ADR-APP-10)
  },
  "objects": [{
    "id": "uuid", "type": "monitor", "catalogId": "monitor.generic", "catalogVersion": 1,
    "params": { "diagonalIn": 27, "ratio": "16:9", "stand": true, "curved": false },
    "transform": { "x": 0, "z": -150, "rotationY": 0 },          // mm / degrés, repère plateau
    "mount": null,              // ex. { "parentId": "<arm-id>", "socket": "vesa" } (écran sur bras)
    "materials": {},            // R2 : { "<slot>": "<materialId>" } ; vide = défaut du type
    "product": null,            // R5 : référence produit réel
    "label": null               // nom personnalisé optionnel
  }],
  "environment": { "stylePreset": null, "lighting": "neutral", "room": null },  // R2/R3
  "alertSettings": { "occupancyMax": 0.7, "depthMarginMm": 100, "keyboardClearanceMm": 150 },
  "extensions": {}              // espace réservé, ignoré si inconnu
}
```

- **Migrations** : chaîne de fonctions pures `migrate_v1_to_v2`, … appliquées à la lecture (localStorage et import). Donnée invalide après migration → rejet avec message, jamais de plantage (US-018).
- **Import sécurisé** : taille max du fichier (ex. 1 Mo), nombre max d'objets (50), bornes numériques du catalogue réappliquées, chaînes bornées, aucun champ interprété comme code/URL au MVP.
- Le setup ne contient **aucune géométrie ni matériau three.js** : uniquement des références au catalogue + paramètres. Le rendu se reconstruit toujours depuis cette donnée.

**Conséquences.**
- (+) Sauvegarde, export, partage (R6), undo/redo (snapshots ou patches de la même donnée) et tests utilisent un seul format, lisible et diffable.
- (+) Les règles « ça rentre ? » consomment la même donnée, sans scène.
- (−) Toute évolution du schéma exige une migration + tests de non-régression (fixtures de chaque version conservées dans `tests/fixtures/setups/`).
- (−) `catalogVersion` oblige à garder les anciennes définitions de catalogue (ou une migration) quand le TA change un type.

**Alternatives écartées.**
1. **Sauvegarder la scène three.js (`Object3D.toJSON`) ou un glTF de la scène** : mélange rendu et métier, lourd (géométries embarquées), non versionnable sémantiquement, impossible à migrer proprement ; un import pourrait injecter des géométries arbitraires.
2. **Format binaire (Protobuf/FlatBuffers/CBOR)** : gain de taille inutile à 50 objets, illisible pour le debug et l'utilisateur avancé, outillage supplémentaire. Réévaluable pour les liens de partage (R6) via compression du JSON.
3. **Positions en mètres dans les données** : flottants peu lisibles (0.7400000001), contraire à la convention catalogue en mm et aux libellés UI en mm.

---

### ADR-3D-03 — Modèles paramétrables : génération procédurale pilotée par le catalogue (MVP), glTF « à zones » ensuite

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

---

### ADR-3D-04 — Format d'assets : glTF 2.0 (GLB) + meshopt, textures KTX2, pipeline gltf-transform

**Contexte.** Les assets 3D externes arrivent en R2 (textures de matières), R3 (HDRI), R4 (bibliothèque de modèles libres) et R7 (objets importés). Contraintes : mobile (mémoire GPU, téléchargement), Git LFS au-delà de 1 Mo, licences consignées.

**Décision.**
- **Modèles** : **glTF 2.0 binaire (.glb)** uniquement à l'exécution. Compression géométrie **meshopt** (`EXT_meshopt_compression` + quantization) par défaut ; **Draco** toléré en entrée mais recompressé.
- **Textures** : **KTX2 / Basis Universal** — UASTC pour normal maps et ORM, ETC1S pour baseColor ; tailles max 1024 px (mobile) / 2048 px (desktop, palier qualité haut), mipmaps générées.
- **Environnement** : HDRI ≤ 1k en `.hdr` (ou KTX2 préfiltré) pour l'éclairage ; MVP sans fichier (environnement procédural `RoomEnvironment`).
- **Pipeline** (outil du TA, exécuté en script et en CI) : `gltf-transform` (dedup, weld, simplify, resize, meshopt, ktx2) + `gltf-validator` ; échec CI si budget dépassé (triangles, poids, taille de texture) ou licence absente de `docs/design/3d/licences-assets.md`.
- Chargement : `GLTFLoader` + `MeshoptDecoder` + `KTX2Loader` (transcodeur Basis servi localement, pas de CDN tiers), chargement **progressif** (placeholder boîte au footprint, puis modèle).

**Conséquences.**
- (+) Format standard ouvert, PBR natif, extensible (`extras`, `KHR_materials_emissive_strength` pour les LED, `KHR_materials_variants` utilisable pour les styles).
- (+) meshopt : décodeur plus petit et décodage plus rapide que Draco, compatible quantization et animations.
- (−) Le transcodeur Basis (~200 Ko WASM) n'est chargé qu'à la première texture KTX2 (lazy) ; non nécessaire au MVP.

**Alternatives écartées.**
1. **FBX / OBJ** : pas de PBR standardisé (OBJ), format propriétaire et loaders lourds (FBX), pas de compression adaptée au web.
2. **Draco seul** : bonne compression mais décodeur plus lourd et plus lent, ne couvre pas les attributs d'animation/instancing aussi bien que meshopt.
3. **PNG/JPEG/WebP pour les textures** : décompressées en RGBA dans la mémoire GPU (4 à 8 fois plus que KTX2), rédhibitoire sur mobile dès R3/R4.
4. **USDZ** comme format source : écosystème Apple ; gardé uniquement comme **export** pour AR Quick Look (ADR-3D-09).

---

### ADR-3D-05 — Matériaux et styles : bibliothèque de matériaux en données, slots par objet, presets déclaratifs

**Contexte.** R2 : couleur/matière par objet et styles en un clic (all white, all black, coloré, cosy). R3 : LED/RGB, jour/soir. Le MVP n'expose pas de matériaux à l'utilisateur, mais l'architecture doit les permettre sans refonte.

**Décision.**
- **Bibliothèque de matériaux** (`assets/catalog/materials/*.json`, TA) : `id`, nom i18n, modèle PBR (`baseColor`, `metalness`, `roughness`, `normal/orm` en KTX2 optionnels, `emissive` + intensité, `clearcoat`, `transmission`), tags (`wood`, `metal`, `matte`…).
- **Slots matière** par type d'objet (déclarés dans le catalogue, ADR-3D-03), avec un **rôle** (`body`, `accent`, `screen`, `legs`, `top`, `led`…). Le setup ne stocke que les surcharges `materials[slot] = materialId`.
- **Résolution en cascade** (fonction pure dans `core/`) : surcharge de l'objet > preset de style actif > défaut du type. Un **preset de style** est une donnée : règles `rôle → materialId` (éventuellement par type), + preset d'éclairage/ambiance (R3). Appliquer un style = écrire `environment.stylePreset` (une seule commande annulable).
- **Cache de matériaux** côté rendu : une instance `MeshStandardMaterial`/`MeshPhysicalMaterial` partagée par `materialId` (moins de programmes shader et de draw state), libérée par comptage de références.
- **Éclairage en données aussi** : presets `lighting` (neutral, day, evening) décrivant environnement, lumières, exposition, tone mapping (AgX/Neutral) ; LED = matériaux émissifs + bloom sélectif (R3).
- MVP : les matériaux neutres par défaut passent déjà par ce système (aucune couleur en dur dans les composants).

**Conséquences.**
- (+) Styles en un clic, jour/soir et matériaux par objet deviennent des ajouts de données + UI, sans toucher aux générateurs.
- (+) Les fichiers de setup restent petits et stables (références, pas de valeurs).
- (−) Les `materialId` deviennent une API publique : un renommage exige une migration (même règle que le catalogue).

**Alternatives écartées.**
1. **Matériaux codés dans les composants de rendu** : chaque style/couleur demande du code, contredit la règle « assets du TA via le catalogue ».
2. **Couleur libre seule par objet (pas de bibliothèque)** : ne gère ni bois/métal/tissu ni presets cohérents ; « all white » devrait parcourir chaque objet à la main.
3. **MaterialX / NodeMaterial (TSL) comme format de stockage** : puissant mais trop lourd et instable pour des données utilisateur versionnées ; TSL reste une option d'implémentation interne si on passe à WebGPU.

---

### ADR-3D-06 — Moteur de règles « ça rentre ? » : fonctions pures 2,5D dans `core/fit`

**Contexte.** US-014/015/016/017 : débordement (avec rotation, bureau d'angle), chevauchements avec exceptions (clavier/souris sur tapis, écran sur bras/pied au-dessus d'un tapis), occupation > 70 %, zone libre devant le clavier, profondeur utile, confort selon la diagonale. Recalcul < 100 ms à 20 objets, ≥ 15 tests, 100 % des cas de test détectés, messages actionnables en anglais (i18n).

**Décision.**
- Module **pur** `core/fit` : `evaluate(setup, catalog, settings) → Alert[]`, sans three.js ni DOM (règle de lint), déterministe, testé avec **Vitest** en Node.
- Modèle géométrique **2,5D** : chaque objet = liste de `FootprintPart` (rectangle orienté en mm dans le repère plateau + intervalle de hauteur `[yMin, yMax]` + rôle : `base`, `overhang`, `clamp`). Plateau = polygone (rectangle ou L pour le bureau d'angle).
- Primitives (`core/geometry`) : OBB via **SAT** (profondeur de pénétration exacte, rotation quelconque), clipping polygone pour débordement (côté + valeur en mm) et surface d'occupation (union des empreintes au plateau), tolérance numérique 0,5 mm.
- **Règles déclaratives** (une fonction par règle, registre) : `overflow`, `overlap`, `occupancy`, `keyboardClearance`, `deskDepth`, `viewingDistance`. Les exceptions viennent du **catalogue** (`restsOn: ["mousepad"]`, `canSupport`, `edgeClamp: true` pour le bras) et des intervalles de hauteur (écran sur pied au-dessus du tapis = pas de chevauchement en 3D), pas de cas particuliers codés par nom d'objet.
- Sortie : `Alert { code, severity: error|warning|info, objectIds[], values {mm, %, side}, messageKey, fixKey }` ; le texte est produit par l'i18n de l'UI. Verdict global = fonction pure séparée (règle PO sur les warnings paramétrable).
- Seuils dans `alertSettings` (setup) avec défauts en configuration (H5).
- Perf : O(n²) sur 50 objets = 1 225 paires SAT, < 1 ms ; exécuté sur le thread principal après chaque commande (débouncé pendant le drag : une évaluation par frame max). Web Worker possible plus tard sans changer l'API.

**Conséquences.**
- (+) Testable à 100 % hors navigateur, cas limites (rotation 45°, pile au bord, bras sur le bord) écrits comme fixtures JSON réutilisables par la QA.
- (+) Les mêmes primitives servent au magnétisme (ADR-3D-07) et au placement « position libre » à l'ajout (US-010).
- (−) Approximation volumique par boîtes orientées : un objet aux formes complexes (lampe à bras, R4) doit fournir plusieurs parts de footprint ; c'est au TA de les déclarer dans le catalogue.

**Alternatives écartées.**
1. **Moteur physique (Rapier, cannon-es, Ammo)** : conçu pour la simulation dynamique, non déterministe à l'échelle qui nous intéresse, ne fournit pas « de combien de mm, de quel côté », ajoute ~400 Ko+ de WASM et dépend d'une scène.
2. **`Box3` three.js calculées sur les meshes** : AABB alignées sur les axes (fausses dès qu'on pivote), couplées au rendu (non testables sans scène), dépendantes de la géométrie décorative.
3. **Collisions maillage-maillage (three-mesh-bvh)** : précision inutile pour « ça rentre ? », coûteuses, liées au rendu ; BVH réservé au picking si besoin.

---

### ADR-3D-07 — Interactions : pointer events, picking par proxys, drag sur plan, caméra contrainte, commandes

**Contexte.** Zéro jargon 3D, clic gauche objet = sélectionner/glisser, clic gauche vide = tourner la vue, clic droit = déplacer la vue, molette = zoom, caméra verrouillée pendant le drag, cotes visibles, magnétisme (grille 10 mm, bords, Maj = libre), rotation par pas de 15° + poignée, clavier complet (accessibilité), un drag = une action d'undo, tactile plus tard (US-021).

**Décision.**
- **Pointer Events** uniquement (souris, tactile, stylet unifiés) ; système d'événements R3F, raycast restreint à un **layer « selectable »** contenant des **proxys de picking** (boîte invisible = footprint étendu) plutôt que les meshes détaillés : coût constant, cibles plus faciles à attraper (≥ 24 px à l'écran visés via marge).
- **Drag** : intersection du rayon avec le **plan horizontal du support** (plateau ou objet support), décalage de prise conservé, `pointer capture`. Pendant le drag, la position est mise à jour de façon **transitoire** (store hors React) et les cotes jusqu'aux bords sont calculées par `core/geometry` ; au `pointerup`, **une commande `moveObject`** est poussée dans l'historique (US-019).
- **Magnétisme** : fonction pure `core/snap` (grille 10 mm, bords du plateau, alignement sur bords/centres des autres objets, seuil en pixels écran converti en mm), désactivée tant que Maj est enfoncé.
- **Rotation** : anneau-poignée maison au sol autour de l'objet sélectionné (pas de gizmo à axes), crans de 15° par défaut, libre avec Maj ; boutons et touches R / Maj+R émettent la même commande.
- **Caméra** : `CameraControls` (drei / yomotsu camera-controls) configurés : angle polaire limité (jamais sous le plateau), distance min/max, pan borné au volume du bureau, transitions douces (désactivées si `prefers-reduced-motion`), vues **Reset / Top / Front** et « recadrer sur l'objet » (sélection depuis liste/alerte). Désactivés pendant un drag d'objet.
- **Surbrillance** : survol = contour fin, sélection = contour épais (`Outlines` en coque inversée, pas de passe de post-traitement) ; objet en alerte = **motif hachuré projeté sur son empreinte au plateau** + couleur de gravité + icône en surimpression HTML (pas la couleur seule).
- **Clavier / lecteurs d'écran** : la scène ne gère pas le focus elle-même ; l'UI (developer) fournit la liste accessible des objets et les raccourcis, qui appellent **les mêmes commandes** que la souris.

**Conséquences.**
- (+) Une seule voie de modification (commandes) pour souris, clavier, champs de propriétés, alertes et undo/redo.
- (+) Tactile (US-021) = réglage des gestes, sans changer l'architecture.
- (−) Gizmo de rotation, cotes et hachures sont du code maison à maintenir (simple, mais à tester en E2E).

**Alternatives écartées.**
1. **`TransformControls` de three.js** : gizmo à 3 axes typé éditeur 3D, jargon visuel contraire au principe UX n°1, permet de sortir du plan.
2. **`OrbitControls`** : pas de transitions animées ni de bornes de pan / recadrage aussi complets que camera-controls ; il faudrait les réécrire.
3. **Drag via moteur physique (contraintes/joints)** : latence, oscillations, non déterministe ; contraire au « ça suit le curseur ».
4. **Picking GPU (rendu d'IDs en couleur)** : utile à des milliers d'objets ; à 50 objets le raycast sur proxys est plus simple et suffisant.

---

### ADR-3D-08 — Performance : rendu à la demande, budgets chiffrés, paliers de qualité

**Contexte.** ≥ 60 FPS desktop milieu de gamme, ≥ 30 FPS smartphone récent, 20 objets en déplacement à 60 FPS (US-012), autonomie mobile, montée en charge visuelle en R3/R4 (ombres douces, bloom, déco).

**Décision.**
- **`frameloop="demand"`** : on ne rend que lorsque la donnée, la caméra ou une animation change (scène statique = 0 % GPU). Passage en boucle continue uniquement quand une animation active l'exige (LED animées R3, transitions).
- **Budgets** (scène de référence : bureau + 20 objets ; vérifiés via `renderer.info` exposé en dev/E2E sous `window.__p152perf`) :

| Indicateur | Desktop (palier high) | Mobile (palier low) |
|---|---|---|
| Draw calls | ≤ 150 | ≤ 80 |
| Triangles | ≤ 300 k | ≤ 150 k |
| Mémoire textures GPU | ≤ 128 Mo | ≤ 64 Mo |
| Payload 3D initial (MVP) | ≤ 300 Ko gz (JS 3D compris, hors app) | idem |
| Temps de frame pendant un drag | ≤ 16 ms | ≤ 33 ms |
| Recalcul des alertes (20 objets) | < 100 ms (cible < 5 ms) | < 100 ms |

- **Draw calls** : une géométrie fusionnée par slot matière et par objet (ADR-3D-03), matériaux partagés (ADR-3D-05) ; **`InstancedMesh`** pour les éléments répétés (pieds de bureau, objets dupliqués identiques, déco en série R4) ; **LOD** pour les glTF détaillés (R4).
- **Ombres** : MVP = une lumière directionnelle, shadow map 2048 (desktop) / 1024 (mobile) dont le frustum est ajusté au bureau, `shadowMap.autoUpdate = false` (recalcul seulement quand un objet bouge) ; PCF soft. R3 : ombres de contact / accumulées pour l'ambiance réaliste, selon le palier.
- **Paliers de qualité** (low / medium / high) choisis au démarrage (détection GPU + type d'appareil) puis ajustés à la volée par **`PerformanceMonitor`** (drei) : DPR plafonné (2 desktop, 1,5 mobile, adaptatif), ombres, antialiasing (MSAA natif → SMAA en post si post-traitement), post-traitement R3 (bloom, tone mapping) désactivable. Un réglage « Quality » pourra être exposé en R3.
- **Mémoire** : cache de géométries/matériaux/textures à comptage de références avec `dispose()` systématique à la suppression ou au changement de paramètre ; test de non-fuite (`renderer.info.memory` stable après 100 ajouts/suppressions).
- **Mesure** : `r3f-perf`/stats en dev ; la QA mesure FPS + draw calls + poids chargé sur la scène de 20 objets en CI (US-022), chiffres reportés à chaque story `[3D]`.

**Conséquences.**
- (+) Les budgets sont vérifiables automatiquement et opposables en revue.
- (+) Le MVP procédural est très en dessous des budgets, ce qui laisse de la marge pour R3/R4.
- (−) Le rendu à la demande impose d'invalider explicitement (`invalidate()`) à chaque changement non piloté par l'état (chargements asynchrones, transitions) : point de vigilance en revue.

**Alternatives écartées.**
1. **Boucle de rendu continue (60 Hz permanents)** : simple mais vide la batterie et chauffe le mobile pour une scène majoritairement statique.
2. **Éclairage entièrement précalculé (lightmaps)** : excellent rendu, mais incompatible avec des objets déplaçables et paramétrables et avec le jour/soir.
3. **Ombres temps réel pour plusieurs lumières (point lights)** : coût multiplié (6 passes par point light), hors budget mobile ; réservé à des cas ciblés en palier high.

---

### ADR-3D-09 — Chemin vers WebXR (AR mobile, R8)

**Contexte.** R8 : afficher le setup en réalité augmentée à l'échelle réelle sur mobile. Aucun travail au MVP, mais aucune décision d'aujourd'hui ne doit l'empêcher. Support WebXR AR inégal : bon sur Android (Chrome / ARCore), absent ou limité sur iOS Safari.

**Décision.**
- Dès le MVP : **unités en mètres, origine au sol** (Y = 0), bureau centré sur l'origine, tout le setup sous un nœud racine `SetupRoot` : en AR, placer le setup revient à appliquer **une seule transformation** issue du hit-test.
- Rendu via le `WebXRManager` de three.js et **@react-three/xr** (session `immersive-ar`, `hit-test`, `dom-overlay` pour une UI minimale) ; mêmes composants de scène que la vue 3D, paliers de qualité forcés à « low ».
- **Repli iOS** : export du setup courant en **USDZ** (`USDZExporter` de three.js) ouvert dans AR Quick Look (lecture seule).
- Pas de dépendance du code applicatif à la souris : tout passe par pointer events et commandes (ADR-3D-07), réutilisables pour la sélection en XR.
- Spike US-160 en début de R8 pour confirmer l'état du support navigateurs à cette date.

**Conséquences.**
- (+) Aucun coût au MVP ; AR = nouvelle « vue » sur la même donnée et les mêmes composants.
- (−) Deux expériences AR (WebXR Android, Quick Look iOS) à tester ; l'édition en AR sur iOS ne sera pas possible sans WebXR.

**Alternatives écartées.**
1. **`<model-viewer>` (Google)** : AR simple multiplateforme mais viewer séparé : il faudrait exporter un glTF de la scène et on perd l'interaction et la cohérence de rendu.
2. **SDK AR commercial (WebAR propriétaire)** : licence, dépendance fournisseur et SDK lourd, contraires au caractère sans backend et open du projet.
3. **Application native (ARKit/ARCore)** : meilleure qualité AR mais second code base, hors objectif « app web ».

---

### ADR-3D-10 — Scène de base (US-004) : studio validé champ par champ, vue contrainte en fonctions pures, état de la vue dans `state/`

> Statut : **Proposé** (2026-10-20, US-004, graphics-engineer). Précise ADR-3D-01/03/07/08 et ADR-APP-02/07/10.

**Contexte.** US-004 livre la première scène : studio, bureau 140×70 généré depuis le catalogue, caméra contrainte, vues Reset / Top / Front, clavier. La revue US-003 exige que les générateurs ne lisent que des champs validés (`StudioSceneSchema` est un `looseObject`). Le developer branche ensuite la barre de vue, l'astuce et les écrans d'erreur sans toucher à three.js.

**Décision.**
- **Studio validé puis projeté** : `StudioSceneSchema` valide désormais chaque valeur lue par le rendu (fonds clair/sombre, cyclo, lumières, environnement, ombres, caméra, limites, transition) avec des bornes (`limits.ts`) et des contrôles d'ordre (`min < max`, code `bounds`). Le rendu ne reçoit que `toStudioConfig(studio)` (`core/catalog/studio.ts`), copie champ par champ et gelée : un champ non validé ne peut pas l'atteindre. Un test injecte une clé inconnue dans chaque objet et remplace chaque feuille par une valeur absurde : soit le catalogue est rejeté, soit la projection est identique ; la liste des champs descriptifs non lus est figée dans le test.
- **Chargement** : `render/Viewport.tsx` (chunk principal, sans three.js) vérifie WebGL 2 puis charge `scene/SceneCanvas.tsx` en `lazy()` (three + R3F + camera-controls dans un chunk séparé). `frameloop="demand"`, `NeutralToneMapping`, ombres VSM `autoUpdate=false` (recalcul seulement quand la scène change), palier de qualité au démarrage (`shadow.defaults` : desktop `high`, mobile `medium`, DPR plafonné par palier).
- **Vue contrainte** : `camera-controls` 3.1.2 (même version que celle embarquée par drei, MIT) piloté par une classe `ViewRig` (`render/scene/viewRig.ts`) ; toutes les règles sont des **fonctions pures** de `render/math/camera.ts`, testées en Node (fast-check) : distance 0,8–4,5 m, angles du catalogue, caméra jamais sous `minCameraY` (0,9 m : l'inclinaison maximale baisse quand on zoome) ni dans le bureau gonflé de 100 mm, cible bornée à l'intersection de la boîte de déplacement du catalogue et du bureau (la cible, au centre de l'écran, est un point du bureau : le déplacement ne sort jamais le bureau du cadre). Les maths en mètres restent dans `render/math/` (pures, sans three.js) et non dans `core/` : la conversion mm → m n'a lieu qu'à la frontière du rendu (section 1).
- **Cadrage** : chaque vue part de la pose du catalogue et recule si besoin pour que tout le bureau tienne dans la zone libre (marge 5 %, 10 % de hauteur réservés en bas pour la barre de vue). La cible est dessinée au-dessus du centre de l'écran par un décalage d'objectif (`setViewOffset`) qui suit l'inclinaison (0,1 vu de dessus, 0,3 de côté) : le bureau, qui pend sous la cible, est centré au-dessus de la barre sans changer l'orbite.
- **Transitions** : Reset / Top / Front glissent sur un arc (interpolation sphérique, sans repli d'azimut) en 480 ms, courbe `cubic-bezier(0.65, 0, 0.35, 1)` (`--ease-in-out`), interrompues par tout geste ou touche ; saut direct et sans inertie sous `prefers-reduced-motion`.
- **État de la vue dans `state/`** (`state/view/`, store Zustand de session) : statut (`loading`, `ready`, `unsupported`, `failed`, `contextLost`), vue active (`top` / `front` / aucune), dernier événement pour les annonces, `retry()`, taille du bureau. Le rendu enregistre un `ViewController` ; l'UI appelle `showView()` / `runViewCommand()` et ne voit jamais three.js. La correspondance touches → commandes (`viewCommandForKey`) est pure et testée.
- **Mesure** : `window.__p152perf` (draw calls et triangles du pire frame, `measure(ms)` pour les FPS en rendu continu, mémoire GPU) n'existe que dans le build E2E (import dynamique éliminé du bundle de production, vérifié par `check:bundle`).

**Conséquences.**
- (+) Les limites de la vue, le cadrage et les pas du clavier sont prouvés par des tests unitaires, indépendamment du GPU ; l'E2E ne vérifie que l'intégration.
- (+) Les stories suivantes (objets, sélection, tactile) réutilisent `ViewRig`, `cameraLimits(config, contenu)` et le store sans refonte.
- (−) R3F importe tout three.js : chunk 3D ≈ 266 Ko gz (budget ADR-3D-08 : 300 Ko). À surveiller quand drei / postprocessing arriveront.
- (−) Le décalage d'objectif fait pivoter la vue autour d'un point situé au-dessus du centre de l'écran ; c'est voulu (le bureau reste au centre de la zone libre).

**Alternatives écartées.**
1. **`<CameraControls>` de drei** : même moteur, mais les transitions de camera-controls sont des ressorts (`smoothTime`), pas une durée fixe de 480 ms avec une courbe donnée ; le contrôle direct de l'instance simplifie aussi les tests.
2. **Valider le studio en `strictObject`** : refuserait les notes du technical-artist ; la projection explicite donne la même garantie sans contraindre le format.
3. **Abaisser la cible des vues** pour centrer le bureau vide : contraire à la fiche du technical-artist (cible (0 ; 0,72 ; 0), pensée pour un bureau garni) ; le décalage d'objectif obtient le même cadrage.

---

### Récapitulatif des choix 3D

| Sujet | Choix | Écarté |
|---|---|---|
| Moteur | three.js + R3F + drei, WebGL2 (WebGPU spike R3) | Babylon.js, PlayCanvas, Unity/Godot Web, WebGL brut |
| Données du setup | JSON `schemaVersion` + migrations, mm, Zod, séparé du rendu | Scène three.js/glTF sérialisée, binaire, mètres |
| Modèles | Procédural piloté par catalogue (MVP), glTF à zones (R4+) | glTF par variante, scale non uniforme, CSG runtime |
| Assets | GLB + meshopt, KTX2 (Basis), gltf-transform en CI | FBX/OBJ, Draco seul, PNG/JPEG GPU |
| Matériaux | Bibliothèque en données, slots à rôles, presets déclaratifs | Matériaux en dur, couleur libre seule, MaterialX |
| Règles | `core/fit` pur 2,5D (OBB/SAT, polygones), Vitest | Physique, Box3 sur meshes, collisions mesh BVH |
| Interactions | Pointer events, proxys, drag sur plan, camera-controls, commandes | TransformControls, OrbitControls, drag physique, picking GPU |
| Perf | Rendu à la demande, budgets chiffrés, paliers adaptatifs | Boucle continue, lightmaps, ombres multi-lumières |
| XR | Origine au sol, @react-three/xr, repli USDZ | model-viewer, SDK commercial, natif |
| Scène de base (US-004) | Studio validé puis projeté, camera-controls + maths pures, état de vue dans `state/` | drei `<CameraControls>`, studio strict, cible abaissée |

### Points à trancher avec le developer (ADR applicatifs)
- Framework UI et outil de build (préférence 3D : React + Vite + TypeScript strict).
- Store et historique (préférence 3D : Zustand ; commandes sérialisables pour l'undo, un drag = une commande).
- Bibliothèque de validation de schéma (préférence 3D : Zod, partagée par `core/schema`, l'import JSON et les tests).
- i18n (les `messageKey` des alertes sont produits par `core/fit`, traduits par l'UI).
- Contrat d'exposition des mesures de perf pour la QA (`window.__p152perf` en build de test uniquement).

---

## 3. Application

> Rédigé par le developer (kickoff, 2026-10-19), en cohérence avec la section 1 et les ADR-3D. Aucune ligne de code n'existe encore : les noms de fichiers sont des cibles, pas un existant.

Contraintes d'entrée : UI en anglais avec i18n prête pour une 2e langue, pas de compte ni backend au MVP, sauvegarde locale + export/import JSON, desktop d'abord, WCAG 2.2 AA, un seul écran « Studio » (panneaux + modales), vision long terme jusqu'à R8.

### ADR-APP-01 — Framework UI et build : React + TypeScript strict + Vite (SPA statique)

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

---

### ADR-APP-02 — État : Zustand en trois stores, commandes pures, historique par snapshots immuables

**Contexte.** Une seule voie de modification pour souris, clavier, champs, alertes, import et undo (ADR-3D-07). US-019 : 50 actions minimum, un drag = une action, boutons désactivés selon l'état. Le drag doit tourner à 60 FPS sans re-render React. Les actions doivent être annoncées aux lecteurs d'écran.

**Décision.**
- **Zustand** (store hors arbre React, abonnements par sélecteur), découpé en **trois stores** :
  - `documentStore` : le `Setup` courant (immuable, ADR-3D-02) + l'historique. **Seule source de vérité persistée.**
  - `sessionStore` : sélection, survol, onglet actif, panneaux repliés, modale ouverte, magnétisme on/off. Jamais dans l'historique ni dans l'export (la sélection n'est pas une donnée du setup).
  - `transientStore` : pose temporaire pendant un drag/rotation (lue par `render/` dans `useFrame`, sans re-render React).
- **Commandes** : objets sérialisables `{ type, payload }` (`addObject`, `moveObject`, `rotateObject`, `setObjectParams`, `setDesk`, `duplicateObject`, `removeObject`, `replaceSetup`, `setAlertSettings`, puis `applyStylePreset` en R2…). Chaque type a un **reducer pur** dans `core/commands` : `(setup, payload, catalog) → Result<Setup, CommandError>` (validation des bornes et du max de 50 objets **dans** le reducer, pas dans l'UI). Un `dispatch(command)` unique dans `state/` applique, empile et notifie.
- **Historique** : pile de **snapshots immuables** (`past[]`, `future[]`) ; grâce au partage structurel, un snapshot coûte une référence + les nœuds modifiés (un setup de 50 objets ≈ 30 Ko au pire). Chaque entrée porte un **libellé i18n** (`history.moveObject` + valeurs) réutilisé pour l'annonce `aria-live` et l'info-bulle « Undo Move monitor ». Limite **100 entrées** (> 50 exigées).
- **Coalescence** : `beginTransaction()` / `commit()` / `cancel()` ; un drag ou une rotation à la poignée n'écrit que dans `transientStore`, puis un seul `moveObject` au `pointerup` ; la saisie dans un champ numérique produit une entrée à la validation (blur/Entrée), et des commandes successives de même type sur le même objet en moins de 500 ms (flèches clavier) sont fusionnées.
- Les **alertes** sont un état **dérivé** : `evaluate(setup, catalog, settings)` (ADR-3D-06) recalculé par un sélecteur mémoïsé sur la référence du setup, jamais stocké.
- Undo/redo restaure aussi la sélection de l'entrée (méta `selectionAfter`) pour que l'utilisateur voie ce qui a changé.

**Conséquences.**
- (+) Undo/redo, autosave, recalcul des alertes et annonces sont des abonnements à une seule chose : le changement de référence du setup.
- (+) Les reducers sont purs, testables en Node, et réutilisables tels quels côté serveur plus tard (validation d'un setup partagé).
- (−) Il faut écrire un reducer par commande (au lieu de muter librement) ; c'est le prix d'un historique fiable.
- (−) Snapshots plutôt que patches : pas de diff transportable. Suffisant sans collaboration temps réel ; si R6 en introduit, passer à des patches (Immer `produceWithPatches`) sans changer l'API `dispatch`.

**Alternatives écartées.**
1. **Redux Toolkit** : modèle très proche (actions + reducers) mais plus verbeux, store pensé pour React-Redux ; l'accès hors React depuis `useFrame` est moins direct qu'avec Zustand. Rien qu'on n'obtienne déjà.
2. **`zundo` (middleware temporal de Zustand)** : snapshot automatique de tout changement d'état ; ne connaît ni la notion de commande, ni les libellés pour l'annonce, ni la coalescence d'un drag sans configuration fragile.
3. **Valtio / MobX (état mutable par proxy)** : mutations faciles mais snapshots et undo plus délicats, risque de mutations hors commandes depuis la scène, contraire à « une seule voie de modification ».
4. **Historique par commandes inverses (`do`/`undo` codés à la main)** : chaque commande doit fournir son inverse exact ; source de bugs (duplication, suppression d'un objet porteur d'un écran monté) que les snapshots évitent gratuitement.

---

### ADR-APP-03 — Validation, migration et import non fiable du setup : Zod (mode jitless) + pipeline unique

**Contexte.** Le setup est lu depuis trois sources non maîtrisées : le stockage local (peut être corrompu, d'une ancienne version, modifié à la main), un **fichier importé** (non fiable, surface d'attaque de US-002), et plus tard un lien de partage ou une API (R6). ADR-3D-02 fixe le format et la migration ; reste à fixer l'outil et le pipeline.

**Décision.**
- **Zod** (v4) dans `core/schema` : un schéma par version publiée (`SetupV1`, `SetupV2`…), types TS dérivés (`z.infer`), JSON Schema exporté pour la doc. Configuration **`jitless`** pour ne jamais générer de code (`new Function`) : compatible avec une CSP sans `unsafe-eval`.
- **Pipeline unique** `parseSetup(raw: string, source) → Result<Setup, ImportError>` dans `core/io`, utilisé par le stockage local, l'import et les tests :
  1. **Taille** : refus au-delà de **1 Mio** (vérifié sur `File.size` **avant** lecture, puis sur la longueur de la chaîne).
  2. `JSON.parse` (sans reviver), erreur → `ImportError.notJson`.
  3. **Enveloppe** : `format === "p152.setup"`, `schemaVersion` entier ; version > courante → `ImportError.newerVersion` (« This file was made with a newer version of P152 ») ; version inconnue/inférieure au minimum supporté → refus.
  4. **Migrations** pures `vN → vN+1` appliquées en chaîne (fixtures de chaque version dans `tests/fixtures/setups/`).
  5. **Validation stricte** Zod : objets `.strict()` (clé inconnue = rejet, sauf sous `extensions`, ignoré et non interprété), nombres `finite` et bornés, entiers où attendu, chaînes bornées (nom ≤ 80 caractères, ids au format UUID), énumérations fermées, tableau `objects` ≤ **50**, profondeur limitée de fait par le schéma. Clés `__proto__`, `constructor`, `prototype` rejetées partout (pas de pollution de prototype lors des fusions).
  6. **Validation sémantique** contre le catalogue : `catalogId` connu, paramètres dans les bornes du catalogue (rejet, pas de clamp silencieux, pour que l'utilisateur sache ce qui a changé), ids uniques, `mount.parentId` existant et sans cycle, `materialId` connus (R2).
  7. Normalisation (ordre des clés, valeurs par défaut du catalogue pour les paramètres absents optionnels).
- Les erreurs exposent un **code** + un chemin JSON tronqué, traduits par l'UI (« The file isn't a valid P152 setup (objects[3].params.width) ») ; jamais de pile d'exception ni de contenu du fichier réaffiché tel quel.
- Aucune donnée importée n'est interprétée comme HTML, URL ou code : rendu par React (texte échappé), aucun `dangerouslySetInnerHTML` (règle de lint), aucun champ URL accepté au MVP. Les champs URL futurs (R5 produits, R7 modèles) seront validés par liste blanche de domaines côté schéma.

**Conséquences.**
- (+) Une seule implémentation de la confiance, testée une fois (y compris par fuzzing, ADR-APP-08) pour toutes les sources, réutilisable côté serveur (R6).
- (+) Les messages d'erreur sont prévisibles et traduisibles.
- (−) Un schéma Zod par version à conserver (en lecture seule) tant que la version est migrable.
- (−) Zod v4 complet ≈ 15-20 Ko gz ; acceptable (le mini-build `zod/mini` reste une option si le budget JS le demande).

**Alternatives écartées.**
1. **Ajv + JSON Schema** : très rapide, mais compile les validateurs avec `new Function` (exige `unsafe-eval` ou une précompilation au build), types TS à maintenir séparément.
2. **Valibot** : plus léger et bien conçu, mais écosystème et familiarité moindres ; même modèle mental que Zod, donc bascule possible plus tard si le poids devient critique.
3. **Validation manuelle (type guards écrits à la main)** : pas de types dérivés, oublis probables sur un format qui va évoluer à chaque release ; inacceptable pour une surface d'attaque.

---

### ADR-APP-04 — Persistance locale : `localStorage` derrière un repository asynchrone ; export/import par fichier

**Contexte.** US-018 : sauvegarde automatique, restauration à l'identique, donnée corrompue ou ancienne migrée ou ignorée sans planter, export/import JSON. Un seul setup courant au MVP (≈ 5-30 Ko). Plus tard : plusieurs setups, vignettes, modèles importés (R7, binaires de plusieurs Mo), synchronisation cloud (R6).

**Décision.**
- **Interface `SetupRepository`** (ADR-APP-09) **asynchrone dès le MVP** : `loadCurrent()`, `saveCurrent(setup)`, `clear()` ; l'UI et le store ne connaissent que l'interface.
- **Adapter MVP : `localStorage`**, clé `p152:v1:setup:current`, valeur = l'enveloppe JSON exportable (même format que l'export : un seul format partout). Préférences (guide fermé, panneaux, magnétisme) sous `p152:v1:prefs`, validées elles aussi par schéma.
- **Autosave** : abonnement au `documentStore`, écriture débouncée (400 ms) + écriture immédiate sur `visibilitychange: hidden` et `pagehide` (l'écriture synchrone de `localStorage` y est fiable). Indicateur « Saved in this browser » / « Couldn't save in this browser » (quota, mode privé restrictif) sans bloquer l'édition.
- **Lecture au démarrage** via `parseSetup` (ADR-APP-03). Donnée invalide : copie conservée sous `p152:v1:setup:recovered` (une seule, écrasée), setup vierge chargé, message non bloquant avec option « Export the unreadable data » pour ne rien perdre. Ancienne version : migrée puis réécrite.
- **Plusieurs onglets** : événement `storage` écouté ; si un autre onglet modifie le setup, bandeau « This setup was changed in another tab. Reload? » (dernier écrivain gagne sinon). Pas de verrouillage au MVP.
- **Export** : `JSON.stringify` indenté de l'enveloppe → `Blob` → lien `download` temporaire (`URL.revokeObjectURL` ensuite), nom de fichier assaini `p152-<slug-du-nom>-<AAAA-MM-JJ>.json` (slug `[a-z0-9-]`, 40 caractères max). Ni sélection ni état d'UI exportés.
- **Import** : `<input type="file" accept=".json,application/json">` (et glisser-déposer plus tard), contrôle de taille avant lecture, `File.text()`, `parseSetup`, puis confirmation « Replace current setup? » (S5) et **commande `replaceSetup` annulable** (l'import n'efface pas l'historique : Ctrl+Z revient au setup précédent).
- **Bascule vers IndexedDB** planifiée dès qu'une story exige plusieurs setups ou des binaires (au plus tard R4/R7) : nouvel adapter `IndexedDbSetupRepository` (lib `idb`), migration unique `localStorage → IndexedDB` au démarrage, aucun changement hors `persistence/`.

**Conséquences.**
- (+) Zéro dépendance, API synchrone fiable à la fermeture de page, facile à inspecter et à piloter en E2E.
- (+) L'interface asynchrone rend la bascule IndexedDB ou cloud transparente pour le reste de l'app.
- (−) Quota ≈ 5 Mo et écriture bloquante : sans impact à 30 Ko, mais à ne pas utiliser pour des vignettes ou des modèles.
- (−) Données perdues si l'utilisateur vide son navigateur : rappelé dans l'aide, mitigé par l'export.

**Alternatives écartées.**
1. **IndexedDB dès le MVP** : bon choix à terme, mais asynchrone (écriture non garantie dans `pagehide`), API verbeuse ou dépendance, et aucun besoin MVP ne l'exige ; l'abstraction permet de l'adopter sans réécriture.
2. **OPFS (Origin Private File System)** : pensé pour de gros fichiers et du travail en worker ; disproportionné et support des écritures synchrones limité aux workers.
3. **Persistance dans l'URL (setup encodé dans le hash)** : pratique pour partager, mais longueur limitée, historique du navigateur pollué, et toute URL devient une entrée non fiable ; gardé comme option de partage sans backend (ADR-APP-09).
4. **File System Access API (sauvegarde directe sur disque)** : non supportée par Firefox et Safari ; l'export/import par téléchargement couvre le besoin partout.

---

### ADR-APP-05 — i18n : i18next + react-i18next, clés typées, formatage `Intl`

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

---

### ADR-APP-06 — Composants accessibles : React Aria Components (headless), stylés avec nos tokens

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

---

### ADR-APP-07 — Structure de `src/` et règles de dépendance

**Décision.** Arborescence alignée sur les couches de la section 1, avec trois ajouts : `app/` (composition), `persistence/` (adapters d'E/S) et `core/commands`, `core/io`, `core/ports`.

```
src/
  main.tsx                 point d'entrée : monte <App/>
  app/                     composition root : App, providers, ErrorBoundary,
                           services.ts (choix des adapters), détection WebGL (S0)
  core/                    TypeScript PUR (aucun import React/three/DOM)
    schema/                Zod par version + migrations           (GE + dev)
    catalog/               chargement/validation du catalogue      (GE)
    geometry/ fit/ snap/ materials/                                 (GE)
    commands/              types de commandes + reducers purs      (dev)
    io/                    parseSetup / serializeSetup (ADR-APP-03) (dev)
    ports/                 interfaces : SetupRepository, CatalogSource… (dev)
  state/                   stores Zustand (document+history, session, transient),
                           dispatch, sélecteurs (alertes dérivées, verdict)
  persistence/             adapters : localStorageSetupRepository, fileExport,
                           fileImport (seul endroit qui touche Storage/Blob/File)
  render/                  scène R3F (GE) ; expose <Viewport/> et des hooks
  ui/
    components/            wrappers React Aria stylés (Button, NumberField, Dialog…)
    studio/                TopBar, LeftPanel (Desk, Objects), Properties, Alerts,
                           ViewportToolbar, ObjectsOnDeskList
    dialogs/               Welcome, ConfirmReplace, Help, AlertSettings
    a11y/                  announcer, shortcuts, SkipLinks
    i18n/                  config i18next, format.ts
    styles/                tokens.css (généré depuis le design system), global.css
  locales/en/*.json
tests/
  fixtures/setups/         un fichier par version de schéma + fichiers malveillants
  e2e/                     Playwright (QA)
```
Tests unitaires et de composants **colocalisés** (`*.test.ts(x)` à côté du fichier).

**Règles de dépendance** (vérifiées par `eslint-plugin-boundaries` en CI) :
- `core` → rien d'autre que `core`.
- `state`, `persistence` → `core`.
- `render` → `core`, `state` (écrit uniquement via `dispatch`/`transientStore`).
- `ui` → `core` (types, clés), `state`, et seulement l'export public de `render` (`<Viewport/>`, hooks de caméra) ; jamais `three`.
- `app` → tout (c'est le seul endroit qui instancie les adapters).

**Alternatives écartées.**
1. **Découpage par fonctionnalité (`features/desk`, `features/alerts`…)** : naturel pour une UI, mais mélange code pur et code React/three dans chaque dossier et rend la règle « `core` testable sans navigateur » impossible à vérifier par lint.
2. **Monorepo multi-packages dès le MVP (pnpm workspaces : `core`, `web`)** : isolation parfaite et réutilisable par un futur backend, mais outillage et CI plus lourds sans bénéfice immédiat ; l'extraction de `src/core` en package sera triviale grâce aux règles ci-dessus le jour où un backend TS existe.
3. **Organisation par type technique (`components/`, `hooks/`, `utils/`)** : ne reflète pas les couches et laisse fuir three.js ou le DOM partout.

---

### ADR-APP-08 — Stratégie de tests : Vitest (unitaires + composants), fixtures partagées, fuzzing de l'import

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

---

### ADR-APP-09 — Backend futur sans réécriture : ports et adapters, offline-first

**Contexte.** MVP sans backend (H2). Plus tard : sauvegarde cloud et comptes (R6), partage et galerie (R6), catalogue de produits réels et prix (R5), import photo → 3D par IA (R7, clé d'API et calcul côté serveur obligatoires). Il faut que ces évolutions s'ajoutent sans toucher au cœur ni à l'UI existante. **Aucun choix de fournisseur n'est engagé aujourd'hui.**

**Décision.**
- **Ports** (interfaces TS dans `core/ports`, asynchrones, retour `Result`) définis dès le MVP pour ceux qui ont un adapter, et réservés pour les autres :

| Port | MVP | Futur |
|---|---|---|
| `SetupRepository` (load/save/list/delete) | `localStorage` | IndexedDB (R4/R7), cloud synchronisé (R6) |
| `CatalogSource` (types d'objets, bureaux, matériaux) | JSON statiques du TA, embarqués | + catalogue distant versionné (R4/R5) |
| `ProductCatalog` (produits réels, prix) | — | R5 : API en lecture seule ou JSON publié |
| `ShareService` (publier/lire un setup partagé) | — | R6 : lien vers un setup serveur ; option sans serveur : JSON compressé dans le fragment `#` de l'URL |
| `AuthService` | — | R6 |
| `AssetStorage` / `ModelImportService` | — | R7 : upload, file de traitement asynchrone, statut |

- **Composition** : `app/services.ts` choisit les adapters (selon la configuration de build/environnement) et les fournit par un contexte React ; aucun composant n'importe un adapter directement. Pas de lib d'injection de dépendances.
- **Offline-first** : les ids (UUID) et `updatedAt` sont déjà générés côté client ; R6 ajoutera `revision` et un `ownerId` au schéma (migration v1 → v2) et une synchronisation « local d'abord, puis envoi », le local restant la source en cas d'échec réseau.
- **Validation partagée** : `core/schema` + `core/io` (purs) seront extraits en package et exécutés **aussi côté serveur** : le serveur ne fait jamais confiance au client (mêmes limites de taille, même schéma, mêmes bornes).
- **Options envisagées** (à départager par un spike avant R5/R6, nouvel ADR à ce moment-là) :
  - **Supabase** (Postgres + Auth + Storage + Row Level Security + Edge Functions) : démarrage très rapide pour comptes, setups (JSONB), galerie et stockage d'images ; Postgres standard, donc sortie possible. Risques : dépendance au fournisseur pour Auth/RLS, règles RLS à auditer (secdevops).
  - **API maison** (Node + Fastify ou Hono, Postgres, stockage objet S3-compatible, OpenAPI générée depuis les schémas Zod) : contrôle total et même langage que le front ; coût d'exploitation, d'auth et de sécurité entièrement à notre charge.
  - **Sans serveur pour le partage** (fragment d'URL compressé) : couvrirait un partage simple en lecture sans aucun hébergement de données, avec le même pipeline `parseSetup` à l'ouverture.
  - Écartés a priori : **Firebase/Firestore** (NoSQL propriétaire, requêtes de galerie et migrations de schéma moins naturelles, sortie coûteuse) ; **appel direct d'une API d'IA depuis le navigateur** pour R7 (exposerait la clé d'API et les quotas : traitement obligatoirement côté serveur).
- Sécurité anticipée (à intégrer au threat model avant R6/R7) : secrets uniquement côté serveur, CORS restreint, quotas et limites de taille d'upload, modération des contenus partagés, RGPD (export/suppression du compte), CSP mise à jour pour les domaines d'API.

**Conséquences.**
- (+) Ajouter le cloud ou le partage = écrire un adapter + des écrans ; ni `core`, ni `state`, ni les écrans existants ne changent.
- (+) L'app reste utilisable hors ligne et sans compte, même après R6.
- (−) Quelques interfaces définies avant d'avoir leur implémentation : on se limite aux ports dont la forme est claire (`SetupRepository`, `CatalogSource`) ; les autres ne sont que réservés dans ce tableau, pas codés.

**Alternatives écartées.**
1. **Introduire un backend dès le MVP « pour préparer l'avenir »** : contraire à la décision PO (H2), ajoute hébergement, auth et surface d'attaque sans valeur utilisateur au MVP.
2. **Appels de stockage directs dans les composants/stores (pas d'abstraction)** : le passage au cloud imposerait de reprendre chaque écran et chaque test ; c'est la réécriture qu'on veut éviter.
3. **Choisir le fournisseur (Supabase ou autre) dès maintenant** : décision prématurée, les besoins R5 (source des prix) et R7 (coût de l'IA) sont encore inconnus.

---

### ADR-APP-10 — Socle `core/` livré en US-003 : contrats du schéma v1, du catalogue et des garde-fous

> Statut : **Accepté** (2026-10-20, revue US-003 APPROVE). Précise ADR-3D-02, ADR-APP-03/05/07/08 sans les contredire.

**Contexte.** US-003 livre le premier code de `src/core/` (schéma, catalogue, pipeline d'import) avant toute UI et toute scène. Plusieurs points laissés ouverts par les ADR doivent être fixés pour que US-004 (scène), US-005 (shell) et US-018 (persistance) s'appuient dessus sans refonte.

**Décision.**
- **Schéma `SetupV1`** (`core/schema/setupV1.ts`, Zod `jitless` via le point d'entrée unique `core/schema/zod.ts`) : conforme à ADR-3D-02, avec ces précisions :
  - `desk.materials` ajouté (surcharges par slot, comme les objets) : le bureau a lui aussi des slots (`top`, `legs`).
  - Champs de la vision long terme **présents mais fermés** en v1 : `product: null`, `environment.room: null`, `environment.lighting: "neutral"` seulement. Les ouvrir (R3, R5) sera une migration v1 → v2, pas une refonte.
  - Bornes structurelles : coordonnées ±10 000 mm (un objet peut déborder, c'est une alerte), `rotationY` dans [-360, 360], nom et libellé 1 à 80 caractères sans caractère de contrôle, ≤ 24 paramètres, ≤ 8 surcharges de matériau, ≤ 32 clés dans `extensions`, profondeur JSON ≤ 16, 50 objets.
- **`parseSetup(text, catalog, { declaredBytes })`** (`core/io`) : seule voie de lecture d'un setup (SR-01). Ordre : taille déclarée puis taille UTF-8 (≤ 1 Mio) → retrait d'un BOM UTF-8 initial (un seul) → `JSON.parse` → garde structurelle itérative (clés `__proto__`/`constructor`/`prototype`, profondeur, prototype non standard) → enveloppe et version → migrations → schéma strict → contrôles sémantiques contre le catalogue (entrée connue et du bon type, `catalogVersion`, paramètres connus et dans les bornes, enums, matériaux et slots, ids uniques, `mount` sans parent manquant ni cycle, style connu) → normalisation (paramètres absents = défauts du catalogue) → document gelé. Erreurs = `{ code, path }` : 19 codes traduits par `errors:import.<code>`, chemin assaini (segments non identifiants remplacés par `?`, 120 caractères max) ; jamais de contenu du fichier. `checkDeclaredSize(File.size)` est exposé pour refuser avant lecture.
- **Catalogue** (`core/catalog`) : `validateCatalog(files)` valide tous les fichiers de `assets/catalog` (schémas stricts, sauf les blocs descriptifs de `studio.json`), puis `min ≤ défaut ≤ max`, défauts d'enum, presets dans les bornes, `formats` alignés sur l'enum `format`, ids uniques, toutes les références (matériaux des slots et des styles, types des styles, bureau du studio) ; renvoie **toutes** les anomalies. **Plafonds GPU** (`core/catalog/limits.ts`, M-04) : ≤ 10 000 triangles et ≤ 8 draw calls par type, segments du cyclorama ≤ 64, shadow map ∈ {256…4096}, ≤ 32 échantillons de flou, budgets de scène ≤ ADR-3D-08. Ports `CatalogSource` et `SetupRepository` déclarés dans `core/ports`.
- **Catalogue embarqué hors de `core/`** : l'adapter `embeddedCatalogSource` (`persistence/catalog/embeddedCatalogSource.ts`) charge les JSON par `import.meta.glob` (un nouveau type = un fichier JSON du TA, sans code), les valide avec `validateCatalog` (une fois, mémoïsé) et les expose via le port `CatalogSource` ; `app/` l'instanciera (ADR-APP-09). Il est dans `persistence/` (adapters, ADR-APP-07) et non dans `core/`, car il dépend du bundler : `core/` reste exécutable tel quel côté serveur ou en Node. Les tests de `core/` valident le catalogue lu sur disque (`tests/unit/helpers/fixtures.ts`).
- **Frontières de couches et texte en dur** : appliquées **avec les règles natives d'ESLint**, vérifiées par un test (`tests/unit/lint-rules.test.ts`) :
  - `core/` (tous les fichiers `src/core/**/*.{ts,tsx,mts,cts}`) : **liste blanche** d'imports (`no-restricted-imports`) : seulement des modules relatifs de `core/`, `zod` uniquement dans `core/schema/zod.ts`, `vitest`/`fast-check` uniquement dans ses tests ; un chemin relatif ne peut viser ni `node_modules`, ni les autres couches, ni `src/locales`, `tests/` (sauf depuis les tests de `core/`, pour les fixtures partagées) et `src/main` (motif `(^|/)(locales|tests|main)(/|\.|$)`) ; `no-restricted-syntax` interdit l'import dynamique, les types `import("x").T`, `import.meta` (pas `new.target`), `require` et le JSX (le runtime automatique importe `react/jsx-runtime` sans import visible ; `tsconfig.core.json` le refuse aussi avec `"jsx": "preserve"`, erreur TS7026) ; `no-restricted-globals` interdit le DOM et les E/S (dont `globalThis`, `self`, `crypto`, `process`) en complément du compilateur.
  - **Pureté vérifiée par le compilateur** : `tsconfig.core.json` (`lib: ["ES2023"]` sans DOM, `types: []`) type-check le code de production de `core/` dans `pnpm typecheck` (donc `pnpm check` et la CI) ; toute API du navigateur ou de Node y est une erreur de compilation.
  - autres couches : `no-restricted-imports` par motifs regex (ADR-APP-07).
  - texte en dur dans `ui/` et `app/` : `no-restricted-syntax` sur le texte JSX, les chaînes et gabarits (`TemplateLiteral`) enfants d'un élément ou d'un fragment, et les attributs `alt`/`aria-label`/`title`/`placeholder`… (littéral ou expression) ; les autres attributs (`className={"x"}`) ne sont pas signalés. **Limites connues** (acceptables tant qu'aucun écran n'existe, à lever en US-005) : ne sont pas détectés le texte dans un ternaire (`{c ? "Yes" : "No"}`), une expression logique (`{c && "Yes"}`), une concaténation (`{"Hello" + "!"}`) ni une constante définie ailleurs (`const M = "Hello"; … {M}`). US-005 adopte `eslint-plugin-i18next/no-literal-string` (modes `jsx-text-only` + `jsx-attributes`) ou étend le sélecteur aux `ConditionalExpression`, `LogicalExpression` et `BinaryExpression`. `eslint-plugin-boundaries` et `eslint-plugin-i18next` ne sont **pas** ajoutés : zéro dépendance pour le même résultat sur notre arborescence ; à réévaluer si les règles se compliquent (ex. exceptions par fichier).
- **i18n** : `ui/i18n/config.ts` crée une instance i18next synchrone (ressources `src/locales/en/*.json` embarquées, `escapeValue: false`), clés typées par augmentation de module (`ui/i18n/i18next.d.ts`) ; `main.tsx` fournit l'instance et synchronise `<html lang>`.
- **Tests** : Vitest en deux projets (`node` pour `src/core/**` et `tests/unit/**`, `jsdom` pour le reste) ; fixtures `tests/fixtures/setups/v1/{valid,invalid,malicious}` (les fichiers malveillants sont exclus de Prettier pour rester octet pour octet) ; fuzzing fast-check de `parseSetup` (jamais d'exception, clés interdites injectées partout rejetées, aller-retour `serialize → parse` sur des setups valides générés depuis le catalogue). Seuils de couverture en cliquet sur `src/core/**` : lignes/instructions/fonctions 95 %, branches 90 % ; sur `src/persistence/**` : 90 % partout (ADR-APP-08). `src/state/**` (vide aujourd'hui) reçoit le même seuil avec son premier module. Le seuil global (80 %) sera posé avec la première UI (US-005).

**Conséquences.**
- (+) US-004 lit le bureau et le studio dans un catalogue déjà validé ; US-018 n'a plus qu'à brancher `parseSetup` sur `localStorage` et l'import de fichier.
- (+) Garde-fous de couches et d'i18n actifs dès maintenant, sans dépendance supplémentaire.
- (−) Les règles natives sont moins expressives que `eslint-plugin-boundaries` (pas de graphe de dépendances) ; un import transitif via un barrel reste possible et relève de la revue. Les motifs portent sur le texte du chemin, pas sur le chemin résolu : un chemin relatif qui remonte hors de `src/core` vers un dossier non listé n'est pas détecté par le lint (le compilateur `tsconfig.core.json` reste le garde-fou pour le DOM et Node). Un `require` aliasé (`const r = require; r("x")`) n'est pas détecté non plus (sans portée pratique : `require` n'existe pas dans le bundle ESM et n'est pas typé dans `tsconfig.core.json`).
- (−) `fast-check` ajouté en dépendance de développement (4.10.2, publiée le 2026-09-19, `pnpm audit` sans vulnérabilité) : prévu par ADR-APP-08.

**Alternatives écartées.**
1. **`eslint-plugin-boundaries` + `eslint-plugin-i18next` dès US-003** : deux dépendances de plus pour des règles que l'arborescence actuelle permet d'exprimer nativement.
2. **Clamp silencieux des valeurs hors bornes à l'import** : contraire à ADR-APP-03 (l'utilisateur doit savoir ce qui a changé).
3. **Validation du catalogue seulement en test** : le catalogue embarqué est aussi validé à l'exécution (une fois, mémoïsé) ; coût négligeable et défense en profondeur si un fichier du TA est altéré.

---

### ADR-APP-11 — Première interface (US-004) : tokens copiés et vérifiés, préférences locales, région live propre à la scène

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
- (−) Chunk principal ≈ 154 Ko gz avec React Aria (budget du shell fixé en US-005).
- (−) Deux mécanismes d'annonce coexisteront si US-005 choisit le `LiveAnnouncer` : à unifier alors.

**Alternatives écartées.**
1. **Importer `docs/design/ui/tokens.css` directement** : embarquerait le `@font-face` vers un fichier absent (404 en console) et ferait dépendre le build de `docs/`.
2. **Générer tokens.css par un script de build** : plus d'outillage pour un fichier copié tel quel.
3. **`Toolbar` de React Aria** : un seul arrêt de tabulation, contraire à UX-3.

---

### Sécurité transverse de l'application (entrée pour le threat model US-002)

- Entrées non fiables : stockage local, fichier importé, plus tard URL de partage et API. Toutes passent par `parseSetup` (taille ≤ 1 Mio, ≤ 50 objets, schéma strict, bornes, pas de clés de prototype).
- Aucun `eval`, `new Function` (Zod jitless), `dangerouslySetInnerHTML` ni `innerHTML` (règles ESLint `no-eval`, `react/no-danger`).
- CSP cible (posée par le devops à l'hébergement) : `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests`. **Valeur identique à celle d'ADR-OPS-06, qui fait référence** ; la seule source de vérité exécutable sera `config/security-headers.mjs` (SEC-03a). Toute modification se fait d'abord dans ADR-OPS-06 puis dans ce fichier, jamais ici seule.
- Pas de dépendance chargée depuis un CDN tiers à l'exécution (cohérent avec ADR-3D-04).
- Aucun secret côté client, ni au MVP ni après (les clés d'API futures vivent côté serveur).

### Dépendances applicatives proposées (justification)

| Dépendance | Rôle | Pourquoi plutôt qu'une alternative |
|---|---|---|
| react, react-dom, vite, typescript | Socle (APP-01) | Imposé par R3F ; Vite standard actuel |
| zustand | État (APP-02) | Store hors React pour le drag ; Redux plus verbeux |
| zod | Schéma (APP-03) | Types dérivés, mode jitless ; Ajv exige `new Function` |
| i18next, react-i18next | i18n (APP-05) | Standard, pluriels, chargement paresseux ; maison = réinventer |
| react-aria-components | Accessibilité (APP-06) | Couvre NumberField et i18n des nombres ; Radix non |
| vitest, @testing-library/react, @testing-library/dom, @testing-library/user-event, jsdom, axe-core, fast-check | Tests (APP-08) | Un seul runner ; fuzzing de l'import ; axe-core direct plutôt que vitest-axe non maintenu (ADR-APP-11) |
| eslint-plugin-boundaries, eslint-plugin-i18next | Garde-fous (APP-07, APP-05) | Règles de couches et « pas de texte en dur » vérifiées en CI |

### Récapitulatif des choix applicatifs

| Sujet | Choix | Écarté |
|---|---|---|
| Framework / build | React 19 + TS strict + Vite, SPA statique | Svelte/Threlte, Vue/TresJS, Next.js SSR, CRA/webpack |
| État / undo | Zustand (document, session, transient), commandes pures, snapshots immuables, coalescence | Redux Toolkit, zundo, Valtio/MobX, commandes inverses |
| Schéma / import | Zod jitless, pipeline `parseSetup` unique, 1 Mio, 50 objets | Ajv, Valibot, type guards maison |
| Persistance | `localStorage` derrière `SetupRepository` async ; IndexedDB à R4/R7 ; export/import fichier | IndexedDB dès le MVP, OPFS, URL, File System Access |
| i18n | i18next + react-i18next, clés typées, `Intl` | react-intl, Lingui, maison |
| Composants a11y | React Aria Components + wrappers stylés par tokens | Radix, MUI/Chakra/Mantine, maison |
| Structure | Couches `core/state/persistence/render/ui/app`, lint de frontières | Par feature, monorepo immédiat, par type technique |
| Tests | Vitest Node + jsdom, RTL, axe, fast-check, seuils en cliquet | Jest, browser mode partout, snapshots DOM |
| Backend futur | Ports/adapters, offline-first, validation partagée ; Supabase ou API maison à trancher avant R5/R6 | Backend au MVP, accès direct au stockage, fournisseur choisi maintenant |

## 4. Build, CI et hébergement

> Rédigé par le devops (kickoff, 2026-10-19). **Proposition : rien n'est initialisé, poussé ni déployé.** Le repo (US-001) est créé après validation de la stack par le PO ; tout remote, compte d'hébergement ou déploiement exige l'accord explicite du PO. Les noms de fichiers sont des cibles. Environnement de l'équipe : **Windows 11** (PowerShell / Git Bash) : tous les scripts du projet sont écrits en **Node (`.mjs`) ou en scripts de `package.json`**, jamais en bash/Makefile Unix-only.

Principes : (1) une commande locale `pnpm check` rejoue exactement ce que fait la CI ; (2) CI = source de vérité, les hooks locaux ne sont qu'un confort ; (3) tout est épinglé (Node, pnpm, actions, images) ; (4) coût cible **0 €** ; (5) un seul fichier source pour les en-têtes de sécurité, utilisé par le build, le serveur de preview E2E et l'hébergeur.

### ADR-OPS-01 — Gestionnaire de paquets et runtime : pnpm 10 + Node 24 LTS, versions épinglées

**Contexte.** Poste Windows, équipe qui apprend, supply chain npm exposée (scripts `postinstall` malveillants). Besoin d'installations reproductibles et rapides en CI.

**Décision.**
- **Node.js 24 (LTS active)**, fixé dans `.nvmrc`, `package.json#engines` (`>=24 <25`) et `actions/setup-node` (`node-version-file: .nvmrc`). Changement de LTS = ADR court + PR dédiée.
- **pnpm 10**, version exacte dans `package.json#packageManager`. Installation : `npm i -g pnpm@<version>` (Corepack n'est plus livré avec les Node récents, ne pas en dépendre) ; en CI `pnpm/action-setup`.
- `pnpm-lock.yaml` commité ; CI en `pnpm install --frozen-lockfile`. `.npmrc` : `engine-strict=true`. Config pnpm : **`onlyBuiltDependencies`** en liste blanche (aucun script d'installation de dépendance n'est exécuté sauf ceux validés, ex. `esbuild`), et **`minimumReleaseAge`** (ex. 3 jours) pour ne pas installer une version publiée la veille.
- Dépendances en versions **exactes** pour les outils de build/test (`save-exact=true`), mises à jour par PR groupées via **Dependabot** (npm + github-actions, hebdomadaire).

**Conséquences.** (+) Store global dédupliqué (rapide sur Windows, peu de disque), résolution stricte (pas de dépendance fantôme), blocage des scripts d'installation par défaut. (−) pnpm à installer en plus de Node ; certains outils mal écrits cassent avec `node_modules` non plat (rare, `public-hoist-pattern` en dernier recours).

**Alternatives écartées.**
1. **npm** : zéro installation, mais dépendances fantômes possibles, installation plus lente, pas de liste blanche native des scripts d'installation. Acceptable, mais moins protecteur pour une app qui importe beaucoup (three, R3F, React Aria).
2. **Yarn (Berry)** : bon outil, mais PnP/plugins ajoutent des spécificités d'outillage (ESLint, Vite) sans bénéfice ici ; Yarn classique est en fin de vie.
3. **Bun** : rapide, mais runtime et gestionnaire encore moins alignés avec nos outils de CI (Playwright, gltf-transform) ; risque de divergences Windows/Linux inutile pour un projet d'apprentissage.

---

### ADR-OPS-02 — Outillage qualité : ESLint 9 (flat) + typescript-eslint + Prettier + `tsc`, hooks légers

**Contexte.** TS strict, règles d'architecture (`eslint-plugin-boundaries`, ADR-APP-07), `eslint-plugin-i18next` (ADR-APP-05), `no-eval` / `react/no-danger` (sécurité), a11y. Le lint doit tourner identique sous Windows et en CI.

**Décision.**
- **Lint** : ESLint 9 (flat config `eslint.config.js`) + `typescript-eslint` (règles « strict type-checked »), `eslint-plugin-react-hooks`, `jsx-a11y`, `boundaries`, `i18next`, `no-eval`, `react/no-danger`. `--max-warnings 0`.
- **Format** : Prettier (config minimale dans `.prettierrc`, fins de ligne `lf` imposées par `.editorconfig` et `.gitattributes` `* text=auto eol=lf` pour éviter le bruit CRLF Windows). Pas de règles de style dans ESLint (`eslint-config-prettier`).
- **Typecheck** : `tsc --noEmit` (script séparé, car Vite ne vérifie pas les types).
- **Scripts** (`package.json`) : `dev`, `build`, `preview`, `lint`, `format`, `format:check`, `typecheck`, `test`, `test:cov`, `test:e2e`, `check:assets`, `check:bundle`, **`check`** (= format:check + lint + typecheck + test:cov + build + check:bundle).
- **Hooks Git** : `simple-git-hooks` + `lint-staged` (pre-commit : Prettier + ESLint sur les fichiers indexés) et `commitlint` (commit-msg : Conventional Commits, types `feat|fix|test|ci|docs|chore|sec|asset|refactor|perf`). Les hooks sont **rapides (< 5 s), contournables (`--no-verify`) et jamais la seule barrière** : la CI refait tout.
- **EditorConfig** + extension recommandée dans `.vscode/extensions.json` (aucun réglage perso commité).

**Conséquences.** (+) Les règles d'architecture et i18n/sécurité décidées dans les ADR-APP sont réellement appliquées. (−) ESLint type-checked est plus lent (≈ quelques dizaines de secondes en CI, acceptable) ; deux outils (ESLint + Prettier) à configurer.

**Alternatives écartées.**
1. **Biome (lint + format en un outil)** : très rapide et simple, mais n'a ni `boundaries`, ni `i18next/no-literal-string`, ni l'équivalent complet de `jsx-a11y` / règles type-aware : on perdrait les garde-fous exigés par ADR-APP-05/07. Réévaluable quand ces règles existeront.
2. **Husky** : standard, mais le gestionnaire de hooks ajoute un dossier et des scripts shell à faire marcher sous Windows ; `simple-git-hooks` suffit (un champ dans `package.json`). **Lefthook** (binaire Go, config YAML) est une bonne option de repli si les hooks deviennent complexes.
3. **Pas de hooks du tout** : possible, mais les erreurs de format/commit arriveraient en CI après coup, ce qui coûte des cycles de revue (limités à 3 par story).
4. **dprint / Standard / XO** : peu d'écosystème pour nos plugins et moins connu de l'équipe.

---

### ADR-OPS-03 — CI : GitHub Actions, jobs parallèles, actions épinglées par SHA, emplacements sécurité et E2E

**Contexte.** US-001 : lint + tests + build visibles sur chaque PR. La QA ajoute Playwright (US-022), secdevops ses scans (US-002), le technical-artist ses budgets d'assets. `main` doit rester vert.

**Décision.** Un workflow `.github/workflows/ci.yml`, déclenché sur `push` (branche `main`) et `pull_request`, `permissions: contents: read` par défaut (élévation par job si nécessaire), `concurrency` avec annulation des exécutions obsolètes d'une même PR, `timeout-minutes` sur chaque job. Toutes les actions sont épinglées par **SHA de commit** (version en commentaire), mises à jour par Dependabot.

| Job | Contenu | Dépend de | Artefacts |
|---|---|---|---|
| `quality` | install, `format:check`, `lint`, `typecheck` | – | – |
| `unit` | `test:cov` (Vitest, seuils en cliquet ADR-APP-08) | – | rapport de couverture (lcov + HTML), 14 j |
| `build` | `build` de production, `check:bundle` (budget JS initial : 3D ≤ 300 Ko gz, ADR-3D-08 ; app shell budget propre fixé en US-005), **garde-fou « pas de hooks de test en prod »** (le bundle ne contient ni `__p152test` ni `__p152perf`), génération des en-têtes (`dist/_headers` depuis `config/security-headers.mjs`) : **revient à SEC-03a, pas encore livrée** (Sprint 2, avant le premier push) ; d'ici là le contrôle `dist/_headers` de `sec-build-hardening` échouerait, il ne s'exécute qu'au premier push | – | `dist/` (7 j), rapport de tailles |
| `assets` | checkout avec LFS, `check:assets` : budgets du technical-artist (triangles, poids, textures), validation glTF, **licence présente** dans `docs/design/3d/licences-assets.md`, **aucun fichier > 1 Mo hors LFS**. S'exécute si `assets/**` ou le script change (filtre de chemins), toujours sur `main` | – | rapport JSON |
| `e2e` *(emplacement qa-tester)* | télécharge `dist-e2e` (build avec `VITE_E2E=true`), lance `vite preview` avec les **mêmes en-têtes CSP**, Playwright (Chromium d'abord) dans l'image officielle épinglée (ADR-OPS-05), échec si violation CSP ou erreur console | `quality`, `unit` | rapport HTML, traces, captures, vidéos en cas d'échec (14 j) |
| `security` *(emplacement secdevops)* | bloc réservé et commenté `# SECDEVOPS-SLOT` : SAST (CodeQL ou Semgrep), audit des dépendances (`pnpm audit` / OSV-Scanner + `dependency-review-action` sur PR), scan de secrets (gitleaks), scan de conteneur si un jour une image est publiée | – | rapports SARIF |
| `ci-ok` | job agrégateur vide qui `needs` tous les autres (y compris `security` dès qu'il existe) | tous | – |

- **Cache** : pnpm via `actions/setup-node` (`cache: pnpm`, clé = lockfile) ; navigateurs Playwright mis en cache par version de Playwright ; cache Vite/ESLint/tsc **non** utilisé au départ (gain faible, risque de faux verts).
- **Build E2E distinct du build prod** : deux artefacts (`dist` sans hooks de test, déployable ; `dist-e2e` avec `VITE_E2E=true`, jamais déployé). Le job `build` vérifie que le premier est propre.
- **Protection de `main`** : seul `ci-ok` est « required check » ; merge uniquement par PR/merge `--no-ff` quand il est vert. *(Les règles de protection de branche sur dépôt privé exigent un plan payant : sur dépôt privé gratuit, la règle est tenue par processus par le devops ; voir ADR-OPS-07.)*
- **Reproductibilité locale** : `pnpm check` (hors E2E et assets) ; `pnpm test:e2e` en local ou `docker compose run --rm e2e` pour l'environnement Linux de la CI.
- **Déploiement hors `ci.yml`** : un workflow séparé `deploy.yml`, **absent tant que le PO n'a pas approuvé l'hébergement** (ADR-OPS-06).

**Conséquences.** (+) Retour rapide (jobs parallèles, ~3-6 min visés), chaque échec pointe un domaine (qualité, tests, build, assets, E2E, sécurité) ; les rôles QA et secdevops ont un emplacement stable sans conflits de fichier. (−) Épinglage par SHA = mises à jour à passer en revue (automatisées par Dependabot) ; E2E dépend du build, donc plus long que le reste.

**Alternatives écartées.**
1. **Un seul job séquentiel** : plus simple à lire, mais plus lent, et un lint qui échoue masque l'état des tests ; paralléliser coûte peu.
2. **GitLab CI / CircleCI / Jenkins** : rien de plus adapté ; le code est (très probablement) sur GitHub, GitHub Actions est gratuit en illimité sur dépôt public (2 000 min/mois sur privé), sans serveur à administrer. Jenkins impose d'héberger et patcher un serveur.
3. **Tags de version mobiles (`actions/checkout@v4`)** : plus lisibles, mais un tag peut être réécrit (cf. compromissions d'actions tierces) ; le SHA est immuable.
4. **Turborepo / Nx pour le cache de tâches** : inutile sur un package unique (ADR-APP-07) ; à reconsidérer avec un monorepo.

---

### ADR-OPS-04 — Assets lourds : Git LFS (> 1 Mo), contrôle en CI, aucun binaire hors règles

**Contexte.** CLAUDE.md : Git LFS si un asset dépasse 1 Mo. Le MVP est procédural (peu ou pas de binaires) mais R2/R3/R4 amènent GLB, KTX2, HDRI. L'historique Git ne doit pas gonfler. Git LFS est livré avec Git for Windows.

**Décision.**
- `.gitattributes` (créé avec le repo) : `*.glb *.gltf(bin) *.ktx2 *.hdr *.exr *.basis *.psd *.blend *.fbx *.mp4 *.webm` → `filter=lfs diff=lfs merge=lfs -text` ; sources lourdes (`.blend`, `.psd`) rangées sous `assets/source/` et jamais copiées dans `public/` ni dans le build. Les PNG/JPG/SVG légers (UI) restent en Git normal.
- Garde-fou en CI et en `pre-commit` : `scripts/check-assets.mjs` échoue si un fichier > 1 Mo est suivi hors LFS, ou si un fichier LFS est resté à l'état « pointeur » dans `dist`.
- CI : `actions/checkout` avec `lfs: true` **uniquement** dans les jobs qui en ont besoin (`assets`, `build` dès qu'il y a des binaires, `e2e`) pour économiser la bande passante LFS.
- Budgets d'assets : lus depuis `assets/catalog/budgets.json` (propriété du technical-artist) et appliqués par `check:assets` (ADR-3D-04) ; le script ne contient aucun seuil en dur.
- Quota : le stockage/bande passante LFS gratuit de GitHub est limité (de l'ordre de 10 Gio, **à vérifier à l'ouverture du repo**) ; surveillance par le devops à chaque release ; les rebuilds de CI ne retéléchargent que les jobs concernés.
- Les fichiers binaires servis en production sont **ceux du build** (hachés dans `dist/assets/`), pas les pointeurs LFS.

**Conséquences.** (+) Dépôt léger à cloner, historique propre, règle automatisable. (−) Chaque contributeur doit avoir `git lfs install` (inclus dans Git for Windows, rappelé dans le README) ; le quota gratuit peut devenir limitant en R4 (bibliothèque de modèles) ; réécrire l'historique pour migrer vers LFS après coup est pénible, d'où la règle posée dès le premier commit.

**Alternatives écartées.**
1. **Binaires directement dans Git** : simple jusqu'à ce que l'historique atteigne des centaines de Mo ; irréversible sans réécriture d'historique.
2. **Stockage externe d'assets (bucket R2/S3) référencé par hash, hors Git** : pas de quota LFS, mais assets non versionnés avec le code, build non reproductible hors ligne, secrets/droits d'accès à gérer. Option de repli si le quota LFS est dépassé (R4).
3. **Dépôt séparé pour les assets (submodule)** : isole le poids, mais submodules = friction pour une équipe qui apprend, et CI plus complexe.

---

### ADR-OPS-05 — Conteneurs : pas d'image applicative au MVP ; image Playwright épinglée pour les E2E reproductibles

**Contexte.** L'app est une SPA statique (ADR-APP-01) : la « production » est un dossier de fichiers sur un CDN. Le développement tourne nativement sur Windows (Node + pnpm). Les E2E (captures, rendu WebGL) varient entre Windows et Linux (polices, anti-crénelage), ce qui rend les comparaisons visuelles instables.

**Décision.**
- **Aucun Dockerfile applicatif** au MVP (rien à exécuter côté serveur). Pas de conteneur de dev obligatoire : `pnpm install && pnpm dev` doit suffire sous Windows.
- **Un seul conteneur, optionnel pour l'humain et utilisé en CI : l'environnement E2E.** `docker-compose.yml` avec un service `e2e` basé sur `mcr.microsoft.com/playwright:v<version Playwright>-noble` (tag **identique à la version de `@playwright/test`**, vérifié par un script), exécuté en utilisateur non-root, avec le code monté en lecture seule et `pnpm test:e2e` en commande. Le job `e2e` de la CI utilise la même image (`container:`).
- **Rendu WebGL en CI** : Chromium headless utilise un rendu logiciel (SwiftShader). Les **FPS mesurés en CI ne sont pas représentatifs** d'un GPU réel : en CI, la QA vérifie les budgets **déterministes** (draw calls, triangles, mémoire via `window.__p152perf`, poids chargé, absence d'erreurs) ; les FPS (60/30) sont mesurés **manuellement sur matériel réel** et consignés dans le rapport QA.
- Si une image applicative devient utile (R6, API maison) : Dockerfile multi-stage, image de base épinglée par digest, utilisateur non-root, système de fichiers en lecture seule, scan de l'image par secdevops (emplacement `security`). Pour un test « prod-like » local d'une SPA : `nginxinc/nginx-unprivileged` avec les mêmes en-têtes, optionnel.

**Conséquences.** (+) E2E identiques sur toutes les machines et en CI, pas de Docker obligatoire pour développer (Docker Desktop est lourd sous Windows). (−) Les développeurs sans Docker lancent les E2E nativement (captures légèrement différentes : les tests visuels de référence sont donc **générés et comparés uniquement dans l'image**).

**Alternatives écartées.**
1. **Conteneur de dev complet (devcontainer / compose pour tout)** : environnement uniforme, mais surcoût sous Windows (WSL2, volumes lents, HMR plus lent) pour une pile 100 % Node qui fonctionne déjà nativement.
2. **Dockerfile applicatif servant `dist` avec nginx dès le MVP** : une image à construire, scanner, héberger, pour servir des fichiers qu'un CDN gratuit sert mieux.
3. **Playwright installé nu sur les runners (`playwright install --with-deps`)** : plus simple, mais dépendances système variables selon l'image runner et temps d'installation à chaque exécution.

---

### ADR-OPS-06 — Hébergement : Cloudflare Pages (statique), en-têtes de sécurité versionnés

**Contexte.** SPA statique, aucun backend au MVP, coût visé 0 €, **CSP stricte exigée** (donc en-têtes HTTP maîtrisés : `frame-ancestors` et plusieurs directives ne fonctionnent pas en `<meta>`), un aperçu par PR, HTTPS automatique, assets lourds à terme (GLB/KTX2 : bande passante).

**Décision (proposée au PO, non déployée).**
- **Cloudflare Pages** (plan gratuit) : bande passante de diffusion sans facturation au volume, aperçus par branche/PR, HTTPS/HSTS, fichier **`_headers`** pour les en-têtes, repli SPA (`/* /index.html 200` dans `_redirects`) ; domaine `*.pages.dev` gratuit, domaine perso optionnel (~10 €/an, à la demande du PO). Taille max d'un fichier statique 25 Mio (largement suffisant avec la compression meshopt/KTX2).
- Déploiement **piloté par la CI** (workflow `deploy.yml`, job séparé, `wrangler pages deploy dist` via action épinglée) plutôt que par l'intégration Git de Cloudflare : on déploie l'artefact **déjà testé** (`dist`), avec LFS résolu et budgets vérifiés. Secrets (`CLOUDFLARE_API_TOKEN` à portée minimale « Pages : édition », `CLOUDFLARE_ACCOUNT_ID`) uniquement dans les secrets GitHub, jamais en clair. **Création du compte, du projet et du premier déploiement : sur ordre du PO uniquement.**
- **Source unique des en-têtes** : `config/security-headers.mjs`. Elle génère `dist/_headers` au build, et configure `server.headers` / `preview.headers` de Vite pour les E2E (même CSP testée que celle servie). Le serveur de dev n'applique pas la CSP stricte (le HMR de Vite exige du script inline) : la CSP est vérifiée sur le build de preview.
- **En-têtes** :
  - `Content-Security-Policy` (valeur de référence, reprise à l'identique dans « Sécurité transverse ») : `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests`. **Aucun `unsafe-eval` ni `unsafe-inline`** : le build Vite produit des `<script type="module" src>` et des CSS extraits (aucun script/style en ligne dans `index.html`, à vérifier par un test sur `dist/index.html`). Les `style=""` posés par React/R3F via le DOM (`element.style`, CSSOM) ne sont pas bloqués ; seuls les attributs `style` présents dans du HTML analysé le seraient.
  - `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()` (R8 ajoutera `xr-spatial-tracking=(self)`), `Cross-Origin-Opener-Policy: same-origin`, `Strict-Transport-Security: max-age=31536000` (`includeSubDomains` et `preload` seulement avec un domaine du PO, SEC-37 ; sur `*.pages.dev` le TLD `.dev` est déjà préchargé HSTS, l'en-tête reste utile si l'app change d'hôte), `X-Frame-Options` inutile (couvert par `frame-ancestors`).
  - Cache : `/assets/*` (fichiers hachés) `public, max-age=31536000, immutable` ; `index.html` et `/_headers`-hors-assets `no-cache` ; modèles/textures du catalogue hachés comme les autres.
- **Réponse au developer (CSP et hooks de test)** :
  1. **CSP stricte validée sans `unsafe-eval`**, car Zod est en mode jitless (ADR-APP-03) et le MVP n'utilise ni WASM ni worker de décodage. **Point d'attention pour R2/R4** : le décodeur meshopt et le transcodeur Basis (KTX2) sont du **WebAssembly** et nécessitent **`'wasm-unsafe-eval'`** dans `script-src` (ce n'est pas `unsafe-eval`, il n'autorise que la compilation WASM). Il sera ajouté par un ADR au moment de la première story qui charge un GLB meshopt/KTX2, avec les workers servis localement (déjà couvert par `worker-src 'self' blob:`).
  2. **Hooks `window.__p152test` / `window.__p152perf` conditionnés à `VITE_E2E`** : validé. Ils sont derrière `if (import.meta.env.VITE_E2E === "true")`, donc éliminés par Vite (dead-code elimination) du build normal ; un **build dédié `dist-e2e`** (jamais déployé) les contient ; le job `build` échoue si `dist` contient ces symboles ; le workflow de déploiement ne publie **que** l'artefact du job `build`. `VITE_E2E` n'est jamais défini dans un fichier `.env` commité (uniquement dans le script `build:e2e`). Rappel : toute variable `VITE_*` est publique.
  3. Test E2E systématique : échec si un événement `securitypolicyviolation` ou une erreur console CSP survient.
- Si l'hébergement choisi ne sait pas poser d'en-têtes, la CSP n'est pas négociable : on change d'hébergeur (voir alternatives).

**Conséquences.** (+) 0 €, déploiement atomique d'un artefact testé, CSP/en-têtes revus en PR comme du code, CDN mondial pour les assets 3D. (−) Dépendance à Cloudflare (mitigée : le déploiement est un simple dossier statique + `_headers` + `_redirects`, portable en une heure vers Netlify) ; le format `_headers` est propre aux hébergeurs qui le supportent ; le plan gratuit a des limites de builds/déploiements par mois (sans effet : le build se fait en CI).

**Alternatives écartées.**
1. **GitHub Pages** : gratuit et très simple, intégré à Actions, **mais impossible de poser des en-têtes HTTP** (ni CSP `frame-ancestors`, ni cache fin, ni `nosniff` maîtrisé) ; pas d'aperçu par PR natif ; repli SPA bricolé (404.html). Contredit l'exigence de CSP stricte.
2. **Netlify** : excellent équivalent (`_headers`, deploy previews, formulaires), très bon plan gratuit, mais plan gratuit basé sur des crédits d'usage (bande passante et builds consommés ensemble) qui peuvent être épuisés par des assets 3D lourds ; **repli désigné** si Cloudflare pose problème.
3. **Vercel** : très bon pour Next.js, previews soignés, mais le plan gratuit « Hobby » est limité à un usage non commercial (bloquant si le produit devient une vraie offre, R5/R6) et les quotas de bande passante sont plus serrés pour des modèles 3D.
4. **VPS / S3 + CloudFront / serveur nginx maison** : contrôle total, mais coût, maintenance, certificats et patchs à notre charge, sans valeur pour une SPA statique.

---

### ADR-OPS-07 — Environnements, branches et release : trunk-based court, `--no-ff`, semver, CHANGELOG

**Contexte.** Règles projet : une story = une branche = un merge `--no-ff` ; Conventional Commits ; seul le devops merge sur `main` après reviewer APPROVE, secdevops validé, QA PASS. Équipe d'agents + un PO : pas besoin de multiplier les environnements.

**Décision.**
- **Branches** : `main` (toujours vert, déployable), `feature/<story-id>-<slug>` de courte durée (une story), `hotfix/<slug>` si besoin. Pas de branche `develop`, pas de `release/*` tant qu'un seul train de livraison existe. Les branches de travail sont rebasées/mises à jour sur `main` avant le merge si `main` a avancé (le devops relance alors la CI). Suppression de branche après merge : **sur accord du PO** (règle projet).
- **Merge d'une story** (devops) : rejouer `pnpm check` + E2E sur la branche, `git merge --no-ff feature/...`, rejouer sur `main`, puis noter le résultat. Rouge = pas de merge, renvoi de l'erreur exacte.
- **Environnements** :
  | Environnement | Source | URL | Rôle |
  |---|---|---|---|
  | local | poste Windows | `localhost:5173` | dev, hooks `VITE_E2E` possibles |
  | preview | chaque PR (artefact `dist`) | URL `*.pages.dev` par branche, `X-Robots-Tag: noindex` | démo au PO, QA manuelle |
  | production | tag de release sur `main` | `*.pages.dev` puis domaine du PO | version publique |

  Pas de staging séparé (la preview de `main` joue ce rôle). Les previews et la production ne contiennent **aucun secret** (tout `VITE_*` est public) ; il n'y a pas de variable d'environnement sensible au MVP, `.env.example` documente les clés (vides ou factices).
- **Release (à la demande du PO)** : tag **semver** `vMAJOR.MINOR.PATCH` annoté sur `main` ; `0.x` jusqu'au MVP, `1.0.0` à la validation du MVP par le PO, puis un MINOR par release produit (R2, R3…) ; `CHANGELOG.md` au format *Keep a Changelog*, alimenté depuis les commits Conventional Commits par le devops, version du `package.json` alignée sur le tag ; GitHub Release avec le changelog. Déploiement en production **uniquement sur ordre du PO**, depuis le tag.
- **Dépôt distant** : création, premier `push`, protections de branche et secrets GitHub **uniquement après accord du PO**. Si le dépôt est privé sur le plan gratuit (pas de protection de branche), le devops applique la règle par processus ; un dépôt public (ou un plan payant) permet d'activer les « rulesets » avec `ci-ok` obligatoire.

**Conséquences.** (+) Process minimal, lisible, aligné sur le workflow Scrum du projet ; chaque story est un merge auditable, annulable avec `git revert -m 1`. (−) Sans protection de branche automatique, le respect du « main vert » repose sur le devops ; pas de staging isolé (acceptable sans backend).

**Alternatives écartées.**
1. **GitFlow (develop + release + hotfix)** : prévu pour des versions parallèles maintenues ; ici une seule version vivante, cela ajouterait des merges sans bénéfice.
2. **Commits directs sur `main` / squash systématique** : plus rapide, mais perd le lien story-branche exigé par les règles du projet et la lisibilité de l'historique (`--no-ff`) ; le squash est écarté pour garder les commits Conventional Commits individuels.
3. **Déploiement continu automatique de `main` en production** : tentant, mais contraire à la règle « rien n'est déployé sans accord du PO » ; la production suit les tags décidés par le PO.
4. **Changesets / release-please / semantic-release** : automatisent versions et changelog, mais sont pensés pour des bibliothèques publiées ou ajoutent un bot/PR de release ; surdimensionné pour une application à un seul livrable. Réévaluable si le projet se scinde en packages (ADR-APP-07).

---

### Coût (objectif : 0 € / quasi gratuit)

| Poste | Choix | Coût |
|---|---|---|
| Dépôt + CI | GitHub (Actions illimité sur dépôt public, 2 000 min/mois sur privé), Dependabot, CodeQL (public) | 0 € |
| Hébergement + previews + CDN | Cloudflare Pages, plan gratuit | 0 € |
| Git LFS | Quota gratuit GitHub (à surveiller dès R2) ; au-delà, forfait de données ou stockage externe | 0 € au MVP |
| Outils (pnpm, ESLint, Prettier, Vitest, Playwright, gltf-transform, gitleaks) | Open source | 0 € |
| Nom de domaine | Optionnel, sur décision du PO | ~10 €/an |
| Backend / Auth / base | Aucun au MVP (ADR-APP-09) ; Supabase ou API maison à chiffrer avant R5/R6 | 0 € au MVP |

### Récapitulatif des choix build / CI / hébergement

| Sujet | Choix | Écarté |
|---|---|---|
| Paquets / runtime | pnpm 10 + Node 24 LTS épinglés, scripts d'install en liste blanche, Dependabot | npm, Yarn, Bun |
| Qualité | ESLint 9 flat + typescript-eslint + Prettier + `tsc`, hooks légers (simple-git-hooks, lint-staged, commitlint) | Biome, Husky/pas de hooks, dprint/Standard |
| CI | GitHub Actions, jobs parallèles, actions épinglées par SHA, slots `e2e` (qa) et `security` (secdevops), `ci-ok` | job unique, GitLab/CircleCI/Jenkins, tags mobiles, Turborepo/Nx |
| Assets | Git LFS pour binaires > 1 Mo, `check-assets` sur budgets TA + licences | binaires dans Git, bucket externe, dépôt séparé |
| Conteneurs | Aucun pour l'app ; image Playwright épinglée pour E2E (compose + CI) ; FPS réels mesurés hors CI | devcontainer complet, nginx dès le MVP, Playwright nu |
| Hébergement | Cloudflare Pages + `_headers` + CSP stricte (sans `unsafe-eval`), déploiement CI sur ordre du PO | GitHub Pages (pas d'en-têtes), Netlify (repli), Vercel, VPS/S3 |
| Branches / release | trunk-based, `feature/*` + `--no-ff`, previews par PR, tags semver + CHANGELOG, prod sur ordre du PO | GitFlow, commits directs/squash, CD automatique, release-please |

### Points à valider par le PO avant l'initialisation du repo
1. Stack et hébergement proposés (GitHub + Cloudflare Pages), dépôt public ou privé (impacte protections de branche, CodeQL et minutes de CI).
2. Création du dépôt distant et du compte Cloudflare (non faits ; aucun push ni déploiement avant accord).
3. Domaine personnalisé : oui/non (coût ~10 €/an).

### Décisions du PO (2026-10-19) — statut des ADR : Accepté

| ADR | Statut | Date |
|---|---|---|
| ADR-3D-01 à ADR-3D-09 | Accepté | 2026-10-19 |
| ADR-APP-01 à ADR-APP-09 | Accepté | 2026-10-19 |
| ADR-APP-10 | Accepté (2026-10-20, revue US-003 APPROVE) | 2026-10-20 |
| ADR-APP-11 | Accepté (2026-10-20, revue US-004 APPROVE) | 2026-10-20 |
| ADR-OPS-01 à ADR-OPS-07 | Accepté | 2026-10-19 |

- **Hébergement du code** : GitHub, dépôt **public** (Actions illimité, CodeQL, rulesets avec `ci-ok` obligatoire possibles). Le dépôt distant n'est **pas encore créé** : création et premier push uniquement sur ordre explicite du PO.
- **Hébergement de l'app** : Cloudflare Pages (`*.pages.dev`), **pas de domaine personnalisé** pour l'instant. Aucun déploiement avant ordre du PO (`deploy.yml` absent).
- **Taille d'écran minimale supportée** : 1366×768 (desktop). Les budgets de perf et la QA se calent dessus.
- **Dépôt public** : aucun secret ni donnée personnelle dans l'historique ; `.env` ignoré, `.env.example` documenté.
- **Écart d'implémentation (US-001)** : `eslint-plugin-boundaries`, `eslint-plugin-i18next` et `commitlint` seront ajoutés avec les premières règles réelles (US-005) *(mise à jour US-003 : frontières de couches et texte en dur appliqués par des règles ESLint natives, voir ADR-APP-10 ; les deux plugins ne sont plus nécessaires pour l'instant ; `eslint-plugin-i18next/no-literal-string` reste une option de US-005 pour couvrir les limites de la règle texte en dur)* ; en attendant, ESLint recommended + react-hooks + jsx-a11y + no-eval, et `scripts/commit-msg.mjs` pour Conventional Commits. Versions d'outils choisies : ESLint 9.39, TypeScript 5.9, Vite 7, Vitest 4.1 (4.1.12 depuis la revue US-001 ; dernières majeures compatibles avec les ADR ; ESLint 10 / TS 7 / Vite 8 existent mais ne sont pas retenus).
