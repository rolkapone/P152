# ADR-3D-04 — Format d'assets : glTF 2.0 (GLB) + meshopt, textures KTX2, pipeline gltf-transform

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


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
