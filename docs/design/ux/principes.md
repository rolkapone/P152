# Principes UX — P152

## Les 5 principes produit
1. **Zéro jargon 3D.** On dit "Move", "Rotate", "Zoom", "Reset view" ; jamais "orbit", "pan", "axis", "mesh". L'utilisateur manipule des objets de bureau, pas une scène 3D. Chaque geste de caméra a un équivalent bouton et une info-bulle (ex. "Drag to turn the view, scroll to zoom").
2. **La réponse d'abord : "Does it fit ?"** L'indicateur global ("It fits" / "Doesn't fit - N issues") est toujours visible en barre du haut. Tout le reste est au service de ce verdict.
3. **Le bureau est le centre.** Tout est posé sur le bureau, aux dimensions réelles, avec des cotes visibles (mm/cm) pendant le déplacement. Le chiffre rassure plus que le joli.
4. **Un écran, aucune impasse.** Un seul écran de travail, aucune navigation par pages. Toute action est annulable (Ctrl+Z) plutôt que confirmée, sauf l'écrasement du setup (confirmation). Sauvegarde automatique, jamais de "Save" obligatoire.
5. **Progressive disclosure.** Au début : un bureau, 9 objets, quelques réglages. Les options avancées (seuils, magnétisme, dimensions libres) sont à un clic mais pas affichées. Les fonctions futures n'apparaissent que lorsqu'elles existent.

## Manipulation 3D (règles)
- **Souris** : clic gauche sur un objet = sélectionner et glisser ; clic gauche sur le vide = tourner la vue ; clic droit glissé = déplacer la vue ; molette = zoom. Pendant le glissement d'un objet, la caméra est verrouillée.
- **Objets au sol du bureau** : mouvement contraint au plateau (pas de hauteur à gérer). L'objet ne "disparaît" jamais sous le bureau.
- **Retour visuel constant** : survol = contour léger ; sélection = contour épais + poignée de rotation ; pendant le glissement = cotes jusqu'aux bords du bureau (ex. "120 mm from left edge").
- **Vues prédéfinies** : bouton "Reset view" + vues "Top" et "Front" (la vue de dessus est la plus lisible pour vérifier l'encombrement ; à proposer au PO) ; le zoom ne traverse jamais le bureau.
- **Aucun piège** : un objet ne peut pas être perdu hors champ (la sélection par liste/alerte recadre la vue sans la bouleverser).
- **Magnétisme** : proposition : activé sur les bords du bureau, Maj = déplacement libre (cf. US-012), à confirmer par le PO.
- **Équivalents clavier** (accessibilité) : Tab pour parcourir les objets ; flèches = déplacer de 10 mm (Maj+flèche = 1 mm, Ctrl+flèche = 100 mm) ; R / Maj+R = pivoter de 15° ; Ctrl+D dupliquer ; Suppr supprimer ; Échap désélectionner.

## Présentation des alertes
- **3 niveaux** : Error (ne rentre pas : débordement, chevauchement, profondeur insuffisante), Warning (encombrement > seuil, zone libre insuffisante), Info (confort, sans impact sur le verdict "It fits").
- **Jamais la couleur seule** : icône + texte de gravité + motif (hachures) sur l'objet.
- **Verdict** : "Doesn't fit" s'il existe au moins une Error ; "It fits" avec "N tips" sinon (warnings et infos affichés comme conseils). *Question PO : un Warning rend-il le verdict négatif ?*
- **Texte actionnable en langage clair** : quoi + combien + que faire. Ex. "Monitor overflows the desk by 80 mm on the right. Move it left or choose a smaller monitor." Éviter "Collision detected".
- **Lien alerte -> objet** : clic = sélection + surbrillance ; les alertes disparaissent sans action quand le problème est corrigé.
- **Pas d'alerte intrusive** : pas de popup, pas de son ; panneau + indicateur + annonce `aria-live="polite"` pour les lecteurs d'écran (pas de spam : regroupée, max 1 annonce par action).
- **Pas de faux sentiment de sécurité** : mention "Based on the dimensions you entered" sous l'indicateur.

## Prise en main (zéro compétence 3D)
- Écran d'accueil 3 étapes ignorable, rouvrable via Help.
- État vide guidé : bureau seul -> "Add your first object" avec les 3 objets recommandés (Monitor, Keyboard, Mouse) mis en avant.
- Valeurs par défaut réalistes partout (écran 27" 16:9, clavier 100 %...) : le setup est plausible en 1 clic.
- Info-bulles sur chaque bouton d'icône (aussi pour le clavier, lisibles par lecteur d'écran).
- Pas de notion de "scène", "mesh" ou "matériau" au MVP.

## Accessibilité — WCAG 2.2 niveau AA
- **Clavier** : tout est utilisable sans souris, y compris sélectionner/déplacer/pivoter un objet de la scène (voir raccourcis). Ordre de tabulation logique : barre du haut -> panneau gauche -> scène -> panneau droit. Lien "Skip to 3D view / Skip to alerts". Aucun piège clavier (2.1.2), focus visible, non masqué (2.4.11), raccourcis désactivables ou non activés dans les champs de saisie (2.1.4).
- **Lecteurs d'écran** : libellés explicites (`aria-label`) ; liste des objets de la scène en alternative textuelle ("Objects on desk" : nom, position, taille) ; actions annoncées via zone `aria-live` ("Monitor added", "Monitor moved 10 mm left", "2 issues").
- **Contrastes** : texte >= 4,5:1 ; éléments d'interface et indicateurs >= 3:1 ; vérifier aussi les contours de sélection/alerte dans la scène sur sol et bureau clairs ou sombres.
- **Pas la couleur seule** (1.4.1) : icônes, libellés, motifs.
- **Cibles** : >= 24x24 px minimum (2.5.8), recommandé 32-40 px pour les boutons principaux ; espacement suffisant sur les poignées de la scène (alternative bouton pour pivoter).
- **Alternatives au glissement** (2.5.7) : tout déplacement par glisser a une alternative (champs X/Y en mm dans Properties, flèches clavier).
- **Mouvement** : transitions de caméra courtes et désactivées si `prefers-reduced-motion`.
- **Formulaires** : label visible associé à chaque champ, unité affichée ("mm"), erreur sous le champ avec `aria-describedby`, focus renvoyé au champ en erreur ; pas de double saisie inutile (3.3.7).
- **Zoom et texte** : interface utilisable à 200 % de zoom navigateur ; reflow du panneau (1.4.10) ; taille de texte >= 14 px.
- **Cohérence** (3.2.3/3.2.4) : mêmes emplacements et mêmes libellés partout ; aide toujours au même endroit (3.2.6).
- **Langue** : `lang="en"` sur le document, cohérent avec l'i18n.

## Micro-rédaction (anglais)
Ton : simple, direct, rassurant, tutoiement évité (sans pronom : "Add an object", pas "You can..."). Phrases courtes, verbes d'action, unités toujours affichées ("mm"). Pas d'erreurs accusatrices : "Enter a width between 600 and 3000 mm." plutôt que "Invalid value".

## Questions pour le PO
1. Un **Warning** (encombrement > 70 %) rend-il le verdict "Doesn't fit", ou seulement une Error ?
2. La **diagonale d'écran** est une habitude en pouces ("27 in") : accepter l'affichage en pouces uniquement pour ce champ, alors que le MVP exclut les pouces (H4) ? Proposition : "27 in" affiché pour la diagonale avec l'équivalent mm.
3. Ajouter une vue "Top" (dessus) en plus de "Reset view" ? Recommandé pour la lisibilité de l'encombrement.
4. Valider le **min. 1366x768** comme taille d'écran supportée.
5. Magnétisme activé ou non par défaut ?
