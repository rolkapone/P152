# Revue : fix/ci-e2e-runner-timeouts (PR #2)

## Cycle 1 : APPROVE (2026-10-21)

Diff : `playwright.config.ts`, `tests/e2e/scene-ui.spec.ts`, `docs/qa/ci-e2e-runner.md`. Aucun code applicatif touché.

### Exécuté
- `pnpm lint`, `pnpm typecheck`, prettier sur les 3 fichiers : OK.
- `pnpm build:e2e && pnpm test:e2e` en config locale : 48/48 (1,3 min).
- CI de la PR (run 39502884150), lue une fois : tout est vert sauf `security / dependencies & licences`, étape Dependency review (« Dependency graph » non activé dans les réglages du dépôt, sans lien avec la PR). e2e et CodeQL étaient alors en attente.

### Bloquant
Aucun.

### Non bloquant
1. Le merge reste bloqué par Dependency review tant que le Dependency graph n'est pas activé (réglage du dépôt, accord du PO), ou tant que l'étape n'est pas rendue tolérante. Le résultat e2e sur le vrai runner doit aussi être confirmé.
2. playwright.config.ts:25 : le timeout de 90 s ne masque aucun budget (perf.spec garde ses budgets draw calls et triangles), mais le temps de chargement de la scène n'est contrôlé nulle part. Story ultérieure : mesurer le temps jusqu'à `ready` dans perf.spec, puis poser un budget large en CI.
3. scene-ui.spec.ts:20-23 : `pauseClock` est correct. Compléter son commentaire : la marge de 60 s doit dépasser la latence d'un aller-retour CDP, et tout futur timer de moins de 60 s se déclenchera pendant le saut.
4. `expect.timeout` de 15 s : les assertions négatives ne sont pas fragilisées (elles passent immédiatement, sous horloge en pause).
5. docs/qa/ci-e2e-runner.md:7 : « 2 runs sur 5 » ne correspond pas au tableau (2 runs) ; préciser qu'il s'agit de deux séries.

### Vérifié
Aucune assertion assouplie, `retries: 0` ; les découpages d'UX-12 et UX-14 gardent la même couverture (et isolent mieux les échecs) ; la config locale ne change pas (30 s / 5 s) ; les timeouts sont proportionnés (marge de 3×, job limité à 20 min).

### Critères
- [x] Timeouts du runner traités (3×48/48 en conteneur à 2 CPU) ; confirmation sur le runner en attente.
- [x] Instabilité d'UX-8 corrigée.
- [x] Aucune assertion assouplie, même couverture, config locale inchangée.
- [ ] CI de la PR verte : bloquée par le réglage Dependency graph.
