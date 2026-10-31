# ADR-3D-02 — Modèle de données du setup : JSON versionné, en mm, séparé du rendu

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** Le setup doit être sauvegardé localement, exporté/importé (fichier = surface d'attaque), migré entre versions, et porter dès maintenant les besoins futurs : matériaux par slot (R2), style/éclairage (R3), objets montés et déco (R3/R4), produit réel (R5), partage (R6), modèles importés (R7).

**Décision.** Un document JSON `Setup` validé par schéma (préférence : **Zod** côté `core/schema`, d'où l'on dérive types TS et JSON Schema publiable), indépendant de three.js :

```jsonc
{
  "format": "p152.setup",
  "schemaVersion": 1,            // entier, incrémenté à chaque changement cassant
  "id": "uuid", "name": "My setup",
  "createdAt": "ISO", "updatedAt": "ISO",
  "units": "mm",
  "desk": {
    "catalogId": "desk.rect", "catalogVersion": 1,
    "params": { "width": 1400, "depth": 700, "height": 740 },  // L-shape : params dédiés
    "materials": {}             // surcharges par slot (top, legs), ajout US-003 (ADR-APP-10)
  },
  "objects": [{
    "id": "uuid", "type": "monitor", "catalogId": "monitor.generic", "catalogVersion": 1,
    "params": { "diagonalIn": 27, "ratio": "16:9", "stand": true, "curved": false },
    "transform": { "x": 0, "z": -150, "rotationY": 0 },          // mm / degrés, repère plateau
    "mount": null,              // ex. { "parentId": "<arm-id>", "socket": "vesa" } (écran sur bras)
    "materials": {},            // R2 : { "<slot>": "<materialId>" } ; vide = défaut du type
    "product": null,            // R5 : référence produit réel
    "label": null               // nom personnalisé optionnel
  }],
  "environment": { "stylePreset": null, "lighting": "neutral", "room": null },  // R2/R3
  "alertSettings": { "occupancyMax": 0.7, "depthMarginMm": 100, "keyboardClearanceMm": 150 },
  "extensions": {}              // espace réservé, ignoré si inconnu
}
```

- **Migrations** : chaîne de fonctions pures `migrate_v1_to_v2`, … appliquées à la lecture (localStorage et import). Donnée invalide après migration → rejet avec message, jamais de plantage (US-018).
- **Import sécurisé** : taille max du fichier (ex. 1 Mo), nombre max d'objets (50), bornes numériques du catalogue réappliquées, chaînes bornées, aucun champ interprété comme code/URL au MVP.
- Le setup ne contient **aucune géométrie ni matériau three.js** : uniquement des références au catalogue + paramètres. Le rendu se reconstruit toujours depuis cette donnée.

**Conséquences.**
- (+) Sauvegarde, export, partage (R6), undo/redo (snapshots ou patches de la même donnée) et tests utilisent un seul format, lisible et diffable.
- (+) Les règles « ça rentre ? » consomment la même donnée, sans scène.
- (−) Toute évolution du schéma exige une migration + tests de non-régression (fixtures de chaque version conservées dans `tests/fixtures/setups/`).
- (−) `catalogVersion` oblige à garder les anciennes définitions de catalogue (ou une migration) quand le TA change un type.

**Alternatives écartées.**
1. **Sauvegarder la scène three.js (`Object3D.toJSON`) ou un glTF de la scène** : mélange rendu et métier, lourd (géométries embarquées), non versionnable sémantiquement, impossible à migrer proprement ; un import pourrait injecter des géométries arbitraires.
2. **Format binaire (Protobuf/FlatBuffers/CBOR)** : gain de taille inutile à 50 objets, illisible pour le debug et l'utilisateur avancé, outillage supplémentaire. Réévaluable pour les liens de partage (R6) via compression du JSON.
3. **Positions en mètres dans les données** : flottants peu lisibles (0.7400000001), contraire à la convention catalogue en mm et aux libellés UI en mm.
