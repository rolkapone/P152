# ADR-3D-01 — Moteur 3D : three.js via React Three Fiber (+ drei)

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


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
