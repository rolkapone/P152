# Licences des assets — P152

Règle : **aucun asset sans licence claire compatible avec une publication** (CC0 de préférence). Toute ligne ajoutée ici avant le commit de l'asset ; la CI échoue sinon (ADR-3D-04). Aucun logo ni design de produit protégé.

## Assets livrés dans le dépôt

| Asset | Type | Auteur | Source | Licence | Poids | Lien |
|---|---|---|---|---|---|---|
| Objets procéduraux du MVP (bureau + 9 types) | géométrie générée en code | Équipe P152 | Code du projet | Propriété du projet | 0 Ko (aucun fichier) | `assets/catalog/object-types/` |
| Bibliothèque de matériaux, presets de style | données JSON | Équipe P152 | Original | Propriété du projet | < 12 Ko | `assets/catalog/materials/`, `assets/catalog/styles/` |
| Papier peint d'écran | texture canvas générée à l'exécution | Équipe P152 | Original | Propriété du projet | 0 Ko | `docs/design/3d/apercu/index.html` |

Aucun binaire 3D (GLB, texture, HDRI) n'est téléchargé ni commité à ce stade.

## Police et icônes de l'interface (US-005, design-system §4 et §6)

| Composant | Version | Licence | Source exacte | Fichiers livrés |
|---|---|---|---|---|
| Inter (© The Inter Project Authors, https://github.com/rsms/inter) | 4.1 | SIL Open Font License 1.1 | Release officielle `https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip` (SHA-256 relevé le 2026-10-30 : `9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e` ; **aucune empreinte publiée** par le projet pour cette release, champ `digest` vide dans l'API GitHub), fichier `web/InterVariable.woff2` (SHA-256 `693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3`) | `public/fonts/inter-latin-wght-normal.woff2` (69 Ko, SHA-256 `86aa7097d4f5d752167fe0a22136fd2d72720f73d048ef0ef9d6e0a91364fe1b`) + `public/fonts/OFL.txt` (`LICENSE.txt` de la release, inchangé) |

**Inter, modification** : sous-ensemble seulement, non renommée (nom interne « Inter Variable » conservé), non vendue seule. Axe `opsz` figé à 14 (coupe texte), axe `wght` 100-900 conservé, plage Unicode latine identique à l'`unicode-range` du `@font-face` (`src/ui/styles/fonts.css`), toutes les fonctions OpenType conservées (`kern`, `calt`, `ss03`, `tnum`, `cv11`, `ss01`…), table `name` complète (copyright). Outil : fontTools 4.67.0 + brotli 1.2.0 (MIT, pip) dans un conteneur jetable `python:3.13-slim` (`sha256:2d44738ebf4ce5f63b9d9ea871e9c7cfdc0426f7b0c97cac915fd88ded1d86bb`), sans accès au dépôt :
`fonttools varLib.instancer InterVariable.woff2 opsz=14 -o inter-wght.ttf` puis
`pyftsubset inter-wght.ttf --unicodes=<unicode-range du @font-face> --layout-features=* --name-IDs=* --name-legacy --name-languages=* --notdef-outline --flavor=woff2 --output-file=inter-latin-wght-normal.woff2`.
Le symbole « ≈ » n'est pas dans le sous-ensemble (design-system §4). Le SHA-256 du fichier livré est vérifié par `tests/unit/fonts.test.ts`.

## Dépendances logicielles de l'application (redistribuées dans le bundle)

| Composant | Version | Licence | Source |
|---|---|---|---|
| lucide-react | 1.61.0 | ISC | npm `lucide-react` (publiée le 2026-10-21), © Lucide Icons and Contributors ; licence reproduite dans `THIRD_PARTY_LICENSES.md` à la racine du build (option `build.license` de Vite, toutes les dépendances embarquées) |

## Dépendances logicielles de l'aperçu (non redistribuées)

| Composant | Version | Licence | Source |
|---|---|---|---|
| three.js (+ `OrbitControls`, `RoundedBoxGeometry`, `RoomEnvironment` des addons) | 0.170.0 | MIT | https://cdn.jsdelivr.net/npm/three@0.170.0/ (npm `three`) |

## Candidats futurs (aucun téléchargé, licence à vérifier sur la page de l'asset au moment du choix)

| Besoin | Release | Source pressentie | Licence attendue |
|---|---|---|---|
| HDRI studio 1k | R3 | Poly Haven — https://polyhaven.com/hdris | CC0 |
| Textures bois / tissu / métal 1k | R2 | ambientCG — https://ambientcg.com ; Poly Haven — https://polyhaven.com/textures | CC0 |
| Déco (plantes, étagères, cadres) | R4 | Kenney — https://kenney.nl/assets ; Quaternius — https://quaternius.com ; Poly Haven models | CC0 |

Avant d'ajouter un candidat : relever auteur, URL exacte, licence (copie du texte ou capture), date de relevé, poids avant/après optimisation ; refuser tout CC-BY-NC, CC-BY-ND, licence « usage éditorial » ou à redistribution restreinte. CC-BY n'est acceptable qu'avec une page de crédits dans l'application.
