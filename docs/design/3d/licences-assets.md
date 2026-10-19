# Licences des assets — P152

Règle : **aucun asset sans licence claire compatible avec une publication** (CC0 de préférence). Toute ligne ajoutée ici avant le commit de l'asset ; la CI échoue sinon (ADR-3D-04). Aucun logo ni design de produit protégé.

## Assets livrés dans le dépôt

| Asset | Type | Auteur | Source | Licence | Poids | Lien |
|---|---|---|---|---|---|---|
| Objets procéduraux du MVP (bureau + 9 types) | géométrie générée en code | Équipe P152 | Code du projet | Propriété du projet | 0 Ko (aucun fichier) | `assets/catalog/object-types/` |
| Bibliothèque de matériaux, presets de style | données JSON | Équipe P152 | Original | Propriété du projet | < 12 Ko | `assets/catalog/materials/`, `assets/catalog/styles/` |
| Papier peint d'écran | texture canvas générée à l'exécution | Équipe P152 | Original | Propriété du projet | 0 Ko | `docs/design/3d/apercu/index.html` |

Aucun binaire (GLB, texture, HDRI) n'est téléchargé ni commité à ce stade.

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
