# ADR-APP-04 — Persistance locale : `localStorage` derrière un repository asynchrone ; export/import par fichier

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** US-018 : sauvegarde automatique, restauration à l'identique, donnée corrompue ou ancienne migrée ou ignorée sans planter, export/import JSON. Un seul setup courant au MVP (≈ 5-30 Ko). Plus tard : plusieurs setups, vignettes, modèles importés (R7, binaires de plusieurs Mo), synchronisation cloud (R6).

**Décision.**
- **Interface `SetupRepository`** (ADR-APP-09) **asynchrone dès le MVP** : `loadCurrent()`, `saveCurrent(setup)`, `clear()` ; l'UI et le store ne connaissent que l'interface.
- **Adapter MVP : `localStorage`**, clé `p152:v1:setup:current`, valeur = l'enveloppe JSON exportable (même format que l'export : un seul format partout). Préférences (guide fermé, panneaux, magnétisme) sous `p152:v1:prefs`, validées elles aussi par schéma.
- **Autosave** : abonnement au `documentStore`, écriture débouncée (400 ms) + écriture immédiate sur `visibilitychange: hidden` et `pagehide` (l'écriture synchrone de `localStorage` y est fiable). Indicateur « Saved in this browser » / « Couldn't save in this browser » (quota, mode privé restrictif) sans bloquer l'édition.
- **Lecture au démarrage** via `parseSetup` (ADR-APP-03). Donnée invalide : copie conservée sous `p152:v1:setup:recovered` (une seule, écrasée), setup vierge chargé, message non bloquant avec option « Export the unreadable data » pour ne rien perdre. Ancienne version : migrée puis réécrite.
- **Plusieurs onglets** : événement `storage` écouté ; si un autre onglet modifie le setup, bandeau « This setup was changed in another tab. Reload? » (dernier écrivain gagne sinon). Pas de verrouillage au MVP.
- **Export** : `JSON.stringify` indenté de l'enveloppe → `Blob` → lien `download` temporaire (`URL.revokeObjectURL` ensuite), nom de fichier assaini `p152-<slug-du-nom>-<AAAA-MM-JJ>.json` (slug `[a-z0-9-]`, 40 caractères max). Ni sélection ni état d'UI exportés.
- **Import** : `<input type="file" accept=".json,application/json">` (et glisser-déposer plus tard), contrôle de taille avant lecture, `File.text()`, `parseSetup`, puis confirmation « Replace current setup? » (S5) et **commande `replaceSetup` annulable** (l'import n'efface pas l'historique : Ctrl+Z revient au setup précédent).
- **Bascule vers IndexedDB** planifiée dès qu'une story exige plusieurs setups ou des binaires (au plus tard R4/R7) : nouvel adapter `IndexedDbSetupRepository` (lib `idb`), migration unique `localStorage → IndexedDB` au démarrage, aucun changement hors `persistence/`.

**Conséquences.**
- (+) Zéro dépendance, API synchrone fiable à la fermeture de page, facile à inspecter et à piloter en E2E.
- (+) L'interface asynchrone rend la bascule IndexedDB ou cloud transparente pour le reste de l'app.
- (−) Quota ≈ 5 Mo et écriture bloquante : sans impact à 30 Ko, mais à ne pas utiliser pour des vignettes ou des modèles.
- (−) Données perdues si l'utilisateur vide son navigateur : rappelé dans l'aide, mitigé par l'export.

**Alternatives écartées.**
1. **IndexedDB dès le MVP** : bon choix à terme, mais asynchrone (écriture non garantie dans `pagehide`), API verbeuse ou dépendance, et aucun besoin MVP ne l'exige ; l'abstraction permet de l'adopter sans réécriture.
2. **OPFS (Origin Private File System)** : pensé pour de gros fichiers et du travail en worker ; disproportionné et support des écritures synchrones limité aux workers.
3. **Persistance dans l'URL (setup encodé dans le hash)** : pratique pour partager, mais longueur limitée, historique du navigateur pollué, et toute URL devient une entrée non fiable ; gardé comme option de partage sans backend (ADR-APP-09).
4. **File System Access API (sauvegarde directe sur disque)** : non supportée par Firefox et Safari ; l'export/import par téléchargement couvre le besoin partout.
