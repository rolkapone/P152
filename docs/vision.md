# Vision produit — P152

> Statut : v0.2 validée par le PO (Carol), 2026-10-19. Correction du PO : l'interface de l'app est en **anglais** (les documents restent en français, langue de travail de l'équipe). Le français pourra être ajouté plus tard comme langue secondaire (option, pas un engagement).

## Problème
Refaire son setup gaming/bureau est coûteux et risqué : on achète sans savoir si les éléments rentrent (profondeur du bureau, écran trop large, enceintes qui débordent) ni si l'ensemble sera esthétique. Les outils 3D existants demandent des compétences en modélisation, ou sont liés à une marque.

## Cibles
- **Joueurs** qui veulent refaire ou améliorer leur setup (périphériques, ambiance, RGB).
- **Télétravailleurs** qui aménagent un bureau à domicile (ergonomie, encombrement, rendu agréable).
- Point commun : aucune compétence 3D, public anglophone (interface en anglais).

## Proposition de valeur
Une app web 3D, en anglais, pour prévisualiser et designer son setup avant d'acheter, sans compétence en 3D. Elle répond à deux questions :
1. **"Est-ce que ça rentre ?"** : dimensions réelles, alertes de profondeur, débordement, encombrement.
2. **"Est-ce que ce sera beau ?"** : couleurs, matières, styles en un clic, ambiance, déco (après le MVP).

## Différenciation (vs Corsair Atelier)
- Neutre vis-à-vis des marques.
- Basée sur les dimensions réelles (mm).
- Centrée sur l'esthétique globale du setup (pièce, déco, ambiance), pas seulement le matériel.

## Objectifs
- Objectif principal : **apprendre** (monter une app 3D web complète avec une équipe d'agents).
- Objectif secondaire : **publier** si le MVP est concluant.

## Périmètre MVP ("est-ce que ça rentre ?")
- Choix d'un bureau aux dimensions réelles (catalogue + dimensions personnalisées).
- Éléments génériques paramétrables : écran, boîtier PC, clavier, souris, tapis, support manette, bras d'écran, enceintes, lampe.
- Ajout, déplacement à la souris, rotation, suppression, duplication.
- Navigation 3D autour de la scène.
- Alertes "ça ne rentre pas" : profondeur, débordement, encombrement (collisions).
- Sauvegarde locale du setup + export/import JSON (validé par le PO, 2026-10-19).
- Interface entièrement en anglais, unités métriques (mm/cm), pas de pouces au MVP.

## Vision long terme (l'architecture doit la permettre dès le départ)
Livrée release après release (détail dans `docs/backlog.md`, section "Plus tard") :
- R2 Style : couleurs/matières par objet, styles en un clic (all white, all black, coloré, cosy).
- R3 Ambiance : éclairage réaliste, LED/RGB, jour/soir, mur et déco murale.
- R4 Déco : étagères, figurines, plantes, posters, bibliothèque de modèles 3D libres.
- R5 Courses : liste avec prix total, catalogue de produits réels neutre vis-à-vis des marques.
- R6 Communauté : comptes, partage de setups, inspiration.
- R7 Import : objets personnels via photo vers 3D (IA).
- R8 Réalité augmentée sur mobile.

Conséquences d'architecture : modèle de données du setup sérialisable et versionné ; objets décrits par un schéma (dimensions, paramètres, matériaux, slots de style) ; catalogue extensible et indépendant du code ; séparation scène 3D / état applicatif / interface ; i18n dès le départ (anglais par défaut ; le français pourra être ajouté comme langue secondaire en release ultérieure, option non engagée) ; matériaux et éclairage modifiables sans refonte.

## Hors périmètre (MVP)
Comptes utilisateurs et backend, partage en ligne, prix et catalogue de produits réels, couleurs/matières/styles, éclairage avancé et RGB, murs et déco, import de modèles ou photo vers 3D, réalité augmentée, langues autres que l'anglais (le français est une option future, non engagée), pouces/unités impériales, monétisation.

## Indicateurs de succès
- Un utilisateur novice compose un setup de 5 objets en moins de 5 minutes sans aide.
- 100 % des cas de débordement/collision de test détectés (tests automatisés).
- Performance : ≥ 60 FPS desktop milieu de gamme, ≥ 30 FPS smartphone récent.
- Qualitatif : sur 5 testeurs, au moins 4 disent que l'app les aiderait à décider d'un achat.

## Hypothèses et risques
| # | Hypothèse / risque | Mitigation |
|---|---|---|
| H1 | Objets génériques simples (boîtes aux proportions réalistes) au MVP : suffisent pour répondre à "ça rentre ?". **Validé par le PO (2026-10-19)** | Prototype tôt, test avec 3 à 5 utilisateurs |
| H2 | Pas de compte ni backend au MVP ; sauvegarde locale + export/import JSON. **Validé par le PO (2026-10-19)** | n/a |
| H3 | Desktop d'abord, tactile en Could. **Validé par le PO (2026-10-19)** | n/a |
| H4 | Unités métriques mm/cm uniquement. **Validé par le PO (2026-10-19)** | n/a |
| H5 | Seuils d'alerte par défaut (70 % d'occupation, 100 mm de marge de profondeur, 150 mm de zone libre devant le clavier) acceptés comme valeurs par défaut ajustables. **Validé par le PO (2026-10-19)** | Configurables |
| R1 | Qualité visuelle perçue faible avec des objets génériques | Direction artistique 3D tôt (technical-artist), presets de matériaux préparés |
| R2 | Performances sur mobile | Budgets de perf, assets optimisés, QA perf à chaque story 3D |
| R3 | Licences des assets 3D libres (long terme) | Registre `docs/design/3d/licences-assets.md` dès le début |
| R4 | Photo vers 3D par IA : coût et qualité incertains | Hors MVP, spike dédié avant engagement |
| R5 | Données de produits réels (prix, dimensions) difficiles à maintenir | Hors MVP ; source de données à étudier en R5 |
