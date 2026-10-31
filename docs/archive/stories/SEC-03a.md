# SEC-03a — Génération des en-têtes de sécurité (`_headers`, CSP) et CSP de React Aria  [Must, avant le premier push | 2 pts]

> Archive : story **DONE** au Sprint 2. Voie : —. Index : [backlog](../../backlog.md). Dette de la story : [dette.md](../../dette.md).

**État au 2026-10-20 : DONE.** Mergée dans `main` (42c15cd). Revue APPROVE au cycle 1/3 (`docs/reviews/SEC-03a.md`) ; secdevops PASS (`docs/security/scans/SEC-03a.md`, Semgrep via Docker, 0 ERROR ; finding MEDIUM de US-004 clos). Les LOW et suggestions sont tracés dans SEC-06 et SEC-03b.
En tant qu'équipe, je veux que le build produise les en-têtes de sécurité afin que le contrôle `build-hardening` passe et que le premier push n'échoue pas.
Critères d'acceptation :
- [x] Étant donné `config/security-headers.mjs` (source unique), quand on lance le build, alors `public/_headers` est généré et `dist/_headers` existe avec CSP stricte sans `unsafe-inline`/`unsafe-eval`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP, HSTS.
- [x] Un test unitaire vérifie que le contenu de `dist/_headers` correspond à `config/security-headers.mjs` ; le contrôle `dist/_headers` de `sec-build-hardening` (ci.yml) est vert, sans avertissement toléré.
- [x] Le preview/E2E servi avec ces en-têtes ne produit aucune violation CSP en console.
- [x] *(finding MEDIUM du scan US-004)* React Aria `usePress` injecte un `<style>` inline au runtime, ce qui viole `style-src` d'ADR-OPS-06. Correction : `index.html` contient `<link rel="stylesheet" id="react-aria-pressable-style" href="/react-aria-pressable.css">`, le fichier `public/react-aria-pressable.css` existe (même contenu que le style injecté), **jamais `'unsafe-inline'`** ; un test E2E sous CSP de production échoue sur tout `securitypolicyviolation` et sur toute erreur console CSP, et vérifie qu'aucun `<style>` injecté par React Aria n'est présent.
Notes techniques / dépendances : devops + secdevops (+ developer pour le correctif React Aria). **Sprint 2, en tête, avant tout push** (décision secdevops : contrôle bloquant). Dépend de US-001 (DONE). Débloque SEC-01 (jobs) et US-022 (E2E sous CSP).
