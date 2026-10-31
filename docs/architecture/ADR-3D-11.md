# ADR-3D-11 — Distance de la caméra selon le bureau et espace du studio (US-006, risque R11)

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


> Statut : **Accepté** (revue US-006 APPROVE, 2026-10-31 ; proposé par graphics-engineer). Complète ADR-3D-10 (borne de distance fixe 0,8–7 m).

**Contexte.** Les bureaux de US-006 vont jusqu'à 180 × 160 cm (angle). Dans la plus petite fenêtre à volets ouverts (1024 px de large, barre d'outils 53 px, volets 248 et 312 px), le cadrage demande jusqu'à 8,2 m (Reset, 1024 × 768). La borne fixe de 7 m coupait ce cadrage ; la monter au-delà d'environ 8 m laissait la caméra atteindre le mur courbe du fond aux angles latéraux (azimut ±109°), ou passer sous son sol qui remonte.

**Décision.**
- **Aucun changement du décor** (`studio.json`, DA validée) : ni cyclo plus profond, ni plus large, ni brouillard modifié.
- **Distance maximale par bureau** (`deskMaxDistance`, `render/math/camera.ts`) : la borne du catalogue (7 m), ou plus pour un grand bureau : 1,1 × la distance de cadrage la plus grande des vues Reset / Top / Front dans les fenêtres de référence 1024 × 640 et 1024 × 768 à volets ouverts (`REFERENCE_ZONES`, `framing.ts`). Mesuré : 7 m jusqu'au 160 × 80, 8,97 m pour l'angle 180 × 160 (boîte englobante ; l'enveloppe réelle du L, US-006 T2, réduit un peu ce chiffre). Une fenêtre plus étroite ou plus haute que la référence relève la borne à son propre cadrage (`ViewRig.frameView`) : une vue n'est jamais coupée par la borne.
- **Espace du studio pour la caméra** (`studioKeepIn`, `maxRadiusInStudio`), dérivé du cyclo avec un dégagement de 0,3 m : devant le mur et assez haut au-dessus de son sol courbe (z ≥ −2,8 m : mur à −3,1 m ; à −2,8 m le sol courbe atteint 0,6 m = hauteur minimale 0,9 − 0,3), sur le sol vers l'avant (z ≤ `floorEndZ` − 0,3) et sur les côtés. Pour chaque pose, la distance est bornée par le point où la direction de la caméra quitte cet espace : tourner vers le fond en vue éloignée rapproche la caméra, comme un mur réel. Appliqué dans `clampPose` (commandes, vues) et avant chaque image dans `ViewRig.frame` (glisser, molette), comme la limite d'inclinaison liée à la hauteur.
- Les vues des 7 bureaux restent loin de ces limites (Reset à 33° d'azimut, Front à 0°, Top d'en haut) : le cadrage n'est jamais réduit par le studio dans les fenêtres de référence (test).

**Conséquences.**
- (+) Le plus grand bureau tient à 1024 px volets ouverts avec 10 % de marge de recul ; la caméra ne traverse jamais le décor, quelle que soit la pose (propriété fast-check, graine fixe, `maxDistance.test.ts`) ; aucun pixel du décor ne change.
- (+) Les bornes suivront les tailles libres de US-007 sans nouvelle décision (2400 × 1000 : environ 9,7 m).
- (−) Recul maximal au-delà de 9 m pour l'angle 180 × 160 : le brouillard linéaire (début à 9 m) teinte au plus quelques % de l'arrière du bureau, seulement en recul maximal ; jamais dans les vues cadrées à 1366 × 768 (4,7 m).
- (−) Tourner vers le fond en vue très éloignée rapproche la caméra (au-delà d'environ 6 m de recul à ±109°) : perceptible seulement avec les grands bureaux.

**Alternatives écartées.**
1. **Cyclo plus profond ou plus large** : change la composition validée par le PO (mur plus loin derrière le bureau, plus de sol visible), demande une nouvelle validation du technical-artist et du PO, et ne règle pas les tailles libres suivantes.
2. **Borne fixe plus haute (9 à 10 m)** : la caméra traverse le mur aux angles latéraux.
3. **Limiter l'azimut selon la distance** : même garantie, mais la rotation s'arrêterait plus tôt sans raison visible ; borner la distance est l'effet naturel d'un mur.
4. **Élargir le champ de vision** : déforme la perspective validée (32°).

À vérifier par le technical-artist : rien dans `studio.json` ; seulement l'aspect du bureau 180 × 160 en recul maximal (brouillard) lors du contrôle QA.
