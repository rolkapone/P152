# E2E sur le runner GitHub : timeouts (run 39491128249)

## Diagnostic
Premier run CI : 8 échecs sur 44, tous `Test timeout of 30000ms exceeded` (UX-5, UX-11 Got it, UX-12 dans les 2 projets ; UX-8 en 1920), aucune assertion en échec (l'erreur `locator.click: Target ... closed` d'UX-5 est la conséquence du timeout). Sur le runner (2 vCPU, SwiftShader), un chargement de la scène prend environ 15 s (4-5 s en local) : un test qui charge deux fois (UX-11 avec rechargement, UX-12 clair puis sombre, UX-14) ou enchaîne des actions dépasse 30 s. Cause confirmée : budget de temps inadapté, pas un défaut applicatif.

## Second défaut, trouvé en reproduisant en conteneur limité
UX-8 échouait par intermittence (2 runs sur 5) avec `clock.pauseAt: Cannot fast-forward to the past` : le test lisait `Date.now()` puis appelait `pauseAt(now + 1 s)` ; sous charge, plus d'1 s s'écoule entre les deux. C'est un test instable (bug du test), corrigé par une marge de 60 s (`pauseAt` avance instantanément, la marge ne coûte rien) dans un helper `pauseClock` utilisé aussi par UX-4.

## Changements
- `playwright.config.ts` : en CI uniquement, `timeout` 90 s (30 s en local) et `expect.timeout` 15 s (5 s en local). Workers inchangés (2 en CI, adapté aux 2 vCPU). `retries: 0` conservé, aucune assertion assouplie.
- `tests/e2e/scene-ui.spec.ts` : UX-12 découpé en deux tests (clair, sombre), UX-14 en deux tests (1366x768, 683x384) ; helper `pauseClock`.
- Config locale inchangée.

## Résultats (image Playwright épinglée de ci.yml, `--cpus=2 --memory=7g --ipc=host`, `CI=1`, build:e2e dans le conteneur)
Suite complète, 48 tests (44 + 4 issus du découpage), 0 retry :
| Run | Résultat | Durée de `pnpm test:e2e` |
|---|---|---|
| Avant correction du helper (timeouts seuls) | 48/48 puis 47/48 (UX-8 pauseAt) | 6,2 min / 5,8 min |
| 1 | 48/48 | 6,1 min |
| 2 | 48/48 | 6,2 min |
| 3 | 48/48 | 6,2 min |

Le plus long test : environ 30 s ; marge de plus de 3x sur le timeout de 90 s. Durée estimée du job e2e sur le runner : environ 7 min en plus de l'installation et du build (limite du job : 20 min).
