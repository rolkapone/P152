# Dette et suivi (fichier unique)

Regroupe les anciennes sections « Dette et suivi » du backlog (issues de US-003, US-004, US-005, US-006), dédoublonnées et classées par story de rattachement. Les décisions du PO sont dans [decisions.md](decisions.md). Les critères déjà ajoutés aux fiches (par exemple SEC-06) restent dans les fiches : ici, un renvoi.

## Hors story (à rattacher au sprint en cours ou à SEC-06)
- (developer / devops, issu de US-003) `from ".."` refusé à tort dans `core` (`eslint.config.js:22`) : corriger la règle de frontières de couches et ajouter un test du lint ; le test TS7026 devient un vrai test de compilation (`tsc` sur fixture, échec attendu vérifié) ; branche inatteignable de `withDefaults` : la supprimer ou la couvrir par un test.
- (issu de US-003) Première story qui crée un module dans `src/state` : créer en même temps le seuil de couverture de `src/state` dans la config Vitest (critère d'acceptation de cette story).
- (issu de US-005) Timeouts de 5 s des tests unitaires lourds sous charge (SEC-06, developer).
- (issu de US-005) UX-7 à reformuler (ux-designer) : le dock suit la zone libre à l'ouverture d'un volet. À arbitrer avec UX-21 (barre décentrée de 124 px quand le volet gauche est replié : accepté par la QA et le contrôle design).

## Suivi ouvert (constats du Sprint 3, 2026-11-01)
- `animation-duration: 0.01ms` sous mouvement réduit (`tokens.css`) : à aligner sur `0s`, comme D1 (PR #23). Rattachement à décider au planning du Sprint 4 (`socle:scrum-master`).
- Hook `commit-msg` en panne dans un worktree git. Le secdevops a dû le contourner avec `SKIP_SIMPLE_GIT_HOOKS` après avoir lancé les vérifications à la main (SEC-08). Rattachement proposé : devops (outillage).
- `shell.spec.ts:76` « follows the system theme » a échoué une fois. À surveiller ; si récidive, ouvrir une story de correction (SEC-06 : tests dépendants de l'état, pas du temps réel).
- Alerte Scorecard #7 (License) : acceptée comme choix du PO, dépôt public avec `LICENSE` propriétaire (décisions 47 et 48, [SEC-07](stories/SEC-07.md)). Aucun paiement. Scorecard #5, #6 et #9 restent à traiter.

## SEC-06
Fiche : [stories/SEC-06.md](stories/SEC-06.md).
- drei (LOW) et dette de test (critères ajoutés à SEC-06, issus de US-004).
- Règle de lint `waitForTimeout` : variantes calculées, alias et déstructuration non couverts (issu de US-005).
- LOW `minimatch` (outil de dev), secdevops (issu de US-005) ; exception en cours : voir `docs/security/exceptions.md`.
- Test négatif pour `preset.name` (`src/core/catalog/schema.ts:69`) : vide, 81 caractères, clé de langue en trop ; rattachement proposé : SEC-06.
- `connectSceneDesk()` (`App.tsx:23`) abonné au niveau du module sans désabonnement (double abonnement HMR, dev seulement) ; SEC-06.
- Garde CodeQL >= high : [SEC-06a](stories/SEC-06a.md) (Sprint 3).

## US-007
- `deskSpec` compare un sous-ensemble de params (`desk.ts`) : à US-007, un 140×70 de hauteur différente resterait « Standard desk » (issu de US-006).
- « cm » passe à la ligne dans la colonne de 235 px (1366 et 1024 px : « 160 × 140 cm », « 180 × 160 cm », « Corner desk large ») : mineur QA, ui-designer ; rattachement proposé : marge ou US-007.

## US-008 et US-009
- US-004, US-008, US-009 : `z.looseObject` dans `StudioSceneSchema` ; les générateurs ne doivent lire que des champs validés (test dédié).
- Ombre de contact jugée lourde sous un bureau vide (mineur QA de US-004) : à l'origine rattachée à US-008 ; traitée par la décision 31 dans US-006.

## US-012 ou US-017
- Mineur QA, prochaine story qui touche `src/` caméra : Reset après Top en mode animé laisse 35 à 43 pixels différents de la vue par défaut (imperceptible) ; lisser la convergence dans `viewRig.ts` (graphics-engineer) ; critère : après Top puis Reset, la capture diffère de la vue par défaut de 0 pixel.
- `clampPoseInto` (`src/render/math/camera.ts`) sans garde explicite si le rayon permis < `minDistance` (inatteignable aujourd'hui ; avec US-012 ou US-017). Non bloquant, issu de la revue de US-006.

## US-018
- Libellés `tooLarge` (« 1 MB » alors que la limite est 1 Mio) et `tooManyObjects` à valider par l'ux-designer (décision 29 : `tooLarge` gardé en « 1 MB » ; `tooManyObjects` reformulé).
- `NO_CONTROL_CHARS` laisse passer les caractères C1 et bidi (risque d'usurpation visuelle des noms).
- Restriction d'import de `zod` étendue à tout `src/` et E2E CSP sur le vrai `dist` (le jitless de Zod dépend de l'ordre d'import).

## US-019 ou US-021
- `sameSetupDesk` (`src/core/commands/desk.ts`) compare des params littéraux : normaliser avant de comparer (revue de US-006, non bloquant).

## US-021 et US-022 (mesures)
- Palier de qualité : bascule automatique et fiabilité des E2E sous charge (US-022) ; le palier peut aussi être pris par US-021 si le tactile est engagé avant (issu de US-004).
- FPS sur un vrai smartphone (l'émulation Pixel 7 n'est pas une mesure ; US-021, ou ponctuellement avant la release MVP), FPS mobile réel (30 FPS non mesuré), contraste des icônes, Firefox (E2E et rendu, US-022), un à-coup isolé à 33,3 ms (light-1366, bureau 180×160, non reproduit).
- `--repeat-each=10` non réalisé (5 runs, 460/460 pour US-005 ; 2 runs, 244/244 pour US-006) : décision du PO, [sprint-2](sprints/sprint-2.md) Questions n° 3.
- `THREE.Clock` deprecated : créé par `@react-three/fiber` 9.8.2 ; non corrigeable sans R3F plus récent. Suivi à chaque mise à jour de R3F, rattaché à US-022.

## En attente du PO
- Budget du bundle 195 / 295 kB gz (mesuré 176,6 / 267,1) : à confirmer ([sprint-2](sprints/sprint-2.md), Questions n° 1).
- Dépendance `dependency-review-action` en v5 (majeure) acceptée par secdevops, hors critère de [SEC-08](stories/SEC-08.md) : à confirmer, puis décision.

## R4 et option i18n
- Nom de catalogue lu en `name.en` seulement (`src/core/catalog/desk.ts`, `deskChoices`) : exception à i18n (texte de catalogue, sans clé), à consigner par ADR ou décision ; reprise avec une 2e langue ([plus tard](backlog-plus-tard.md)).
- INFO (R4) : le `Text` du catalogue accepte les caractères de contrôle ; à durcir avant tout catalogue ouvert.

## Traité (pour mémoire)
- SEC-03a : correctif MEDIUM CSP React Aria. US-005 : texte neutre de l'état `failed`, mise à jour maquette / design-system §9 et §14 (info-bulle immédiate au focus clavier), budget de taille du shell : voir [archive/stories/SEC-03a.md](archive/stories/SEC-03a.md) et [archive/stories/US-005.md](archive/stories/US-005.md).
- (US-005) Mode direct du Sprint 3, PR #23 (2026-11-01) : `tokens.css` en mouvement réduit `0s !important`, retrait de `:where(.pane *)`, `fonts.css` en `url()` seul, boutons de la carte d'erreur en pleine largeur. Constat du 2026-11-01 : ces points étaient marqués « faits » mais absents du code ; corrigés en PR #23.
- (SEC-06, LOW #2 secdevops) Repli de `crypto.randomUUID` (`src/app/App.tsx`, secure context uniquement) : TypeError en HTTP sur IP du LAN. Repli `crypto.getRandomValues` et test, PR #23 (D3).
- Fuzz de `parseSetup` (PR #18, 2026-10-31 ; rouvert par la revue sécurité de US-006) : générateur sans clés interdites à toute profondeur, graine fast-check globale (`FC_SEED`). Contre-exemple `extensions.{"".{"".prototype}}` (graine 60940642) couvert ; le parseur était correct, le générateur ne filtrait que le premier niveau (LOW #1 secdevops).
