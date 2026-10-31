# ADR-3D-08 — Performance : rendu à la demande, budgets chiffrés, paliers de qualité

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


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
