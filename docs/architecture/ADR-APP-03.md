# ADR-APP-03 — Validation, migration et import non fiable du setup : Zod (mode jitless) + pipeline unique

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** Le setup est lu depuis trois sources non maîtrisées : le stockage local (peut être corrompu, d'une ancienne version, modifié à la main), un **fichier importé** (non fiable, surface d'attaque de US-002), et plus tard un lien de partage ou une API (R6). ADR-3D-02 fixe le format et la migration ; reste à fixer l'outil et le pipeline.

**Décision.**
- **Zod** (v4) dans `core/schema` : un schéma par version publiée (`SetupV1`, `SetupV2`…), types TS dérivés (`z.infer`), JSON Schema exporté pour la doc. Configuration **`jitless`** pour ne jamais générer de code (`new Function`) : compatible avec une CSP sans `unsafe-eval`.
- **Pipeline unique** `parseSetup(raw: string, source) → Result<Setup, ImportError>` dans `core/io`, utilisé par le stockage local, l'import et les tests :
  1. **Taille** : refus au-delà de **1 Mio** (vérifié sur `File.size` **avant** lecture, puis sur la longueur de la chaîne).
  2. `JSON.parse` (sans reviver), erreur → `ImportError.notJson`.
  3. **Enveloppe** : `format === "p152.setup"`, `schemaVersion` entier ; version > courante → `ImportError.newerVersion` (« This file was made with a newer version of P152 ») ; version inconnue/inférieure au minimum supporté → refus.
  4. **Migrations** pures `vN → vN+1` appliquées en chaîne (fixtures de chaque version dans `tests/fixtures/setups/`).
  5. **Validation stricte** Zod : objets `.strict()` (clé inconnue = rejet, sauf sous `extensions`, ignoré et non interprété), nombres `finite` et bornés, entiers où attendu, chaînes bornées (nom ≤ 80 caractères, ids au format UUID), énumérations fermées, tableau `objects` ≤ **50**, profondeur limitée de fait par le schéma. Clés `__proto__`, `constructor`, `prototype` rejetées partout (pas de pollution de prototype lors des fusions).
  6. **Validation sémantique** contre le catalogue : `catalogId` connu, paramètres dans les bornes du catalogue (rejet, pas de clamp silencieux, pour que l'utilisateur sache ce qui a changé), ids uniques, `mount.parentId` existant et sans cycle, `materialId` connus (R2).
  7. Normalisation (ordre des clés, valeurs par défaut du catalogue pour les paramètres absents optionnels).
- Les erreurs exposent un **code** + un chemin JSON tronqué, traduits par l'UI (« The file isn't a valid P152 setup (objects[3].params.width) ») ; jamais de pile d'exception ni de contenu du fichier réaffiché tel quel.
- Aucune donnée importée n'est interprétée comme HTML, URL ou code : rendu par React (texte échappé), aucun `dangerouslySetInnerHTML` (règle de lint), aucun champ URL accepté au MVP. Les champs URL futurs (R5 produits, R7 modèles) seront validés par liste blanche de domaines côté schéma.

**Conséquences.**
- (+) Une seule implémentation de la confiance, testée une fois (y compris par fuzzing, ADR-APP-08) pour toutes les sources, réutilisable côté serveur (R6).
- (+) Les messages d'erreur sont prévisibles et traduisibles.
- (−) Un schéma Zod par version à conserver (en lecture seule) tant que la version est migrable.
- (−) Zod v4 complet ≈ 15-20 Ko gz ; acceptable (le mini-build `zod/mini` reste une option si le budget JS le demande).

**Alternatives écartées.**
1. **Ajv + JSON Schema** : très rapide, mais compile les validateurs avec `new Function` (exige `unsafe-eval` ou une précompilation au build), types TS à maintenir séparément.
2. **Valibot** : plus léger et bien conçu, mais écosystème et familiarité moindres ; même modèle mental que Zod, donc bascule possible plus tard si le poids devient critique.
3. **Validation manuelle (type guards écrits à la main)** : pas de types dérivés, oublis probables sur un format qui va évoluer à chaque release ; inacceptable pour une surface d'attaque.
