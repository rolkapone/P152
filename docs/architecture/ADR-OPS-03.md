# ADR-OPS-03 — CI : GitHub Actions, jobs parallèles, actions épinglées par SHA, emplacements sécurité et E2E

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** US-001 : lint + tests + build visibles sur chaque PR. La QA ajoute Playwright (US-022), secdevops ses scans (US-002), le technical-artist ses budgets d'assets. `main` doit rester vert.

**Décision.** Un workflow `.github/workflows/ci.yml`, déclenché sur `push` (branche `main`) et `pull_request`, `permissions: contents: read` par défaut (élévation par job si nécessaire), `concurrency` avec annulation des exécutions obsolètes d'une même PR, `timeout-minutes` sur chaque job. Toutes les actions sont épinglées par **SHA de commit** (version en commentaire), mises à jour par Dependabot.

| Job | Contenu | Dépend de | Artefacts |
|---|---|---|---|
| `quality` | install, `format:check`, `lint`, `typecheck` | – | – |
| `unit` | `test:cov` (Vitest, seuils en cliquet ADR-APP-08) | – | rapport de couverture (lcov + HTML), 14 j |
| `build` | `build` de production, `check:bundle` (budget JS initial : 3D ≤ 300 Ko gz, ADR-3D-08 ; app shell budget propre fixé en US-005), **garde-fou « pas de hooks de test en prod »** (le bundle ne contient ni `__p152test` ni `__p152perf`), génération des en-têtes (`dist/_headers` depuis `config/security-headers.mjs`) : **revient à SEC-03a, pas encore livrée** (Sprint 2, avant le premier push) ; d'ici là le contrôle `dist/_headers` de `sec-build-hardening` échouerait, il ne s'exécute qu'au premier push | – | `dist/` (7 j), rapport de tailles |
| `assets` | checkout avec LFS, `check:assets` : budgets du technical-artist (triangles, poids, textures), validation glTF, **licence présente** dans `docs/design/3d/licences-assets.md`, **aucun fichier > 1 Mo hors LFS**. S'exécute si `assets/**` ou le script change (filtre de chemins), toujours sur `main` | – | rapport JSON |
| `e2e` *(emplacement qa-tester)* | télécharge `dist-e2e` (build avec `VITE_E2E=true`), lance `vite preview` avec les **mêmes en-têtes CSP**, Playwright (Chromium d'abord) dans l'image officielle épinglée (ADR-OPS-05), échec si violation CSP ou erreur console | `quality`, `unit` | rapport HTML, traces, captures, vidéos en cas d'échec (14 j) |
| `security` *(emplacement secdevops)* | bloc réservé et commenté `# SECDEVOPS-SLOT` : SAST (CodeQL ou Semgrep), audit des dépendances (`pnpm audit` / OSV-Scanner + `dependency-review-action` sur PR), scan de secrets (gitleaks), scan de conteneur si un jour une image est publiée | – | rapports SARIF |
| `ci-ok` | job agrégateur vide qui `needs` tous les autres (y compris `security` dès qu'il existe) | tous | – |

- **Cache** : pnpm via `actions/setup-node` (`cache: pnpm`, clé = lockfile) ; navigateurs Playwright mis en cache par version de Playwright ; cache Vite/ESLint/tsc **non** utilisé au départ (gain faible, risque de faux verts).
- **Build E2E distinct du build prod** : deux artefacts (`dist` sans hooks de test, déployable ; `dist-e2e` avec `VITE_E2E=true`, jamais déployé). Le job `build` vérifie que le premier est propre.
- **Protection de `main`** : seul `ci-ok` est « required check » ; merge uniquement par PR/merge `--no-ff` quand il est vert. *(Les règles de protection de branche sur dépôt privé exigent un plan payant : sur dépôt privé gratuit, la règle est tenue par processus par le devops ; voir ADR-OPS-07.)*
- **Reproductibilité locale** : `pnpm check` (hors E2E et assets) ; `pnpm test:e2e` en local ou `docker compose run --rm e2e` pour l'environnement Linux de la CI.
- **Déploiement hors `ci.yml`** : un workflow séparé `deploy.yml`, **absent tant que le PO n'a pas approuvé l'hébergement** (ADR-OPS-06).

**Conséquences.** (+) Retour rapide (jobs parallèles, ~3-6 min visés), chaque échec pointe un domaine (qualité, tests, build, assets, E2E, sécurité) ; les rôles QA et secdevops ont un emplacement stable sans conflits de fichier. (−) Épinglage par SHA = mises à jour à passer en revue (automatisées par Dependabot) ; E2E dépend du build, donc plus long que le reste.

**Alternatives écartées.**
1. **Un seul job séquentiel** : plus simple à lire, mais plus lent, et un lint qui échoue masque l'état des tests ; paralléliser coûte peu.
2. **GitLab CI / CircleCI / Jenkins** : rien de plus adapté ; le code est (très probablement) sur GitHub, GitHub Actions est gratuit en illimité sur dépôt public (2 000 min/mois sur privé), sans serveur à administrer. Jenkins impose d'héberger et patcher un serveur.
3. **Tags de version mobiles (`actions/checkout@v4`)** : plus lisibles, mais un tag peut être réécrit (cf. compromissions d'actions tierces) ; le SHA est immuable.
4. **Turborepo / Nx pour le cache de tâches** : inutile sur un package unique (ADR-APP-07) ; à reconsidérer avec un monorepo.
