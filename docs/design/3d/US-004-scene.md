# US-004 - Scène de base : fiche pour le graphics-engineer

Source unique de valeurs : `assets/catalog/scene/studio.json` (tout procédural, aucun asset externe, aucune licence à consigner). Référence visuelle validée par le PO : `apercu/index.html`.

- **Bureau** : `desk.rect` preset standard 1400x700x740 mm, plateau 25 mm (arête 9 mm), bouleau + métal noir, 4 pieds + traverse arrière ; centré sur l'origine, Y=0 au sol, ~1500 tris.
- **Studio** : cyclo sans couture (rayon 1,5 m), fond `#e8e8ea` (clair) / `#1c1e22` (sombre), brouillard 9-20 m, ombres de contact (opacité 0,42) sous le bureau ; clé 2,4 / remplissage 0,55 / rim 1,1 + hémisphère 0,35 ; environnement PMREM procédural (pièce + 4 softboxes) ; `NeutralToneMapping`, exposition 1.
- **Ombres** : VSM, `autoUpdate=false` (recalcul sur changement), shadow map 2048 / 1024 / 512 pour high (desktop) / medium (mobile) / low ; DPR max 2 / 1,5 / 1,25.
- **Caméra** : FOV 32, reset (1,75; 1,5; 2,7) vers (0; 0,72; 0) ; Top (0; 3,4; 0) ; Front (0; 1,1; 3,3). Distance 0,8-4,5 m, polaire 0-89 deg, azimut +-109 deg, pan borné (x +-1, y 0,5-1,1, z +-0,8), caméra jamais sous Y=0,9 ni dans le bureau (boîte + 100 mm). Transition 480 ms in-out, saut direct si `prefers-reduced-motion`.
- **Écarts à connaître** : l'aperçu utilisait 950 ms et une cible décalée (-0,08) pour son décor complet ; ici cible centrée sur le bureau seul. Les couleurs `--scene-*` des tokens servent aux surcouches 2D, les couleurs 3D du studio viennent de ce JSON.
