# SEC-06 — Durcissement CI (findings LOW du scan US-001)  [Could | 2 pts, priorité basse]

> Statut : **TODO** · Voie : à attribuer au planning (`socle:scrum-master`) · 2 pts · Could · Epic A — Fondations techniques. Index : [backlog](../backlog.md). Dette rattachée : [dette.md](../dette.md).

En tant qu'équipe, je veux traiter les findings LOW du scan US-001 afin de réduire la surface de la chaîne CI. À planifier après SEC-01 (peut être pris en tâches dans SEC-01 si de la place).
Critères d'acceptation :
- [x] `persist-credentials: false` sur les `actions/checkout` des jobs `quality`, `unit`, `build` et `assets` de `ci.yml` (zizmor sans alerte `artipacked`). *(fait dans SEC-01, branche non mergée)*
- [x] `id-token: write` retiré de `security-scheduled.yml` (permissions minimales par job). *(fait dans SEC-01, branche non mergée)*
- [x] `security-scheduled.yml` exécute aussi gitleaks (historique complet) et CodeQL en hebdomadaire. *(fait dans SEC-01, branche non mergée)*
- [ ] zizmor est installé à version et empreinte fixées (hash vérifié), plus via `uvx` sans empreinte.
- [ ] Dependabot (`docker-compose`) suit les digests des images semgrep et playwright, ou une procédure de mise à jour documentée les remplace.
- [x] L'agrégateur `security` de `ci.yml` traite un job `skipped` comme un échec (aujourd'hui seuls `failure` et `cancelled` font échouer l'agrégation ; aligner sur `ci-ok`, qui exige `success`). *(fait dans SEC-01, branche non mergée)*
- [ ] Migration d'ESLint 9 (déprécié) vers la version supportée, ADR consigné, `pnpm check` vert.
- [ ] *(MEDIUM, scan SEC-01)* `ci.yml:117` : `--config .gitleaks.toml` obligatoire sur la commande gitleaks ; un `CODEOWNERS` couvre `.gitleaks.toml` et `.github/` (voir aussi SEC-02).
- [ ] L'en-tête « Brouillon » de `scripts/check-licenses.mjs` et des brouillons de `docs/security/ci/` est retiré ou corrigé ; coquille « n est » corrigée.
- [ ] `docs/ci/local-run-SEC-01.md` est exact : persona auditor (7 low) et formulation « extraites sauf écarts signalés » corrigées.
- [ ] Les échecs de `security-scheduled.yml` déclenchent un agrégateur ou une notification (lien avec SEC-02).
- [ ] *(au premier push)* `upload-sarif` fonctionne dans le conteneur semgrep et `security-events: write` est géré pour les PR de forks.
- [ ] *(dette de test)* Un test sur 190 a échoué une fois dans `pnpm check` sous charge, puis est passé 6 fois : identifier le test instable (candidat probable : fuzz fast-check, timeout ou seed), le stabiliser (seed fixe ou timeout explicite) et le vérifier par 10 exécutions consécutives sous charge. Instabilité déjà tracée de `parseSetup.fuzz`.
- [ ] *(dette de test, US-004)* Les `waitForTimeout` restants de `tests/e2e/scene.spec.ts` (l.37, 39, 50, 53) sont remplacés par des attentes sur un état observable ou `page.clock` ; `open()` de `scene-ui.spec.ts` n'est plus sensible à la charge (attente d'un signal de scène prête). Règle : aucun test E2E ne dépend du temps réel. Vérifié selon la règle reformulée (référence CI 4 CPU / 8 Go, `--repeat-each=10` sans charge ; voir plus bas) au lieu de « CPU saturé » (juste après le merge US-004, le devops avait vu 1 à 4 échecs sur 3 runs ; 40/40 deux fois ensuite).
- [ ] *(LOW, scan US-004)* `@react-three/drei` est installé mais inutilisé, et ses helpers chargent des ressources depuis un CDN (contraire à la CSP). Soit la dépendance est retirée de `package.json` / lockfile, soit une règle de lint interdit ses imports qui chargent depuis un CDN (test de la règle dans `tests/unit/lint-rules.test.ts`).
- [ ] *(LOW, scan SEC-03a)* Test de non-divergence du CSS React Aria : `public/react-aria-pressable.css` est comparé au style que la version installée de React Aria injecterait (échec à la mise à jour de la dépendance si divergence).
- [ ] *(LOW, scan SEC-03a)* Les chemins de `.semgrep/p152.yml` sont ancrés (pas de motif qui déborde sur d'autres dossiers) ; test de la règle.
- [ ] *(LOW, scan SEC-03a)* Le contrôle CI des en-têtes (`sec-build-hardening`) est étendu à `style-src`, `connect-src` et `worker-src`.
- [ ] *(suggestion revue SEC-03a)* Note dans le README sur la preview : `upgrade-insecure-requests` et HSTS (comportement en `http://localhost`, Safari, HSTS mémorisé).
- [ ] *(suggestion revue SEC-03a)* Le test `skipIf` de `security-headers` ne peut plus masquer un échec (il échoue si `dist/` est absent en CI) ; `apply: () => true` du plugin est justifié ou remplacé par une condition explicite.
- [ ] *(suggestion revue SEC-03a)* `csp.spec` utilise `waitForScene` (signal de scène prête) au lieu d'une attente implicite.
- [ ] *(suivi SEC-03a, à traiter par la première story qui ajoute une modale ou un popover)* `usePreventScroll` de React Aria (overlays, modales) injecte un `<style>` au runtime, contraire à `style-src` : la story concernée doit prévoir le même correctif (feuille statique) ou une alternative, avec test E2E sous CSP. Non traité ici faute de composant concerné.
- [ ] *(suivi PR #2, qa-tester)* `perf.spec` vérifie un budget de temps de chargement de la scène (seuil proposé par le qa-tester, valeur validée par le PO) ; le commentaire de `pauseClock` est corrigé pour refléter son comportement réel ; `docs/qa/ci-e2e-runner.md:7` est précisé (formulation corrigée selon la revue).
- [ ] *(règle « 10 runs E2E sous charge », reformulée)* La règle « 10 exécutions sous charge CPU sans limite » est abandonnée (impossible à tenir par construction). Définition de `docs/reviews/SEC-03a.md` : (1) référence CI : 10 runs `CI=1 pnpm test:e2e` dans l'image Playwright épinglée limitée à `--cpus=4 --memory=8g`, 0 échec ; (2) stress local informatif : charge à 50 % des threads logiques, 4 workers, 10 runs, 0 échec dû à une assertion ou à une attente de test ; (3) contrôle de conception : `--repeat-each=10` vert sans charge et aucun `waitForTimeout` dans `tests/e2e`. Remplace le critère de 10 runs sous charge ci-dessus.
Notes techniques / dépendances : devops + secdevops. Source : `docs/security/scans/US-001.md`, scan SEC-01, scan et revue SEC-03a. Hors total MVP (Could).
