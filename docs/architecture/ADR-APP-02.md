# ADR-APP-02 — État : Zustand en trois stores, commandes pures, historique par snapshots immuables

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** Une seule voie de modification pour souris, clavier, champs, alertes, import et undo (ADR-3D-07). US-019 : 50 actions minimum, un drag = une action, boutons désactivés selon l'état. Le drag doit tourner à 60 FPS sans re-render React. Les actions doivent être annoncées aux lecteurs d'écran.

**Décision.**
- **Zustand** (store hors arbre React, abonnements par sélecteur), découpé en **trois stores** :
  - `documentStore` : le `Setup` courant (immuable, ADR-3D-02) + l'historique. **Seule source de vérité persistée.**
  - `sessionStore` : sélection, survol, onglet actif, panneaux repliés, modale ouverte, magnétisme on/off. Jamais dans l'historique ni dans l'export (la sélection n'est pas une donnée du setup).
  - `transientStore` : pose temporaire pendant un drag/rotation (lue par `render/` dans `useFrame`, sans re-render React).
- **Commandes** : objets sérialisables `{ type, payload }` (`addObject`, `moveObject`, `rotateObject`, `setObjectParams`, `setDesk`, `duplicateObject`, `removeObject`, `replaceSetup`, `setAlertSettings`, puis `applyStylePreset` en R2…). Chaque type a un **reducer pur** dans `core/commands` : `(setup, payload, catalog) → Result<Setup, CommandError>` (validation des bornes et du max de 50 objets **dans** le reducer, pas dans l'UI). Un `dispatch(command)` unique dans `state/` applique, empile et notifie.
- **Historique** : pile de **snapshots immuables** (`past[]`, `future[]`) ; grâce au partage structurel, un snapshot coûte une référence + les nœuds modifiés (un setup de 50 objets ≈ 30 Ko au pire). Chaque entrée porte un **libellé i18n** (`history.moveObject` + valeurs) réutilisé pour l'annonce `aria-live` et l'info-bulle « Undo Move monitor ». Limite **100 entrées** (> 50 exigées).
- **Coalescence** : `beginTransaction()` / `commit()` / `cancel()` ; un drag ou une rotation à la poignée n'écrit que dans `transientStore`, puis un seul `moveObject` au `pointerup` ; la saisie dans un champ numérique produit une entrée à la validation (blur/Entrée), et des commandes successives de même type sur le même objet en moins de 500 ms (flèches clavier) sont fusionnées.
- Les **alertes** sont un état **dérivé** : `evaluate(setup, catalog, settings)` (ADR-3D-06) recalculé par un sélecteur mémoïsé sur la référence du setup, jamais stocké.
- Undo/redo restaure aussi la sélection de l'entrée (méta `selectionAfter`) pour que l'utilisateur voie ce qui a changé.

**Conséquences.**
- (+) Undo/redo, autosave, recalcul des alertes et annonces sont des abonnements à une seule chose : le changement de référence du setup.
- (+) Les reducers sont purs, testables en Node, et réutilisables tels quels côté serveur plus tard (validation d'un setup partagé).
- (−) Il faut écrire un reducer par commande (au lieu de muter librement) ; c'est le prix d'un historique fiable.
- (−) Snapshots plutôt que patches : pas de diff transportable. Suffisant sans collaboration temps réel ; si R6 en introduit, passer à des patches (Immer `produceWithPatches`) sans changer l'API `dispatch`.

**Alternatives écartées.**
1. **Redux Toolkit** : modèle très proche (actions + reducers) mais plus verbeux, store pensé pour React-Redux ; l'accès hors React depuis `useFrame` est moins direct qu'avec Zustand. Rien qu'on n'obtienne déjà.
2. **`zundo` (middleware temporal de Zustand)** : snapshot automatique de tout changement d'état ; ne connaît ni la notion de commande, ni les libellés pour l'annonce, ni la coalescence d'un drag sans configuration fragile.
3. **Valtio / MobX (état mutable par proxy)** : mutations faciles mais snapshots et undo plus délicats, risque de mutations hors commandes depuis la scène, contraire à « une seule voie de modification ».
4. **Historique par commandes inverses (`do`/`undo` codés à la main)** : chaque commande doit fournir son inverse exact ; source de bugs (duplication, suppression d'un objet porteur d'un écran monté) que les snapshots évitent gratuitement.
