# Backlog — P152

## Plan de release

| Indicateur | Valeur |
|---|---|
| Points MVP (Must + Should) | **83** (Must 74, Should 9) |
| Points "Could" MVP (hors total, bonus) | 7 |
| Points livrés | 0 |
| Vitesse moyenne | 15 pts/sprint (par défaut, pas d'historique) |
| Sprints restants estimés avant MVP | **6** (83 / 15 = 5,5) |
| Dernière mise à jour | 2026-10-19 (kickoff) |

Légende : priorité MoSCoW, estimation en points (1, 2, 3, 5, 8). Tags `[UI]` = écran, `[3D]` = scène/rendu/assets.
Les critères UX seront ajoutés par le scrum-master après le travail des designers au planning de chaque sprint.
Convention de langue : documents en français ; textes visibles dans l'app en **anglais** (libellés cités ci-dessous entre guillemets = texte UI anglais). Unités métriques (mm/cm) uniquement.
Décisions du PO (2026-10-19) : hypothèses par défaut validées (voir fin du document).

## Questions pour le PO
Aucune question ouverte (voir « Décisions du PO » en fin de document).

---

# MVP — "Est-ce que ça rentre ?"

## Epic A — Fondations techniques

### US-001 — Setup repo, build et CI  [Must | 3 pts]
En tant qu'équipe, je veux un repo avec build, lint, tests et CI afin de livrer chaque story de façon fiable.
Critères d'acceptation :
- [ ] Étant donné un clone propre, quand on lance l'installation puis le build, alors il réussit sans erreur.
- [ ] Étant donné une pull request, quand la CI s'exécute, alors lint, tests unitaires et build sont exécutés et visibles.
- [ ] Étant donné le repo, alors `.env` est dans `.gitignore` et `.env.example` existe.
- [ ] Les fichiers binaires > 1 Mo sont suivis par Git LFS.
Notes techniques / dépendances : devops. Bloque toutes les autres stories.

### US-002 — Threat model initial  [Must | 2 pts]
En tant que PO, je veux un threat model du produit afin d'anticiper les risques de sécurité dès la conception.
Critères d'acceptation :
- [ ] Étant donné l'architecture MVP, quand le threat model est rédigé, alors `docs/security/threat-model.md` liste actifs, surfaces d'attaque (import de fichiers, stockage local, dépendances) et mesures.
- [ ] Les scans SAST, dépendances et secrets sont définis pour la CI.
Notes techniques / dépendances : secdevops. À réviser avant R6 (comptes) et R7 (import).

### US-003 — Architecture socle et modèle de données du setup  [Must | 3 pts]
En tant que développeur, je veux une architecture documentée et un modèle de données versionné afin que la vision long terme (matières, éclairage, déco, partage) n'impose pas de refonte.
Critères d'acceptation :
- [ ] Étant donné `docs/architecture.md`, alors les choix de stack et leurs ADR sont consignés.
- [ ] Le schéma du setup (bureau, objets, position, rotation, paramètres, champ matériau réservé, version de schéma) est défini et validé par des tests.
- [ ] Le catalogue d'objets est décrit par des données, indépendamment du code de la scène.
- [ ] Les textes de l'interface passent par un système i18n (anglais par défaut ; l'ajout du français comme langue secondaire reste une option pour une release ultérieure, non engagée).
Notes techniques / dépendances : developer + graphics-engineer + devops. Dépend de US-001.

## Epic B — Scène 3D et navigation

### US-004 — Scène 3D de base et caméra orbitale  [UI][3D] [Must | 5 pts]
En tant qu'utilisateur, je veux tourner, zoomer et me déplacer autour de ma scène afin de voir mon setup sous tous les angles.
Critères d'acceptation :
- [ ] Étant donné la scène, quand je fais glisser la souris (clic gauche), alors la caméra orbite autour du bureau.
- [ ] Quand j'utilise la molette, alors la caméra zoome entre une distance min et max sans traverser le bureau.
- [ ] Quand je fais un clic droit glissé, alors la scène se déplace (pan) dans des limites définies.
- [ ] Un bouton "Reset view" restaure la vue par défaut.
- [ ] Le rendu tient ≥ 60 FPS sur desktop milieu de gamme avec une scène vide et un bureau.
- [ ] Un sol et un éclairage neutre rendent les volumes lisibles. Unités : mètre.
Notes techniques / dépendances : graphics-engineer. Dépend de US-001, US-003.

### US-005 — Shell de l'application en anglais  [UI] [Must | 5 pts]
En tant qu'utilisateur, je veux une interface claire en anglais (zone 3D, panneau d'objets, panneau de propriétés, alertes) afin de m'y repérer sans aide.
Critères d'acceptation :
- [ ] Étant donné l'app, quand elle se charge, alors la mise en page affiche zone 3D, bibliothèque, propriétés et alertes.
- [ ] Tous les textes visibles sont en anglais et proviennent des fichiers i18n (aucun texte en dur dans les composants) ; la structure permet d'ajouter une langue plus tard.
- [ ] Les composants respectent le design system (tokens) et l'accessibilité AA (contraste, focus clavier, libellés).
- [ ] Les états vide, chargement et erreur sont définis.
Notes techniques / dépendances : ux-designer, ui-designer, developer. Dépend de US-001.

## Epic C — Bureau

### US-006 — Choisir un bureau dans un catalogue  [UI][3D] [Must | 5 pts]
En tant qu'utilisateur, je veux choisir un bureau parmi des modèles aux dimensions réelles afin de partir de mon vrai mobilier.
Critères d'acceptation :
- [ ] Étant donné le catalogue, alors au moins 5 bureaux types sont proposés (ex. 120x60, 140x70, 160x80, 180x80 cm, bureau d'angle) avec dimensions affichées en mm ou cm.
- [ ] Quand je sélectionne un bureau, alors il apparaît dans la scène à l'échelle réelle (1 m = 1 unité).
- [ ] Quand je change de bureau, alors les objets déjà posés sont conservés et les alertes recalculées.
- [ ] Le bureau a un plateau et des pieds lisibles ; hauteur standard 720-750 mm par défaut.
Notes techniques / dépendances : technical-artist (modèles paramétriques), graphics-engineer. Dépend de US-004.

### US-007 — Dimensions personnalisées du bureau  [UI] [Should | 3 pts]
En tant qu'utilisateur, je veux saisir largeur, profondeur et hauteur de mon bureau afin de refléter exactement le mien.
Critères d'acceptation :
- [ ] Étant donné un bureau sélectionné, quand je saisis des valeurs, alors le bureau est redimensionné en temps réel.
- [ ] Les valeurs hors bornes (ex. largeur < 600 mm ou > 3000 mm) sont refusées avec un message en anglais.
- [ ] Les alertes sont recalculées après modification.
Notes techniques / dépendances : dépend de US-006.

## Epic D — Objets paramétrables

### US-008 — Bibliothèque d'objets paramétrables, lot 1  [3D] [Must | 8 pts]
En tant qu'utilisateur, je veux des écrans, boîtiers PC, claviers, souris et tapis génériques afin de représenter mon matériel principal.
Critères d'acceptation :
- [ ] Étant donné le catalogue, alors 5 types existent : écran, boîtier PC, clavier, souris, tapis, chacun avec dimensions par défaut réalistes (mm) et bornes min/max.
- [ ] L'écran se paramètre par diagonale, ratio (16:9, 21:9, 32:9), pied ou non, incurvé ou non ; les dimensions sont calculées.
- [ ] Le boîtier PC propose des formats (mini-tour, moyenne tour, grande tour).
- [ ] Le clavier propose des formats (100 %, TKL, 60 %) ; le tapis propose S, M, L, XL, XXL ou dimensions libres.
- [ ] Chaque objet expose une empreinte au sol (footprint) et une hauteur utilisés par les règles d'alerte.
- [ ] Chaque modèle respecte le budget (≤ 10k triangles par objet) ; licence/origine consignée si asset externe.
Notes techniques / dépendances : technical-artist (modèles et paramétrage), graphics-engineer. Dépend de US-003. Prévoir des slots matière pour R2.

### US-009 — Bibliothèque d'objets paramétrables, lot 2  [3D] [Must | 5 pts]
En tant qu'utilisateur, je veux support manette, bras d'écran, enceintes et lampe afin de compléter mon setup.
Critères d'acceptation :
- [ ] Étant donné le catalogue, alors 4 types supplémentaires existent avec dimensions par défaut et bornes.
- [ ] Le bras d'écran se fixe au bord du bureau (pince) et porte un écran ; son empreinte sur le plateau est réduite à la pince.
- [ ] Les enceintes se paramètrent en taille (compactes, bibliothèque) ; la lampe en hauteur et type (bureau, barre).
- [ ] Même budget de triangles et même contrat (footprint, hauteur) que le lot 1.
Notes techniques / dépendances : dépend de US-008. Le comportement "écran sur bras" doit être traité comme un cas de la règle d'encombrement (US-015).

## Epic E — Placement et interaction

### US-010 — Ajouter un objet à la scène  [UI][3D] [Must | 3 pts]
En tant qu'utilisateur, je veux ajouter un objet depuis la bibliothèque afin de construire mon setup.
Critères d'acceptation :
- [ ] Étant donné la bibliothèque, quand je clique sur un objet, alors il apparaît sur le bureau à une position libre par défaut (ou au centre si aucune).
- [ ] L'objet ajouté est sélectionné automatiquement.
- [ ] Le nombre d'objets est limité à une valeur raisonnable (ex. 50) avec message explicite au-delà.
Notes techniques / dépendances : dépend de US-005, US-008.

### US-011 — Panneau de propriétés de l'objet  [UI] [Must | 5 pts]
En tant qu'utilisateur, je veux modifier les dimensions et paramètres d'un objet sélectionné afin de correspondre à mon produit réel.
Critères d'acceptation :
- [ ] Étant donné un objet sélectionné, alors le panneau affiche ses paramètres et dimensions en mm.
- [ ] Quand je modifie une valeur valide, alors l'objet est mis à jour dans la scène en temps réel.
- [ ] Une valeur hors bornes est refusée avec un message en anglais et l'ancienne valeur est conservée.
- [ ] Tous les champs sont utilisables au clavier et ont un libellé accessible.
Notes techniques / dépendances : dépend de US-008, US-010.

### US-012 — Déplacer un objet à la souris  [3D] [Must | 5 pts]
En tant qu'utilisateur, je veux faire glisser un objet sur le bureau afin de tester plusieurs agencements.
Critères d'acceptation :
- [ ] Étant donné un objet, quand je le fais glisser, alors il suit le curseur sur le plan du plateau (axes X/Z) et reste posé à la bonne hauteur.
- [ ] Pendant le glissement, la caméra n'orbite pas.
- [ ] Un magnétisme optionnel (grille de 10 mm, bords du bureau) peut être activé ; touche Maj = déplacement libre.
- [ ] La position finale est enregistrée dans l'état du setup.
- [ ] Le déplacement garde ≥ 60 FPS avec 20 objets.
Notes techniques / dépendances : dépend de US-004, US-010.

### US-013 — Sélectionner, pivoter, dupliquer, supprimer  [UI][3D] [Must | 3 pts]
En tant qu'utilisateur, je veux sélectionner, faire pivoter, dupliquer et supprimer un objet afin d'ajuster mon agencement.
Critères d'acceptation :
- [ ] Quand je clique un objet, alors il est surligné ; clic dans le vide, alors désélection.
- [ ] Rotation par pas de 15° (boutons et clavier) et libre via la poignée.
- [ ] Suppression via bouton et touche Suppr ; duplication via bouton et Ctrl+D, avec léger décalage.
- [ ] Toutes les actions sont accessibles au clavier et annoncées aux lecteurs d'écran.
Notes techniques / dépendances : dépend de US-012.

## Epic F — Alertes "ça rentre ?"

### US-014 — Détection de débordement du bureau  [3D] [Must | 3 pts]
En tant qu'utilisateur, je veux savoir quand un objet dépasse du bureau afin d'éviter un achat inadapté.
Critères d'acceptation :
- [ ] Étant donné un objet posé, quand son empreinte dépasse le plateau (même partiellement), alors une alerte "Overflows by X mm" est produite (côté concerné et valeur).
- [ ] Un objet entièrement dans le plateau ne produit aucune alerte (tests unitaires avec cas limites : rotation, pile au bord).
- [ ] Le bras d'écran à pince est autorisé à toucher le bord (exception documentée).
Notes techniques / dépendances : règle pure, testable hors rendu. Dépend de US-008.

### US-015 — Détection d'encombrement et collisions  [3D] [Must | 5 pts]
En tant qu'utilisateur, je veux être averti quand des objets se chevauchent ou saturent le bureau afin de garder un espace de travail utilisable.
Critères d'acceptation :
- [ ] Quand deux empreintes se chevauchent, alors une alerte nomme les deux objets et la profondeur de chevauchement.
- [ ] Exceptions explicites : clavier/souris sur tapis, écran sur bras ou sur pied au-dessus d'un tapis (hauteurs compatibles).
- [ ] Si l'occupation de la surface dépasse 70 % (valeur configurable), alors une alerte d'encombrement apparaît avec le pourcentage.
- [ ] Une zone libre minimale devant le clavier (150 mm par défaut, ajustable) est vérifiée (seuil validé par le PO).
- [ ] Les règles sont des fonctions pures avec tests unitaires (≥ 15 cas).
Notes techniques / dépendances : dépend de US-014. Seuils dans un fichier de configuration.

### US-016 — Alertes de profondeur utile  [3D] [Must | 3 pts]
En tant qu'utilisateur, je veux savoir si la profondeur du bureau suffit afin de ne pas être trop près de l'écran ni de manquer de place pour clavier et poignets.
Critères d'acceptation :
- [ ] Quand profondeur du bureau < profondeur écran + profondeur clavier + marge de confort (valeur configurable, par défaut 100 mm), alors une alerte "Insufficient desk depth" indique le manque en mm.
- [ ] Quand la distance entre l'écran et le bord côté utilisateur est inférieure à une valeur recommandée selon la diagonale (valeurs par défaut ajustables, acceptées par le PO), alors une alerte de confort (niveau "info") s'affiche.
- [ ] Tests unitaires couvrant les cas limites.
Notes techniques / dépendances : dépend de US-014. Définir les niveaux de gravité (erreur, avertissement, info).

### US-017 — Affichage des alertes  [UI][3D] [Must | 5 pts]
En tant qu'utilisateur, je veux voir clairement les alertes dans l'interface et la scène afin de comprendre quoi corriger.
Critères d'acceptation :
- [ ] Étant donné des alertes, alors un panneau les liste par gravité avec un texte en anglais actionnable.
- [ ] Clic sur une alerte, alors l'objet concerné est sélectionné et mis en évidence dans la scène.
- [ ] Les objets en alerte sont surlignés (couleur et motif/icône, pas la couleur seule).
- [ ] Un indicateur global "It fits" / "Doesn't fit" est visible en permanence.
- [ ] Les alertes se recalculent en moins de 100 ms après chaque modification (20 objets) et sont annoncées aux lecteurs d'écran.
Notes techniques / dépendances : dépend de US-014 à US-016, US-005.

## Epic G — Persistance et qualité

### US-018 — Sauvegarde locale et restauration  [UI] [Must | 3 pts]
En tant qu'utilisateur, je veux retrouver mon setup à mon retour afin de ne pas tout refaire.
Critères d'acceptation :
- [ ] Étant donné un setup modifié, alors il est sauvegardé automatiquement dans le navigateur.
- [ ] Au rechargement, le setup est restauré à l'identique (bureau, objets, positions, paramètres).
- [ ] Un bouton "New setup" demande confirmation avant de réinitialiser.
- [ ] Une donnée corrompue ou d'une ancienne version est migrée ou ignorée avec un message, sans planter.
- [ ] Export/import JSON du setup (fichier validé par schéma) — validé par le PO.
Notes techniques / dépendances : dépend de US-003. L'import de fichier est une surface d'attaque (voir US-002).

### US-019 — Annuler / rétablir  [UI] [Should | 3 pts]
En tant qu'utilisateur, je veux annuler et rétablir mes actions afin d'expérimenter sans crainte.
Critères d'acceptation :
- [ ] Ctrl+Z annule la dernière action (ajout, déplacement, paramètre, suppression) ; Ctrl+Y/Ctrl+Maj+Z la rétablit.
- [ ] Un glissement complet compte pour une seule action.
- [ ] Historique de 50 actions minimum ; boutons visibles avec états désactivés.
Notes techniques / dépendances : dépend de US-012, US-011.

### US-020 — Écran d'accueil et démarrage guidé  [UI] [Should | 3 pts]
En tant que nouvel utilisateur, je veux un accueil qui m'explique l'essentiel afin de démarrer sans notice.
Critères d'acceptation :
- [ ] Au premier lancement, un accueil propose "Start with a desk" et un bref guide de 3 étapes ignorable.
- [ ] Le guide ne réapparaît pas après avoir été fermé (préférence mémorisée), mais reste accessible via l'aide.
- [ ] Un novice atteint un setup à 3 objets sans aide (test utilisateur avec le PO).
Notes techniques / dépendances : dépend de US-005.

### US-022 — Budgets de performance et tests E2E de référence  [Must | 3 pts]
En tant qu'équipe, je veux des tests E2E et une mesure de perf automatisés afin de protéger la qualité à chaque story.
Critères d'acceptation :
- [ ] Un scénario E2E (choisir bureau, ajouter 3 objets, déplacer, déclencher une alerte, recharger) passe en CI.
- [ ] Une mesure de FPS est enregistrée sur une scène de 20 objets avec seuil d'échec configurable.
- [ ] Des captures sont archivées comme artefacts.
Notes techniques / dépendances : qa-tester + devops. Dépend de US-012, US-017, US-018.

### US-021 — Utilisation tactile et mobile  [UI] [Could | 5 pts]
En tant qu'utilisateur mobile, je veux manipuler la scène au doigt afin de consulter mon setup sur smartphone.
Critères d'acceptation :
- [ ] Orbite à un doigt, zoom en pincement, déplacement d'un objet au doigt.
- [ ] Mise en page adaptée en largeur 360 px ; ≥ 30 FPS sur smartphone récent.
Notes techniques / dépendances : desktop d'abord (décision PO), tactile en Could. Préparer l'architecture d'entrée (pointer events) dès US-004.

### US-023 — Capture d'écran du setup  [UI][3D] [Could | 2 pts]
En tant qu'utilisateur, je veux exporter une image de mon setup afin de le montrer à mes proches.
Critères d'acceptation :
- [ ] Un bouton télécharge un PNG de la vue courante sans interface.
Notes techniques / dépendances : prépare le partage (R6).

**Récapitulatif MVP** : Must 74 pts (US-001 à 006, 008 à 018, 022) ; Should 9 pts (US-007, 019, 020) ; Could 7 pts (US-021, 023, hors total).

---

# Plus tard — vision long terme (stories de haut niveau, à détailler avant leur sprint)

Les ids US-1xx sont provisoires. Estimations indicatives (epic-level) ; toute story > 8 pts sera redécoupée.

## Option i18n — Langue secondaire française (non engagée)
- US-100 — Traduction française de l'interface via les fichiers i18n existants [UI] ~3 (option, à décider par le PO)

## R2 — Style : couleurs, matières, styles en un clic
- US-101 — Couleur et matière par objet (noir mat, blanc, bois, métal, etc.) [UI][3D] [Should] ~8
- US-102 — Bibliothèque de matériaux PBR optimisés [3D] [Should] ~5
- US-103 — Styles en un clic : all white, all black, coloré, cosy [UI][3D] [Should] ~8
- US-104 — Aperçu avant/après d'un style [UI] [Could] ~3
Architecture : slots matière par pièce de modèle, presets de style en données.

## R3 — Ambiance : lumière, jour/soir, murs
- US-110 — Éclairage réaliste (ombres douces, environnement) [3D] ~8
- US-111 — LED/RGB (bandeaux, rétroéclairage, lampe colorée, animations) [UI][3D] ~8
- US-112 — Cycle jour / soir [UI][3D] ~5
- US-113 — Mur, couleur/texture du mur, sol [UI][3D] ~5
- US-114 — Déco murale (posters, cadres, étagères murales) [UI][3D] ~5
Architecture : pipeline de rendu extensible (post-traitements, budgets qualité par appareil).

## R4 — Déco et bibliothèque de modèles libres
- US-120 — Étagères, figurines, plantes, posters [UI][3D] ~8
- US-121 — Bibliothèque de modèles 3D libres (curation, licences, optimisation, Git LFS) [3D] ~8
- US-122 — Recherche et filtres de la bibliothèque [UI] ~5
- US-123 — Placement sur surfaces autres que le bureau (étagères, sol) [3D] ~5

## R5 — Courses et catalogue produits
- US-130 — Catalogue de vrais produits neutre vis-à-vis des marques (dimensions réelles) [UI] ~8
- US-131 — Liste de courses avec prix total [UI] ~5
- US-132 — Remplacer un objet générique par un produit réel [UI][3D] ~5
- US-133 — Mise à jour des prix et données produits (source à définir) ~8

## R6 — Comptes, partage, communauté
- US-140 — Comptes utilisateurs et sauvegarde cloud [UI] ~8
- US-141 — Partage d'un setup par lien [UI] ~5
- US-142 — Galerie d'inspiration communautaire [UI] ~8
- US-143 — Modération et signalement ~5
Prérequis : mise à jour du threat model, RGPD, hébergement.

## R7 — Import d'objets personnels
- US-150 — Spike : faisabilité photo vers 3D par IA (coût, qualité) ~3
- US-151 — Import photo vers objet 3D [UI][3D] ~8
- US-152 — Calage des dimensions réelles d'un objet importé [UI][3D] ~5
Prérequis : threat model upload, quotas.

## R8 — Réalité augmentée mobile
- US-160 — Spike WebXR / alternatives ~3
- US-161 — Affichage du setup en AR à l'échelle réelle [UI][3D] ~8

---

# Décisions du PO (2026-10-19) — toutes validées

1. **Compte utilisateur au MVP :** non, aucun compte, aucun backend. Validé par le PO (2026-10-19).
2. **Mobile au MVP :** desktop d'abord, tactile en "Could" (US-021), mise en page responsive minimale. Validé par le PO (2026-10-19).
3. **Sauvegarde :** locale dans le navigateur, avec export/import JSON, pas de cloud. Validé par le PO (2026-10-19).
4. **Unités affichées :** millimètres et centimètres, système métrique uniquement, pas de pouces. Validé par le PO (2026-10-19).
5. **Réalisme visuel du MVP :** objets génériques simples, détails minimaux, avant les matières de R2. Validé par le PO (2026-10-19).
6. **Langue de l'interface :** anglais. Le français pourra être ajouté comme langue secondaire plus tard (option US-100, non engagée).
7. **Seuils d'alerte par défaut** (70 % d'occupation, 100 mm de marge de profondeur, 150 mm de zone libre devant le clavier) : acceptés comme valeurs par défaut ajustables.

## Questions ouvertes pour le PO
Aucune.
