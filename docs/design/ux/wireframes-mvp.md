# Wireframes basse fidélité — écrans principaux du MVP

> Textes d'interface en anglais. `[ ]` = bouton/champ, `( )` = option, `▼` = menu. Les wireframes par story (états, micro-textes, critères) seront dans `docs/design/ux/<story-id>.md` au planning de sprint.

## W1 — Welcome (modal, premier lancement) [US-020]
```
┌──────────────────────────────────────────────────────────┐
│                                                  [ X ]   │
│   Plan your desk setup before you buy.                   │
│   Check that everything fits - no 3D skills needed.      │
│                                                          │
│   ① Pick a desk   ② Add objects   ③ Check it fits       │
│                                                          │
│   [   Start with a desk   ]   [ Import a setup ]         │
│                                                          │
│   Skip and explore on my own                             │
└──────────────────────────────────────────────────────────┘
```
Focus initial sur "Start with a desk". Échap = Skip. Ne réapparaît pas ensuite (rouvrable via Help).

## W2 — Studio, vue d'ensemble (écran principal) [US-005]
```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ P152  [My desk setup  ✎] Saved in this browser   ↶ ↷   File ▼   (✔ It fits)    ?  │  Top bar
├───────────────┬──────────────────────────────────────────────┬─────────────────────┤
│ [Desk][Objects]│                                              │ PROPERTIES          │
│ ───────────── │                                              │ Select an object to │
│ Search…       │                                              │ edit its size.      │
│ ┌────┐ ┌────┐ │              3D VIEWPORT                      │                     │
│ │Mon.│ │PC  │ │         (desk, objects, floor)               │ ─────────────────── │
│ └────┘ └────┘ │                                              │ ALERTS              │
│ ┌────┐ ┌────┐ │                                              │ ✔ Nothing to fix.   │
│ │Kbd │ │Mous│ │                                              │ Alert settings      │
│ └────┘ └────┘ │   [Reset view] [Top] [Front] [Snap ✓]        │                     │
│  …            │                                              │                     │
├───────────────┴──────────────────────────────────────────────┴─────────────────────┤
│ Tip: drag to turn the view · scroll to zoom · right-drag to move the view   (hide) │
└────────────────────────────────────────────────────────────────────────────────────┘
 ◀ panneau gauche repliable                         panneau droit repliable ▶
```
Largeurs indicatives : gauche 240 px, droite 300 px, scène = reste. Ordre Tab : top bar > gauche > scène > droite.

## W3 — Desk picker (onglet "Desk", et modal au démarrage) [US-006, 007]
```
┌ Desk ─────────────────────────────┐
│ Choose your desk                  │
│ ┌──────────┐ ┌──────────┐         │
│ │ [thumb]  │ │ [thumb]  │         │
│ │ 120×60 cm│ │140×70 cm ✔│        │
│ └──────────┘ └──────────┘         │
│ ┌──────────┐ ┌──────────┐ ┌─────┐ │
│ │ 160×80 cm│ │ 180×80 cm│ │Corner│ │
│ └──────────┘ └──────────┘ └─────┘ │
│ ─── Custom size ─────────────────│
│ Width   [ 1400 ] mm               │
│ Depth   [  700 ] mm               │
│ Height  [  740 ] mm               │
│ Allowed: 600–3000 mm width        │
│ [ Use this desk ] (modal only)    │
└───────────────────────────────────┘
```
Dans le Studio : le clic sur une carte applique tout de suite le bureau (objets conservés, alertes recalculées). "Custom size" est replié par défaut.

## W4 — Bibliothèque d'objets (onglet "Objects") [US-008, 009, 010]
```
┌ Objects ──────────────────────────┐
│ Search objects…                   │
│ ▾ Essentials                      │
│  [▭ Monitor] [▭ Keyboard] [▭ Mouse]│
│ ▾ Computer                        │
│  [▭ PC case] [▭ Desk mat]         │
│ ▾ Accessories                     │
│  [▭ Monitor arm] [▭ Speakers]     │
│  [▭ Lamp] [▭ Controller stand]    │
│                                   │
│ 4 objects on desk                 │
└───────────────────────────────────┘
```
Clic ou Entrée = ajouter. Chaque bouton : icône + libellé (jamais l'icône seule). Au-delà de 50 objets : message d'erreur.

## W5 — Studio avec objets, un objet sélectionné, alertes [US-011, 013, 017]
```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ P152 [My desk ✎] Saved in this browser   ↶ ↷   File ▼   (✖ Doesn't fit - 2 issues) ? │
├───────────────┬────────────────────────────────────────────────┬─────────────────────┤
│ [Desk][Objects]│                                                │ PROPERTIES          │
│  …            │     ┌──────────── desk ───────────┐             │ Monitor             │
│               │     │   ╔═monitor═╗  ▒▒speaker▒▒▒ │▒▒overflow   │ Diagonal  [34] in   │
│               │     │   ╚═════════╝               │             │ Ratio  (16:9)(21:9) │
│               │     │  [keyboard]    (mouse)      │             │        (32:9)       │
│               │     └─────────────────────────────┘             │ ☐ Curved ☑ Stand    │
│               │         ↑120 mm from left edge                  │ Position X [ 450 ]mm│
│               │ ┌toolbar─────────────────────────────────────┐  │ Position Y [ 120 ]mm│
│               │ │↺ -15° ↻ +15° ⧉ Duplicate 🗑 Delete│          │ Rotation  [ 0 ] °   │
│               │ └───────────────────────────────────────────┘  │ Size 800×350×450 mm │
│               │ [Reset view] [Top] [Front] [Snap ✓]             │ ─────────────────── │
│               │                                                │ ALERTS (2)          │
│               │                                                │ ✖ Error             │
│               │                                                │ Speakers overflow   │
│               │                                                │ the desk by 80 mm   │
│               │                                                │ on the right. Move  │
│               │                                                │ them left.  [Show]  │
│               │                                                │ ⚠ Warning           │
│               │                                                │ Desk is 78 % full   │
│               │                                                │ (limit 70 %).       │
│               │                                                │ Alert settings      │
└───────────────┴────────────────────────────────────────────────┴─────────────────────┘
```
- Objet en alerte : contour + hachures + icône ✖/⚠ flottante (pas seulement la couleur).
- Champs X/Y en mm = alternative accessible au glisser.
- Les alertes sont triées par gravité (Error, Warning, Info) ; clic = sélection de l'objet.

## W6 — Zone des alertes : états [US-017]
```
Vide (aucun objet)        Tout va bien                 Problèmes
┌ ALERTS ───────────┐   ┌ ALERTS (0) ─────────┐   ┌ ALERTS (3) ────────────────┐
│ Nothing to check  │   │ ✔ Everything fits.  │   │ ✖ 1 error                  │
│ yet. Add an object│   │ Based on the sizes  │   │  Speakers overflow the     │
│ to see if it fits.│   │ you entered.        │   │  desk by 80 mm… [Show]     │
└───────────────────┘   └─────────────────────┘   │ ⚠ 1 warning                │
                                                  │  Desk is 78 % full.        │
Indicateur barre du haut: (✔ It fits)             │ ℹ 1 tip                    │
ou (✔ It fits - 1 tip) ou (✖ Doesn't fit - 2)     │  Monitor is close to edge… │
                                                  └────────────────────────────┘
```

## W7 — Propriétés du bureau (rien de sélectionné ou bureau sélectionné)
```
┌ PROPERTIES ───────────────────────┐
│ Desk: 140×70 cm                   │
│ Width [1400] mm   Depth [700] mm  │
│ Height [740] mm                   │
│ ⓘ Allowed width: 600–3000 mm      │
└───────────────────────────────────┘
```
Erreur : champ entouré + icône, message sous le champ ("Enter a width between 600 and 3000 mm."), ancienne valeur conservée, focus sur le champ.

## W8 — File menu et dialogues [US-018]
```
File ▼                          ┌ Start a new setup? ───────────────┐
 ├ New setup                    │ Your current setup will be        │
 ├ Import setup…                │ replaced. Export it first if you  │
 ├ Export setup (.json)         │ want to keep it.                  │
                                │ [Export first] [Start new][Cancel]│
                                └───────────────────────────────────┘
Bandeau d'erreur (en haut du Studio)
┌ ✖ We couldn't restore your last setup. [Start new] [Import a file] ┐
```

## W9 — Alert settings (modal) [US-015, 016]
```
┌ Alert settings ───────────────────────────┐
│ Maximum desk occupancy      [ 70 ] %      │
│ Comfort margin (depth)      [ 100 ] mm    │
│ Free space in front of keyboard [150] mm  │
│ [ Reset to defaults ]   [ Cancel ] [ Save ]│
└───────────────────────────────────────────┘
```

## W10 — Help (modal) [US-020]
```
┌ Help ─────────────────────────────────────┐
│ Getting started: ① ② ③ (replay guide)    │
│ Mouse: drag object = move · drag empty = turn view
│        scroll = zoom · right-drag = move view
│ Keyboard: Arrows move 10 mm · R rotate 15° · Ctrl+D duplicate
│           Delete remove · Ctrl+Z undo · Esc deselect
│                                  [ Close ]│
└───────────────────────────────────────────┘
```

## W11 — États système [US-005]
```
Chargement                         Navigateur non compatible
┌──────────────────────────┐       ┌──────────────────────────────┐
│ Loading 3D scene…  ▓▓▓░░ │       │ Your browser can't show 3D.  │
│ (shell + panneaux visibles)│     │ Try an up-to-date Chrome,    │
└──────────────────────────┘       │ Firefox, Edge or Safari.     │
                                   └──────────────────────────────┘
```
