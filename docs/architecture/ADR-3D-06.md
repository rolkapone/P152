# ADR-3D-06 — Moteur de règles « ça rentre ? » : fonctions pures 2,5D dans `core/fit`

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


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
