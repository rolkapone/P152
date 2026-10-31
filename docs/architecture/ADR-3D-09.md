# ADR-3D-09 — Chemin vers WebXR (AR mobile, R8)

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


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
