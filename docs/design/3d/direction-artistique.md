# Direction artistique 3D — P152

> Auteur : technical-artist, kickoff 2026-10-19. À valider par le PO (aperçu : `docs/design/3d/apercu/index.html`).
> Cadre technique : ADR-3D-03 (procédural piloté par catalogue), ADR-3D-05 (matériaux/styles en données), ADR-3D-08 (budgets). UI en anglais, neutre vis-à-vis des marques.

## 1. Intention
Le principe UX n°3 dit « le chiffre rassure plus que le joli » : la scène doit d'abord être **lisible et juste** (proportions et dimensions réelles), puis **belle**. Cible : un rendu **réaliste doux, type photo produit en studio**, jamais cartoon (sauf décision contraire du PO). Des objets simples mais crédibles, qui donnent envie de « monter son setup ».

Trois leviers font un setup « beau » à budget quasi nul (aucune texture au MVP) :
1. **Arêtes biseautées** : tout volume a un rayon de 1 à 6 mm (clavier 5, boîtier 8, écran 4, tapis 8 mm en plan). Le reflet sur l'arête est le signal de réalisme n°1.
2. **Ombres douces de contact** sous chaque objet : sans elles, les objets flottent.
3. **Matières contrastées** à l'intérieur d'une palette courte : mat vs satiné vs métal brossé vs feutrine, jamais deux noirs identiques côte à côte (noir mat 0.78 de rugosité vs graphite 0.70 vs métal noir).

## 2. Formes des objets génériques (MVP)
- **Proportions réelles au mm** (valeurs du catalogue, `docs/design/3d/assets-mvp.md`) ; la forme ne trahit jamais une cote affichée.
- Formes primitives arrondies (`RoundedBox`, extrusion, lathe, tore) ; **aucun détail qui ne se voit pas à 1,5 m** de distance caméra.
- **Aucun logo, aucun texte, aucune marque** : touches de clavier sans légendes, écrans avec un papier peint abstrait (dégradé + deux fenêtres translucides), manette générique (silhouette ni console ni marque connue), pas de forme iconique d'un produit protégé.
- Détails « crédibles » retenus : touches coniques, rebord d'écran de 7 mm avec bosse arrière, pied large du moniteur ou bras avec clamp visible, aération maillée en façade du boîtier, vitre fumée avec ventilateurs LED visibles, cônes de haut-parleur (woofer + tweeter), molette de souris.
- Un objet = **1 à 5 draw calls** (une géométrie fusionnée par slot matière, instanciation pour les touches).

## 3. Lumière et ambiance (éclairage de référence « neutral ») *(valeurs v2 : §10 et `styles.json` bloc `studio`)*
Rendu studio, trois sources, toutes en données (preset d'éclairage `lighting`, ADR-3D-05) :

| Source | Réglage de référence |
|---|---|
| Clé : `DirectionalLight` ombrée | blanc chaud `#fff4e6`, intensité 2.6, position (1.6, 3.0, 2.0) m, haut-droit-avant, shadow map 2048 (desktop) / 1024 (mobile), frustum ajusté au bureau (±1.8 m), `PCFSoft`, `normalBias` 0.02 |
| Remplissage : `DirectionalLight` sans ombre | blanc froid `#dfe8ff`, intensité 0.5, côté gauche |
| Ambiance : environnement `RoomEnvironment` (aucun fichier) + `HemisphereLight` | `environmentIntensity` 0.6, hémisphère 0.5 |

- **Tone mapping** : `NeutralToneMapping` (rend les couleurs de matériaux fidèles, pas de virage de teinte) ; exposition 1.0 par défaut. À reconfirmer face à AgX lors du spike R3.
- **Ombres** : recalcul uniquement quand la scène change (`shadowMap.autoUpdate = false`, ADR-3D-08). Contact shadows dédiées envisagées en R3.
- **Sol et fond** (remplacé par la cyclo et le studio v2, voir §10) : pas de pièce au MVP. Une **cyclo de studio** : disque de sol (rayon 6 m, rugosité 0.95) dont la couleur est proche du fond, brouillard linéaire de la couleur du fond (4.5 → 8.5 m) qui efface l'horizon. Le sol est légèrement plus sombre que le fond pour que les ombres se lisent. Murs, fenêtre, jour/soir : R3.
- **Lampe et LED** : matériaux émissifs ; la lampe de bureau peut émettre un `PointLight` chaud (style cosy). Le bloom sélectif est R3.

## 4. Palette
Principe : **teintes neutres et peu saturées par défaut**, accents réservés aux presets. Ceci laisse de la place aux surcouches d'interface dans la scène (contour de survol/sélection, hachures d'alerte, cotes) qui doivent rester lisibles à ≥ 3:1 sur le sol et sur le bureau, clairs comme sombres (principes UX, accessibilité).

| Rôle | Valeur | Remarque |
|---|---|---|
| Fond / sol « neutral » | `#e9e7e2` / `#dedbd4` | gris chaud clair, ne dispute pas les objets |
| Bureau par défaut | bouleau `#e4cfa6` + métal noir `#2a2d31` | |
| Objets par défaut | noir mat `#202226`, graphite `#3b3f45`, gris clair `#c7c9cc`, touches blanc chaud `#f1ede2` | |
| Accents de style | corail `#e5694f`, sarcelle `#2b9a8c`, moutarde `#e2b23a`, bleu ciel `#5f9fd6`, terre cuite `#bf6a4a` | uniquement via presets |
| LED | blanc chaud, ambre, violet, cyan | émissifs, jamais saturés à pleine intensité sur de grandes surfaces |

Cohérence avec le design system : le ui-designer n'a pas encore publié ses tokens (`docs/design/ui/` absent à ce jour). Dès qu'ils existent : (a) vérifier que le fond « neutral » s'accorde à la surface du viewport, (b) lui fournir les couleurs réelles des fonds de scène pour valider les contrastes de contour de sélection. **Question ouverte au ui-designer** : couleur de contour de sélection et d'alerte, pour tester sur les 4 fonds de styles.

## 5. Matières (bibliothèque initiale)
`assets/catalog/materials/materials.json` (28 matériaux, couleurs plates au MVP, clés `textures` réservées aux KTX2 de R2+) :
- Plastiques : noir mat, graphite, blanc satiné, blanc chaud, gris clair.
- Métaux : aluminium brossé, métal noir.
- Bois (couleur seule, textures CC0 ensuite) : chêne, noyer, bouleau.
- Textiles/caoutchouc : feutrine gris / sombre / claire / sauge, caoutchouc noir.
- Verre fumé, écran allumé (texture de papier peint générée en canvas, jamais un fichier).
- Accents : corail, sarcelle, moutarde, bleu ciel, terre cuite ; LED blanc, ambre, violet, cyan ; déco : feuille, céramique terre cuite.

Règles : une instance de matériau partagée par `materialId` ; `metalness` ∈ {0, 0.85, 1} (pas de valeurs intermédiaires « sales ») ; rugosité jamais < 0.35 hors verre/écran (évite les reflets plastique bon marché sous environnement pauvre).

## 6. Presets de style (premiers, en données)
`assets/catalog/styles/styles.json`. Un preset est une règle `rôle → matériau`, avec surcharges par type, plus une ambiance. L'application ne change ni positions ni paramètres. Cascade : surcharge objet > preset (`byType` > `byRole`) > défaut du type.

| Preset | Idée | Fond | Éclairage |
|---|---|---|---|
| `style.all-white` | tout blanc satiné, feutrine claire, LED blanches | `#ecebe8` | neutre doux, clé 2.6 |
| `style.all-black` | noir mat + métal noir, feutrine sombre | `#3a3d43` | clé plus froide, 3.0, env 0.7 |
| `style.colorful` | plateau bouleau, pieds sarcelle, accents corail/moutarde/bleu, enceintes bleu ciel | `#f2ece3` | neutre chaud |
| `style.cosy` | plateau chêne, noyer pour enceintes/lampe, terre cuite, feutrine sauge ; lampe allumée ; plante suggérée | `#6b5848` | clé ambre 1.7, env 0.35, `PointLight` de lampe |

Le MVP n'expose pas les styles à l'utilisateur ; l'aperçu les montre pour valider la direction et prouver que le système tient avec les mêmes objets.

## 7. Budgets rappelés (ADR-3D-08)
- Scène de référence (bureau + 20 objets) : ≤ 150 draw calls / 300 k triangles desktop, ≤ 80 / 150 k mobile. Les objets du MVP consomment **~2 500 triangles et 1 à 5 draw calls** chacun au maximum ; 20 objets ≈ 50 k triangles : large marge.
- Aucun asset binaire au MVP (poids réseau 3D quasi nul). Futurs GLB : < 300 Ko compressés par objet, textures ≤ 1024 px (2048 px pièces maîtresses), meshopt + KTX2.

## 8. Anti-patterns (à refuser en revue)
Couleur en dur dans un composant de rendu ; arêtes vives sur un volume ; objet posé sans ombre ; légende ou logo sur un objet ; teinte saturée sur une grande surface par défaut ; matériau unique appliqué à tous les rôles d'un objet (aplat illisible) ; détails < 2 mm modélisés en géométrie.

## 9. Évolutions prévues
R2 : exposition des matériaux par slot et des styles. R3 : éclairage jour/soir, bloom LED, ombres de contact, murs. R4 : déco CC0 (plantes, cadres, étagères), voir `licences-assets.md`. R7+ : photo vers 3D (ADR dédié le moment venu).

## 10. Rendu « photo produit en studio » (v2) et Inspiration et limites

**Rendu v2** (aperçu à jour, données dans `styles.json` bloc `studio` et `materials.json` v2) :
- **Cyclo sans couture** : sol qui se courbe en mur de fond (rayon 1,5 m), fond clair `#e8e8ea` par défaut, variante sombre `#1c1e22` (bascule « Backdrop »). Caméra limitée en azimut pour rester dans la cyclo.
- **Éclairage softbox** : clé (blanc chaud, 2.4, ombre douce VSM rayon 10), remplissage froid (0.55), contre-jour/rim (1.1) ; environnement **procédural** (pièce grise + 4 softboxes émissives passées au PMREM, aucun fichier) ; `NeutralToneMapping`, anti-aliasing natif.
- **Ombres de contact** : un dégradé doux sous chaque objet (pieds du bureau, boîtier, enceintes, clavier…), généré en code, 1 plan par objet. Le boîtier PC repose au sol sur 4 pieds caoutchouc de 8 mm, avec ombre de contact et halo d'occlusion (il ne flotte plus).
- **Arêtes** plus généreuses mais crédibles (bureau 9 mm, écran 6 mm, clavier 7,5 mm, boîtier 12 mm, enceintes 14 mm).
- **Matières raffinées** : aluminium anodisé (argent, graphite), plastique soft-touch (noir, blanc, reflet de feutre via `sheen`), verre clair (vernis `clearcoat`), tissu tissé (`sheen`). Le matériau physique n'est utilisé que là où il est nécessaire.
- **Mouvement** : Reset/Top/Front glissent le long d'un arc, amorti (smootherstep, 950 ms) ; un changement de style fond en 650 ms couleurs, rugosité, métal, émissif et ambiance. `prefers-reduced-motion` : bascule instantanée, sans amortissement. L'utilisateur reprend la main dès qu'il touche la scène.
- Budgets inchangés, compteurs draw calls / triangles toujours affichés.

**Inspiration et limites.** Le PO demande de s'inspirer du langage visuel des interfaces et des photos produit haut de gamme : épure, espace, neutres + une couleur d'accent, coins arrondis, ombres douces, verre dépoli, animations fluides. On reprend ces **principes**, jamais les œuvres : pas de police SF Pro ni d'icônes SF Symbols (Inter et Lucide, libres), pas de logo, pas de mise en page copiée, et côté 3D **aucune forme reconnaissable d'un produit protégé** (pas de moniteur monobloc sur pied incliné type tout-en-un, pas d'écran à pied caractéristique, pas de clavier à profil bas reconnaissable) : les objets restent génériques (moniteur plat sur bras ou pied simple, clavier standard). Test de revue : « si on retire le décor, un juriste reconnaîtrait-il un modèle précis ? » Si oui, on redessine.
