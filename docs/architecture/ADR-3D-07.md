# ADR-3D-07 — Interactions : pointer events, picking par proxys, drag sur plan, caméra contrainte, commandes

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** Zéro jargon 3D, clic gauche objet = sélectionner/glisser, clic gauche vide = tourner la vue, clic droit = déplacer la vue, molette = zoom, caméra verrouillée pendant le drag, cotes visibles, magnétisme (grille 10 mm, bords, Maj = libre), rotation par pas de 15° + poignée, clavier complet (accessibilité), un drag = une action d'undo, tactile plus tard (US-021).

**Décision.**
- **Pointer Events** uniquement (souris, tactile, stylet unifiés) ; système d'événements R3F, raycast restreint à un **layer « selectable »** contenant des **proxys de picking** (boîte invisible = footprint étendu) plutôt que les meshes détaillés : coût constant, cibles plus faciles à attraper (≥ 24 px à l'écran visés via marge).
- **Drag** : intersection du rayon avec le **plan horizontal du support** (plateau ou objet support), décalage de prise conservé, `pointer capture`. Pendant le drag, la position est mise à jour de façon **transitoire** (store hors React) et les cotes jusqu'aux bords sont calculées par `core/geometry` ; au `pointerup`, **une commande `moveObject`** est poussée dans l'historique (US-019).
- **Magnétisme** : fonction pure `core/snap` (grille 10 mm, bords du plateau, alignement sur bords/centres des autres objets, seuil en pixels écran converti en mm), désactivée tant que Maj est enfoncé.
- **Rotation** : anneau-poignée maison au sol autour de l'objet sélectionné (pas de gizmo à axes), crans de 15° par défaut, libre avec Maj ; boutons et touches R / Maj+R émettent la même commande.
- **Caméra** : `CameraControls` (drei / yomotsu camera-controls) configurés : angle polaire limité (jamais sous le plateau), distance min/max, pan borné au volume du bureau, transitions douces (désactivées si `prefers-reduced-motion`), vues **Reset / Top / Front** et « recadrer sur l'objet » (sélection depuis liste/alerte). Désactivés pendant un drag d'objet.
- **Surbrillance** : survol = contour fin, sélection = contour épais (`Outlines` en coque inversée, pas de passe de post-traitement) ; objet en alerte = **motif hachuré projeté sur son empreinte au plateau** + couleur de gravité + icône en surimpression HTML (pas la couleur seule).
- **Clavier / lecteurs d'écran** : la scène ne gère pas le focus elle-même ; l'UI (developer) fournit la liste accessible des objets et les raccourcis, qui appellent **les mêmes commandes** que la souris.

**Conséquences.**
- (+) Une seule voie de modification (commandes) pour souris, clavier, champs de propriétés, alertes et undo/redo.
- (+) Tactile (US-021) = réglage des gestes, sans changer l'architecture.
- (−) Gizmo de rotation, cotes et hachures sont du code maison à maintenir (simple, mais à tester en E2E).

**Alternatives écartées.**
1. **`TransformControls` de three.js** : gizmo à 3 axes typé éditeur 3D, jargon visuel contraire au principe UX n°1, permet de sortir du plan.
2. **`OrbitControls`** : pas de transitions animées ni de bornes de pan / recadrage aussi complets que camera-controls ; il faudrait les réécrire.
3. **Drag via moteur physique (contraintes/joints)** : latence, oscillations, non déterministe ; contraire au « ça suit le curseur ».
4. **Picking GPU (rendu d'IDs en couleur)** : utile à des milliers d'objets ; à 50 objets le raycast sur proxys est plus simple et suffisant.
