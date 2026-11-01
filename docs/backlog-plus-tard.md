# Plus tard — vision long terme (stories de haut niveau, à détailler avant leur sprint)

Les ids US-1xx sont provisoires. Estimations indicatives (epic-level) ; toute story > 8 pts sera redécoupée. Les stories de sécurité SEC-1x et suivantes proviennent du threat model (§9, qui donne les menaces couvertes) et conditionnent les stories fonctionnelles de leur release. **Leurs critères d'acceptation font foi ici** (repris de la v1.0 du threat model, commit du kickoff, voir l'historique, adaptés aux décisions PO du 2026-10-19) ; ils seront précisés à la révision du threat model en début de release.

## Option i18n — Langue secondaire française (non engagée)
- US-100 — Traduction française de l'interface via les fichiers i18n existants [UI] ~3 (option, à décider par le PO)

## R2 — Style : couleurs, matières, styles en un clic
- US-101 — Couleur et matière par objet (noir mat, blanc, bois, métal, etc.) [UI][3D] [Should] ~8
- US-102 — Bibliothèque de matériaux PBR optimisés [3D] [Should] ~5
- US-103 — Styles en un clic : all white, all black, coloré, cosy (le style Cosy, plus chaud et plus sombre, est conservé) [UI][3D] [Should] ~8
- US-104 — Aperçu avant/après d'un style [UI] [Could] ~3
- **SEC-10 — Activation encadrée de `'wasm-unsafe-eval'` pour meshopt/KTX2** [Must à la 1re story qui charge un GLB/KTX2 | 1 pt | graphics-engineer + secdevops]
  Critères d'acceptation :
  - [ ] ADR consigné ; décodeurs servis depuis l'origine, versions épinglées, empreinte vérifiée au build.
  - [ ] `'wasm-unsafe-eval'` ajouté à `script-src` dans `config/security-headers.mjs` (source unique, SEC-03a) ; le contrôle CSP de `sec-build-hardening` accepte `'wasm-unsafe-eval'` et refuse toujours `'unsafe-eval'` ; E2E sans violation CSP.
Architecture : slots matière par pièce de modèle, presets de style en données (`assets/catalog/styles/styles.json` existe déjà).

## R3 — Ambiance : lumière, jour/soir, murs
- US-110 — Éclairage réaliste (ombres douces, environnement) [3D] ~8
- US-111 — LED/RGB (bandeaux, rétroéclairage, lampe colorée, animations) [UI][3D] ~8
- US-112 — Cycle jour / soir [UI][3D] ~5
- US-113 — Mur, couleur/texture du mur, sol [UI][3D] ~5
- US-114 — Déco murale (posters, cadres, étagères murales) [UI][3D] ~5
Architecture : pipeline de rendu extensible (post-traitements, budgets qualité par appareil). Spike WebGPU en début de R3.

## R4 — Déco et bibliothèque de modèles libres
- US-120 — Étagères, figurines, plantes, posters [UI][3D] ~8
- US-121 — Bibliothèque de modèles 3D libres (curation, licences, optimisation, Git LFS) [3D] ~8 — **dépend de SEC-11**
- US-122 — Recherche et filtres de la bibliothèque [UI] ~5
- US-123 — Placement sur surfaces autres que le bureau (étagères, sol) [3D] ~5
- **SEC-11 — Ingestion sécurisée des modèles et textures tiers** [Must | 3 pts | technical-artist + secdevops, lié à US-121]
  Critères d'acceptation :
  - [ ] Chaque asset a une provenance (URL source, auteur, licence SPDX, date, SHA-256) dans le registre (`docs/design/3d/licences-assets.md`) ; licences admises : CC0, CC-BY 4.0 (attribution affichée dans l'app) ; tout autre cas refusé en CI.
  - [ ] `gltf-validator` sans erreur ; ré-export `gltf-transform` ; aucune `uri` externe ; budgets respectés.
  - [ ] Jeu de tests avec glTF piégés (uri http, data URI géante, accesseur démesuré) rejetés.
- **SEC-12 — Intégrité du catalogue distant** [Should | 2 pts | R4/R5, seulement si le catalogue sort du bundle]
  Critères d'acceptation :
  - [ ] Manifeste versionné avec SHA-256 par fichier, vérifié avant usage ; servi depuis l'origine ; validation par schéma ; CSP inchangée ou ADR.
- Revue du threat model au début de R4.

## R5 — Courses et catalogue produits
- US-130 — Catalogue de vrais produits neutre vis-à-vis des marques (dimensions réelles) [UI] ~8
- US-131 — Liste de courses avec prix total [UI] ~5
- US-132 — Remplacer un objet générique par un produit réel [UI][3D] ~5
- US-133 — Mise à jour des prix et données produits (source à définir) ~8
- **SEC-20 — Liens sortants et affiliation sûrs et transparents** [Must | 3 pts]
  Critères d'acceptation :
  - [ ] Le setup ne contient que `productId` ; toute URL vient du catalogue de confiance, `https:` et domaine en liste blanche (rejet sinon, testé).
  - [ ] Liens rendus avec `rel="noopener noreferrer sponsored"` ; aucun endpoint de redirection prenant une URL.
  - [ ] Mention « affiliate links » visible ; aucun script ni pixel tiers ; page « Privacy » (SEC-04) mise à jour.
  Notes : soumise à la question d'affiliation du PO ; sans affiliation, retirer `sponsored` et la mention.
- **SEC-21 — Intégrité et fraîcheur des données produits et prix** [Should | 3 pts]
  Critères d'acceptation :
  - [ ] Source et date affichées ; prix masqué au-delà d'un âge configurable.
  - [ ] Secrets marchands uniquement côté serveur ; récupération limitée à une liste blanche d'hôtes (anti-SSRF).
- Revue du threat model au début de R5.

## R6 — Comptes, partage, communauté
- US-140 — Comptes utilisateurs et sauvegarde cloud [UI] ~8
- US-141 — Partage d'un setup par lien [UI] ~5
- US-142 — Galerie d'inspiration communautaire [UI] ~8
- US-143 — Modération et signalement ~5
- **SEC-30 — Révision du threat model et ADR de backend sécurisé** [Must, avant toute story de compte | 2 pts | secdevops]
  Critères d'acceptation :
  - [ ] Spike backend (Supabase ou API maison) évalué par secdevops : auth, RLS/autorisation, secrets, journalisation, localisation des données (question PO : hébergement UE), coût. ADR consigné.
  - [ ] Threat model révisé pour R6 (menaces L-30 à L-42).
- **SEC-31 — Authentification et sessions sécurisées** [Must | 5 pts]
  Critères d'acceptation :
  - [ ] Fournisseur managé ; passkeys/OAuth ; mots de passe ≥ 12 caractères vérifiés contre les fuites ; MFA disponible, obligatoire pour les admins.
  - [ ] Sessions en cookies `HttpOnly; Secure; SameSite=Lax` (ou jeton en mémoire + refresh rotatif), aucun jeton dans `localStorage` ; la déconnexion révoque la session ; protection CSRF et CORS en liste blanche.
  - [ ] Rate limiting sur connexion/inscription/réinitialisation ; messages non énumérants.
- **SEC-32 — Autorisation des setups et des liens de partage** [Must | 3 pts]
  Critères d'acceptation :
  - [ ] Refus par défaut ; suite de tests automatisés A/B/anonyme sur chaque ressource ; clé privilégiée jamais côté client.
  - [ ] Identifiants de partage aléatoires ≥ 128 bits, setups privés par défaut, liens révocables.
- **SEC-33 — Conformité RGPD** [Must | 5 pts | PO + secdevops + developer] (dépend des questions PO : âge minimum, hébergement UE)
  Critères d'acceptation :
  - [ ] Registre des traitements, politique de confidentialité, CGU, âge minimum (selon décision PO).
  - [ ] Export et suppression du compte en self-service ; durées de conservation appliquées.
  - [ ] DPA des sous-traitants ; procédure de notification de violation (72 h).
- **SEC-34 — Sécurité des contenus partagés (UGC) et modération** [Must | 5 pts | lié à US-142/US-143]
  Critères d'acceptation :
  - [ ] Validation serveur par `parseSetup` partagé ; texte brut uniquement ; méta OG échappées ; tests de XSS stockée.
  - [ ] Images ré-encodées sans métadonnées, servies depuis une origine dédiée ; limite de taille après décompression pour les partages par fragment d'URL.
  - [ ] Signalement, retrait et motivation des décisions (DSA).
- **SEC-35 — Anti-abus et maîtrise des coûts** [Must | 3 pts]
  Critères d'acceptation :
  - [ ] Rate limiting et quotas par compte/IP ; alertes budgétaires.
  - [ ] CAPTCHA seulement si nécessaire, impact CSP/RGPD consigné dans un ADR.
- **SEC-36 — Journalisation de sécurité, supervision et réponse à incident** [Must | 3 pts]
  Critères d'acceptation :
  - [ ] Journal d'audit des actions sensibles ; logs sans secret ni jeton.
  - [ ] Alertes (pics d'échecs de connexion, erreurs d'autorisation) ; runbook de réponse à incident.
- **SEC-37 — Domaine personnalisé sécurisé** [Should | 1 pt, seulement si le PO choisit un domaine ; aucun domaine pour l'instant]
  Critères d'acceptation :
  - [ ] DNSSEC, enregistrement CAA, verrou registrar + MFA sur le compte registrar.
  - [ ] HSTS `includeSubDomains` ; procédure anti sous-domaine orphelin (supprimer les CNAME avant le projet Pages).
- Dépendances : US-140 à US-143 dépendent de SEC-30 à SEC-36.

## R7 — Import d'objets personnels
- US-150 — Spike : faisabilité photo vers 3D par IA (coût, qualité) ~3
- US-151 — Import photo vers objet 3D [UI][3D] ~8 — **dépend de SEC-40 à SEC-42**
- US-152 — Calage des dimensions réelles d'un objet importé [UI][3D] ~5
- **SEC-40 — Upload sécurisé et traitement isolé (photos, glTF)** [Must | 5 pts]
  Critères d'acceptation :
  - [ ] Taille et type vérifiés (octets magiques) côté client et serveur ; SVG refusé.
  - [ ] Ré-encodage dans un bac à sable sans réseau avec limites de ressources ; conversion GLB.
  - [ ] Contenus servis depuis une origine dédiée avec `nosniff` et `Content-Disposition` ; pas d'import par URL (ou proxy à liste blanche).
- **SEC-41 — IA côté serveur : clé, quotas et coûts** [Must | 3 pts]
  Critères d'acceptation :
  - [ ] Clé uniquement dans un secret manager côté serveur ; authentification requise.
  - [ ] Quota par utilisateur et plafond global avec alerte ; sortie du modèle validée par schéma.
- **SEC-42 — Confidentialité des photos** [Must | 3 pts] (dépend de la question PO : hébergement UE)
  Critères d'acceptation :
  - [ ] EXIF supprimés avant envoi ; consentement explicite.
  - [ ] Photo source supprimée après génération ; DPA fournisseur sans entraînement sur les données ; information dans la politique de confidentialité.
Prérequis : threat model upload, quotas.

## R8 — Réalité augmentée mobile
- US-160 — Spike WebXR / alternatives ~3
- US-161 — Affichage du setup en AR à l'échelle réelle [UI][3D] ~8
- **SEC-50 — AR à permissions minimales** [Should | 1 pt]
  Critères d'acceptation :
  - [ ] Pas de `camera-access` ; `Permissions-Policy: xr-spatial-tracking=(self)` (dans `config/security-headers.mjs`) ; aucune donnée spatiale transmise.
  - [ ] CSP et en-têtes revus (contrôle `sec-build-hardening` mis à jour).

## Apparence (R2/R3, hors MVP)
- US-170 — Apparence « Liquid Glass » [UI] [Could] ~3 : choix optionnel (Standard / Liquid Glass) dans Help, désactivé par défaut, sans effet sur la mise en page ; repli sur le matériau standard avec `.no-glass` / `prefers-reduced-transparency` ; exploration : `docs/design/ui/maquettes/explorations/liquid-glass.html` ; critères : contraste AA vérifié sur fond de scène, coût GPU mesuré (≥ 60 FPS conservés), CSP inchangée. Voie probable : STANDARD. Décisions 33 et 51 ([decisions.md](decisions.md)).
