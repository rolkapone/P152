# Threat model — vision long terme (R2 à R8)

> Contient §7 (STRIDE long terme) et §9 « Plus tard (R2 à R8) ». Découpé du threat model initial (contenu inchangé, numérotation des sections conservée). Point d'entrée : [threat-model.md](threat-model.md).

## 7. STRIDE — vision long terme

### R2 / R3 — Styles, matériaux, éclairage

| Id | STRIDE | Menace | Brut | Mesures | Story |
|---|---|---|---|---|---|
| L-01 | E | `'wasm-unsafe-eval'` nécessaire aux décodeurs meshopt/Basis : relâchement de la CSP | LOW | ADR dédié ; décodeurs servis depuis l'origine (`public/`, versions épinglées, empreinte vérifiée au build), jamais depuis un CDN ; contrôle CI : `'unsafe-eval'` toujours interdit | SEC-10 |
| L-02 | D | Textures/HDRI lourdes : saturation mémoire GPU mobile | LOW | Budgets `check:assets` (taille, résolution KTX2) | ADR-3D-04 |
| L-03 | T | `materialId` ou `stylePreset` inconnus dans un setup importé | LOW | Validation sémantique (ADR-APP-03 §6) | ADR |

### R4 — Déco et bibliothèque de modèles libres

| Id | STRIDE | Menace | Brut | Mesures | Story |
|---|---|---|---|---|---|
| L-10 | T (juridique) | Modèle « libre » sans droits réels (extraits de jeux, NC utilisé commercialement, CC-BY sans attribution) | MEDIUM | Liste des licences admises (CC0, CC-BY 4.0 avec attribution affichée dans l'app), provenance enregistrée (URL source, auteur, date, empreinte SHA-256), contrôle CI | SEC-11 |
| L-11 | D / E | glTF piégé : `uri` externes (pistage, requêtes sortantes), data URI géantes, accesseurs démesurés, bombe de décompression meshopt/KTX2, bug de parseur | MEDIUM | Pipeline d'ingestion : `gltf-validator` sans erreur, ré-export complet par `gltf-transform` (supprime extensions inconnues et `uri` externes), budgets triangles/poids/texture, `connect-src 'self'` ; three.js tenu à jour | SEC-11 |
| L-12 | T | Catalogue ou assets servis depuis une autre origine (bucket) altérés | MEDIUM | Servis depuis l'origine de l'app, fichiers hachés ; manifeste versionné avec SHA-256 par fichier, vérifié avant usage ; validation par schéma | SEC-12 |

### R5 — Catalogue de produits réels, prix, liens d'affiliation

| Id | STRIDE | Menace | Brut | Mesures | Story |
|---|---|---|---|---|---|
| L-20 | S / T | **Liens sortants détournés** (catalogue compromis, URL injectée via un setup importé ou partagé) vers phishing/malware, ou redirection ouverte via un endpoint `/go?url=` | **HIGH** | Le setup ne stocke qu'un `productId`, **jamais d'URL** ; les URL viennent uniquement du catalogue de confiance ; liste blanche de domaines marchands, `https:` obligatoire, schéma Zod ; `rel="noopener noreferrer sponsored"` ; aucun endpoint de redirection prenant une URL en paramètre (identifiant seulement) | SEC-20 |
| L-21 | T (juridique, réputation) | Prix faux ou périmés (pratique commerciale trompeuse, règles d'indication des prix) | MEDIUM | Date et source du prix affichées, mention « prices may vary », péremption automatique (prix masqué au-delà de N jours), contrôle de fraîcheur en CI/cron | SEC-21 |
| L-22 | I (juridique) | Pistage tiers via scripts/pixels d'affiliation (consentement ePrivacy/CNIL), affiliation non déclarée (transparence, public anglophone : règles FTC) | MEDIUM | Liens simples uniquement, aucun script tiers ; mention claire « affiliate links » près des liens ; politique de confidentialité à jour ; neutralité : le classement ne dépend pas de la commission (question PO §12 q.1) | SEC-20 |
| L-23 | I / E | Clés d'API marchands/affiliation exposées côté client ; SSRF si le backend récupère des URL produits arbitraires | MEDIUM | Clés uniquement côté serveur (secret manager) ; récupération limitée à une liste blanche d'hôtes, sans suivi de redirections vers d'autres hôtes, sans adresses privées | SEC-21 |

### R6 — Comptes, partage, galerie communautaire

| Id | STRIDE | Menace | Brut | Mesures | Story |
|---|---|---|---|---|---|
| L-30 | S | Prise de contrôle de compte (credential stuffing, phishing, réinitialisation faible) | HIGH | Fournisseur d'auth managé ; passkeys/OAuth en priorité ; si mot de passe : longueur ≥ 12, vérification contre les mots de passe compromis ; MFA disponible ; rate limiting et verrouillage progressif ; messages non énumérants ; email de notification de connexion inhabituelle | SEC-31 |
| L-31 | I / E | Jeton de session volé par XSS (ex. JWT stocké dans `localStorage`, comportement par défaut de certains SDK BaaS) | HIGH | Cookies `HttpOnly; Secure; SameSite=Lax` ou jeton en mémoire à courte durée de vie + refresh rotatif ; CSP stricte maintenue ; révocation des sessions ; durée de vie bornée | SEC-31 |
| L-32 | E / I | **IDOR / BOLA** : lire ou modifier le setup d'un autre ; RLS désactivée ou trop large sur une table exposée par la clé publique (incident fréquent avec les BaaS) | **CRITICAL** | Refus par défaut ; RLS sur toutes les tables (si Supabase) ; clé `service_role` jamais côté client ; tests automatisés d'autorisation (utilisateur A ne peut ni lire ni écrire B, anonyme ne peut rien écrire) ; revue secdevops de chaque politique | SEC-32 |
| L-33 | I | Liens de partage devinables, setups privés exposés, énumération | MEDIUM | Identifiants aléatoires ≥ 128 bits (`crypto.randomUUID`), privé par défaut, statut « non listé » distinct de « public », révocation du lien | SEC-32 |
| L-34 | T / I | **XSS stockée via UGC** (nom, description, pseudo, commentaires, balises Open Graph générées côté serveur) | HIGH | Validation serveur avec le même `parseSetup` (ADR-APP-09) ; texte brut uniquement (pas de HTML/Markdown HTML) ; si texte riche : DOMPurify + liste blanche ; échappement des méta OG ; CSP | SEC-34 |
| L-35 | D | Spam, bots, inscription en masse, abus de stockage (« denial of wallet ») | MEDIUM | Rate limiting par IP et par compte, quotas (setups, images), CAPTCHA respectueux de la vie privée si nécessaire (impact CSP et RGPD à évaluer), alertes de coût | SEC-35 |
| L-36 | — (conformité) | **RGPD** : base légale, information, droits (accès, export, effacement), conservation, sous-traitants (DPA), transferts hors UE, violation à notifier sous 72 h ; **mineurs** (public gaming : âge du consentement numérique, 15 ans en France) ; **DSA** pour l'hébergement de contenus (signalement, motivation des décisions, point de contact) | HIGH | Registre des traitements, politique de confidentialité, export/suppression du compte en self-service, durées de conservation, DPA et hébergement UE de préférence (question PO §12 q.3), procédure de violation, CGU, âge minimum (question PO §12 q.2) ; signalement et modération (lien US-143) | SEC-33, SEC-34 |
| L-37 | R | Actions de modération ou suppressions contestées, sans trace | MEDIUM | Journal d'audit immuable des actions sensibles (modération, suppression, changement de rôle, connexion admin) | SEC-36 |
| L-38 | I | Logs contenant jetons, emails, contenus | MEDIUM | Hygiène des logs : pas de secret ni jeton, emails pseudonymisés, rétention limitée | SEC-36 |
| L-39 | E | Compte admin/modérateur compromis | HIGH | MFA obligatoire (clé matérielle/passkey), rôles minimaux, interface d'admin séparée, revue périodique des accès | SEC-31, SEC-36 |
| L-40 | T | CSRF (si sessions par cookie), CORS trop permissif | MEDIUM | `SameSite=Lax` + vérification `Origin` ou jeton anti-CSRF sur les mutations ; CORS en liste blanche explicite, jamais `*` avec credentials | SEC-31 |
| L-41 | I | Images de setup partagées : métadonnées EXIF (localisation), contenus illicites | MEDIUM | Images générées par l'app (capture canvas, sans EXIF) de préférence ; tout upload ré-encodé côté serveur, métadonnées supprimées ; domaine séparé pour les contenus utilisateurs | SEC-34 |
| L-42 | D | Partage sans serveur via fragment `#` d'URL : setup compressé arbitraire | LOW | Même `parseSetup`, limite de taille appliquée **après** décompression (bombe de décompression) | SEC-34 |

### R7 — Import photo vers 3D par IA, upload de modèles glTF

| Id | STRIDE | Menace | Brut | Mesures | Story |
|---|---|---|---|---|---|
| L-50 | E / D | Fichier uploadé malveillant (polyglotte, exploit de parseur d'image, bombe de décompression, taille démesurée) contre les workers de traitement | HIGH | Taille max avant upload et côté serveur ; vérification par octets magiques (pas par extension) ; formats fermés (JPEG/PNG/WebP, GLB), **SVG refusé** ; ré-encodage dans un bac à sable (sans réseau, utilisateur non-root, limites CPU/mémoire/temps, éphémère) ; bibliothèques à jour | SEC-40 |
| L-51 | T / I | Modèle uploadé servi aux autres utilisateurs (XSS si mauvais `Content-Type`, `uri` externes, contenu volé) | HIGH | Origine distincte pour les contenus utilisateurs (pas de cookie, CSP restrictive), `Content-Type` forcé, `nosniff`, `Content-Disposition` ; conversion systématique en GLB via `gltf-transform` ; même validation que L-11 ; URL signées à courte durée | SEC-40 |
| L-52 | I (conformité) | **Photos = données personnelles** (visages, intérieur du domicile, EXIF GPS, reflets) envoyées à un fournisseur IA (transfert hors UE, réutilisation pour l'entraînement) | HIGH | Suppression des EXIF côté client avant envoi ; consentement explicite et information ; suppression de la photo source après génération (rétention courte) ; DPA avec le fournisseur, refus de l'entraînement, région UE si possible (question PO §12 q.3) | SEC-42 |
| L-53 | I / D | **Clé d'API IA exposée** ou abus des générations (coût) | HIGH | Appels IA uniquement côté serveur (ADR-APP-09) ; clé dans un secret manager ; authentification obligatoire ; quotas par utilisateur et plafond global ; alertes budgétaires ; idempotence des demandes | SEC-41 |
| L-54 | T (juridique) | Contenus générés illicites ou contrefaisants | MEDIUM | Signalement/modération (SEC-34), CGU, retrait sur notification | SEC-34 |
| L-55 | E | SSRF si import « depuis une URL » | MEDIUM | Pas d'import par URL, ou proxy de sortie à liste blanche, sans IP privées ni redirections | SEC-40 |
| L-56 | T | Injection de prompt si un modèle multimodal produit des métadonnées (dimensions, nom) | LOW | Sortie du modèle traitée comme donnée non fiable : validée par schéma, jamais exécutée ni rendue en HTML | SEC-41 |

### R8 — Réalité augmentée mobile

| Id | STRIDE | Menace | Brut | Mesures | Story |
|---|---|---|---|---|---|
| L-60 | I | Accès caméra/environnement plus large que nécessaire, transmission de données spatiales | LOW | Session `immersive-ar` sans la fonctionnalité `camera-access` ; aucune donnée d'ancrage/maillage envoyée à un serveur ; `Permissions-Policy: xr-spatial-tracking=(self)`, `camera=()` conservé | SEC-50 |
| L-61 | T | Export USDZ (Quick Look) | LOW | Généré localement depuis le setup validé ; aucun contenu externe | SEC-50 |

---

## 9. Stories de sécurité (reprises au backlog)

Les stories ci-dessous sont reprises dans [`docs/backlog.md`](../backlog.md) avec ces identifiants. **Le backlog fait foi** pour la priorité, l'estimation, les critères d'acceptation détaillés (y compris ceux de SEC-10 à SEC-50, sous chaque id) et le statut ; cette section donne l'origine (menaces couvertes) et un résumé.

### Plus tard (R2 à R8)

| Id | Titre | Release | Menaces |
|---|---|---|---|
| SEC-10 | Activation encadrée de `'wasm-unsafe-eval'` pour meshopt/KTX2 | R2 (1re story GLB/KTX2) | L-01 |
| SEC-11 | Ingestion sécurisée des modèles et textures tiers | R4 (avant US-121) | L-10, L-11 |
| SEC-12 | Intégrité du catalogue distant | R4/R5 (si le catalogue sort du bundle) | L-12 |
| SEC-20 | Liens sortants et affiliation sûrs et transparents | R5 (soumise à la question PO §12 q.1) | L-20, L-22 |
| SEC-21 | Intégrité et fraîcheur des données produits et prix | R5 | L-21, L-23 |
| SEC-30 | Révision du threat model et ADR de backend sécurisé | R6, avant toute story de compte | L-30 à L-42 |
| SEC-31 | Authentification et sessions sécurisées | R6 | L-30, L-31, L-39, L-40 |
| SEC-32 | Autorisation des setups et des liens de partage | R6 | L-32, L-33 |
| SEC-33 | Conformité RGPD | R6 (dépend des questions PO §12 q.2 et q.3) | L-36 |
| SEC-34 | Sécurité des contenus partagés (UGC) et modération | R6 (lié à US-142/US-143) | L-34, L-36, L-41, L-42, L-54 |
| SEC-35 | Anti-abus et maîtrise des coûts | R6 | L-35 |
| SEC-36 | Journalisation de sécurité, supervision et réponse à incident | R6 | L-37 à L-39 |
| SEC-37 | Domaine personnalisé sécurisé | seulement si le PO choisit un domaine (aucun pour l'instant) | M-25 |
| SEC-40 | Upload sécurisé et traitement isolé (photos, glTF) | R7 (avant US-151) | L-50, L-51, L-55 |
| SEC-41 | IA côté serveur : clé, quotas et coûts | R7 | L-53, L-56 |
| SEC-42 | Confidentialité des photos | R7 (dépend de la question PO §12 q.3) | L-52 |
| SEC-50 | AR à permissions minimales | R8 | L-60, L-61 |

Les critères d'acceptation détaillés de SEC-10 à SEC-50 sont dans [`docs/backlog.md`](../backlog.md) (section « Plus tard », sous chaque id) : repris de la v1.0 de ce document (commit du kickoff, voir l'historique, §9) et adaptés aux décisions PO du 2026-10-19 (en-têtes via `config/security-headers.mjs`, page « Privacy » de SEC-04, pas de domaine personnalisé). Ils seront précisés à la révision de début de release.
