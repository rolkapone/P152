# ADR-APP-09 — Backend futur sans réécriture : ports et adapters, offline-first

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** MVP sans backend (H2). Plus tard : sauvegarde cloud et comptes (R6), partage et galerie (R6), catalogue de produits réels et prix (R5), import photo → 3D par IA (R7, clé d'API et calcul côté serveur obligatoires). Il faut que ces évolutions s'ajoutent sans toucher au cœur ni à l'UI existante. **Aucun choix de fournisseur n'est engagé aujourd'hui.**

**Décision.**
- **Ports** (interfaces TS dans `core/ports`, asynchrones, retour `Result`) définis dès le MVP pour ceux qui ont un adapter, et réservés pour les autres :

| Port | MVP | Futur |
|---|---|---|
| `SetupRepository` (load/save/list/delete) | `localStorage` | IndexedDB (R4/R7), cloud synchronisé (R6) |
| `CatalogSource` (types d'objets, bureaux, matériaux) | JSON statiques du TA, embarqués | + catalogue distant versionné (R4/R5) |
| `ProductCatalog` (produits réels, prix) | — | R5 : API en lecture seule ou JSON publié |
| `ShareService` (publier/lire un setup partagé) | — | R6 : lien vers un setup serveur ; option sans serveur : JSON compressé dans le fragment `#` de l'URL |
| `AuthService` | — | R6 |
| `AssetStorage` / `ModelImportService` | — | R7 : upload, file de traitement asynchrone, statut |

- **Composition** : `app/services.ts` choisit les adapters (selon la configuration de build/environnement) et les fournit par un contexte React ; aucun composant n'importe un adapter directement. Pas de lib d'injection de dépendances.
- **Offline-first** : les ids (UUID) et `updatedAt` sont déjà générés côté client ; R6 ajoutera `revision` et un `ownerId` au schéma (migration v1 → v2) et une synchronisation « local d'abord, puis envoi », le local restant la source en cas d'échec réseau.
- **Validation partagée** : `core/schema` + `core/io` (purs) seront extraits en package et exécutés **aussi côté serveur** : le serveur ne fait jamais confiance au client (mêmes limites de taille, même schéma, mêmes bornes).
- **Options envisagées** (à départager par un spike avant R5/R6, nouvel ADR à ce moment-là) :
  - **Supabase** (Postgres + Auth + Storage + Row Level Security + Edge Functions) : démarrage très rapide pour comptes, setups (JSONB), galerie et stockage d'images ; Postgres standard, donc sortie possible. Risques : dépendance au fournisseur pour Auth/RLS, règles RLS à auditer (secdevops).
  - **API maison** (Node + Fastify ou Hono, Postgres, stockage objet S3-compatible, OpenAPI générée depuis les schémas Zod) : contrôle total et même langage que le front ; coût d'exploitation, d'auth et de sécurité entièrement à notre charge.
  - **Sans serveur pour le partage** (fragment d'URL compressé) : couvrirait un partage simple en lecture sans aucun hébergement de données, avec le même pipeline `parseSetup` à l'ouverture.
  - Écartés a priori : **Firebase/Firestore** (NoSQL propriétaire, requêtes de galerie et migrations de schéma moins naturelles, sortie coûteuse) ; **appel direct d'une API d'IA depuis le navigateur** pour R7 (exposerait la clé d'API et les quotas : traitement obligatoirement côté serveur).
- Sécurité anticipée (à intégrer au threat model avant R6/R7) : secrets uniquement côté serveur, CORS restreint, quotas et limites de taille d'upload, modération des contenus partagés, RGPD (export/suppression du compte), CSP mise à jour pour les domaines d'API.

**Conséquences.**
- (+) Ajouter le cloud ou le partage = écrire un adapter + des écrans ; ni `core`, ni `state`, ni les écrans existants ne changent.
- (+) L'app reste utilisable hors ligne et sans compte, même après R6.
- (−) Quelques interfaces définies avant d'avoir leur implémentation : on se limite aux ports dont la forme est claire (`SetupRepository`, `CatalogSource`) ; les autres ne sont que réservés dans ce tableau, pas codés.

**Alternatives écartées.**
1. **Introduire un backend dès le MVP « pour préparer l'avenir »** : contraire à la décision PO (H2), ajoute hébergement, auth et surface d'attaque sans valeur utilisateur au MVP.
2. **Appels de stockage directs dans les composants/stores (pas d'abstraction)** : le passage au cloud imposerait de reprendre chaque écran et chaque test ; c'est la réécriture qu'on veut éviter.
3. **Choisir le fournisseur (Supabase ou autre) dès maintenant** : décision prématurée, les besoins R5 (source des prix) et R7 (coût de l'IA) sont encore inconnus.
