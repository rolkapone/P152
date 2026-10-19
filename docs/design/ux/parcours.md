# Parcours utilisateurs clés — MVP

> Textes d'interface en anglais (entre guillemets), documentation en français. Stories concernées entre crochets.

## P1 — Premier setup de A à Z (Jake / Priya) [US-020, 006, 010, 011, 012, 017]
**Objectif** : composer un bureau avec 5 objets en moins de 5 minutes, sans aide.

| # | L'utilisateur... | Il voit / l'app fait |
|---|---|---|
| 1 | ouvre l'app pour la première fois | Écran d'accueil (modal) : "Plan your desk setup before you buy." Boutons "Start with a desk" (principal) et "Import a setup". Lien "Skip" et guide 3 étapes (Pick a desk / Add objects / Check it fits). |
| 2 | clique "Start with a desk" | Étape "Choose your desk" : 5+ cartes de bureaux (nom, dimensions en cm, vignette). Option "Custom size". Bureau 140x70 pré-sélectionné. |
| 3 | choisit un bureau, clique "Use this desk" | Le bureau apparaît dans la scène, vue par défaut en 3/4 ; bibliothèque d'objets ouverte à gauche ; indicateur "It fits" (vert, vide = rien à signaler). Astuce contextuelle dismissable : "Click an object in the library to add it." |
| 4 | clique "Monitor" dans la bibliothèque | L'écran apparaît sur le bureau, sélectionné ; le panneau de propriétés s'ouvre à droite (diagonale, ratio, pied, incurvé). |
| 5 | règle "34 in / 21:9" (diagonale en pouces = exception de saisie ?, voir question PO 1) | L'objet change en temps réel ; alertes recalculées. |
| 6 | ajoute clavier, souris, tapis, enceintes | Chaque objet est posé à une position libre par défaut, sélectionné. |
| 7 | fait glisser un objet | Il suit le curseur sur le plateau, la caméra ne bouge pas ; cote de distance au bord affichée pendant le glissement. |
| 8 | voit l'indicateur passer à "Doesn't fit" | Parcours P3. |
| 9 | quitte | Sauvegarde automatique ; message discret "Saved" (parcours P4). |

**États vides** : bureau seul sans objet = message dans la zone d'alertes "Nothing to check yet. Add an object to see if it fits." + la bibliothèque est mise en avant.
**Erreurs** : limite de 50 objets ("You reached the limit of 50 objects. Delete one to add another.").

## P2 — Vérifier "ça rentre ?" (Jake) [US-014 à 017]
**Objectif** : avant d'acheter un écran 34" 21:9, savoir s'il rentre sur son bureau 120x60.

1. Il ouvre son setup sauvegardé (ou en crée un).
2. Il regarde l'indicateur global dans la barre du haut : "It fits" (vert + icône coche) ou "Doesn't fit - 2 issues" (rouge + icône).
3. Il ouvre/consulte le panneau "Alerts" : liste par gravité (Error, Warning, Info), un texte actionnable par ligne.
4. Il remplace l'écran par ses dimensions réelles dans les propriétés ; l'indicateur se met à jour immédiatement (< 100 ms).
5. Il conclut : tout est vert -> il peut acheter ; sinon -> P3.
**Cas limite** : seulement des alertes "Info" (confort) -> indicateur "It fits" avec mention "1 tip" (pas bloquant).

## P3 — Corriger une alerte (Priya) [US-017]
**Objectif** : comprendre et résoudre "Monitor overflows by 80 mm".

1. L'objet en alerte est surligné dans la scène (couleur + hachures/icône), l'indicateur passe à "Doesn't fit".
2. Elle clique l'alerte dans la liste -> l'objet est sélectionné, la caméra le garde visible (sans changer brutalement la vue), ses propriétés s'affichent.
3. Elle corrige de l'une de ces façons : faire glisser l'objet, le pivoter (boutons -15°/+15°), changer sa taille, changer de bureau.
4. L'alerte disparaît dès que le problème est résolu ; annonce vocale "Alert resolved" (lecteurs d'écran). Si tout est résolu : "It fits".
5. Si elle ne sait pas comment faire : chaque alerte a une suggestion ("Move it 80 mm to the left or choose a smaller monitor.").
**Erreurs** : valeur hors bornes saisie -> message sous le champ, ancienne valeur conservée.
**Annuler** : Ctrl+Z toujours disponible [US-019].

## P4 — Sauvegarder et reprendre (Priya / Marcus) [US-018]
**Sauvegarde automatique (par défaut)**
1. Chaque modification est enregistrée dans le navigateur ; indicateur discret "Saved in this browser" (horodatage au survol).
2. Elle ferme l'onglet, revient le lendemain : le setup est restauré à l'identique, vue par défaut. Pas de modal de bienvenue (déjà vu).

**Export / import (Marcus)**
1. Menu "File" -> "Export setup (.json)" : téléchargement `my-desk-setup.json`. Confirmation "Setup exported."
2. Sur un autre ordinateur : écran d'accueil ou menu "File" -> "Import setup..." -> sélection du fichier.
3. Si un setup existe déjà : confirmation "Replace your current setup? This cannot be undone." avec "Replace" / "Cancel" (option : "Export current first").
4. Fichier invalide : "This file is not a valid setup. Choose a file exported from this app." ; fichier d'une version plus récente : "This file was made with a newer version of the app."; données locales corrompues : "We couldn't restore your last setup. You can start a new one or import a file." (pas de plantage).

**Nouveau setup** : "New setup" -> "Start a new setup? Your current setup will be replaced. Export it first if you want to keep it." ["Export first", "Start new", "Cancel"].

## P5 — Reprise après erreur / cas transverses
- Stockage navigateur plein ou désactivé : bandeau "Your setup can't be saved in this browser. Export it to keep it." avec bouton "Export setup".
- WebGL indisponible : écran "Your browser can't display 3D. Try an up-to-date Chrome, Firefox, Edge or Safari." (+ lien d'aide).
- Chargement long : squelette du shell + indicateur "Loading 3D scene..." (pas d'écran blanc).
