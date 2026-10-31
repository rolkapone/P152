# ADR-3D-05 — Matériaux et styles : bibliothèque de matériaux en données, slots par objet, presets déclaratifs

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


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
