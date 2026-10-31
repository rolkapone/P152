# Threat model — annexes

> Contient §10 (amendements aux stories existantes) et §13 (historique des versions). Découpé du threat model initial (contenu inchangé, numérotation des sections conservée). Point d'entrée : [threat-model.md](threat-model.md).

## 10. Amendements aux stories existantes

Tous les amendements ont été intégrés au backlog comme critères *(sécurité)*.

| Story | Critère ajouté | État |
|---|---|---|
| US-001 | `.npmrc`/`pnpm-workspace.yaml` avec `onlyBuiltDependencies` et `minimumReleaseAge` ; `.env` ignoré, `.env.example` factice ; `build.sourcemap` désactivé pour le build de production | **Fait et vérifié** (scan US-001 : `onlyBuiltDependencies: [esbuild, simple-git-hooks]`, `minimumReleaseAge: 4320`, `sourcemap: false`, `.env.example` sans valeur sensible) |
| US-003 | Le catalogue est validé par schéma (clés de prototype rejetées, bornes cohérentes `min ≤ défaut ≤ max`) en test | Au backlog |
| US-008 / US-009 | Les paramètres de tessellation sont dérivés de valeurs bornées et plafonnés ; un test vérifie le nombre de triangles aux bornes min et max de chaque paramètre (≤ 10k) ; US-009 : détection de cycle `mount` en test | Au backlog |
| US-018 | Fixtures malveillantes dans `tests/fixtures/setups/malicious/` (> 1 Mio, `__proto__`/`constructor` à tous les niveaux, 51 objets, `1e308`, chaîne de 1 Mo, `mount` cyclique, clé inconnue contenant du HTML, version future) toutes rejetées sans exception ; fuzzing fast-check « ne lève jamais » ; le message d'erreur n'affiche jamais le contenu du fichier ; la relecture sur événement `storage` passe par `parseSetup` | Au backlog |
| US-022 | L'E2E échoue sur tout événement `securitypolicyviolation` ou erreur console CSP, sur `dist-e2e` servi avec les en-têtes de production (dépend de SEC-03a : aujourd'hui `vite preview` ne sert aucun en-tête de sécurité) | Au backlog |
| US-023 | La capture PNG ne contient que le canvas (aucune donnée de l'interface ni métadonnée) | Au backlog |
| US-121, US-140 à US-143, US-151 | Dépendent respectivement de SEC-11, SEC-30 à SEC-36, SEC-40 à SEC-42 | Au backlog |

---

## 13. Historique des versions

| Version | Date | Auteur | Changements |
|---|---|---|---|
| 1.0 | 2026-10-19 | secdevops | Version initiale (kickoff), commitée sur `main` |
| 1.1 | 2026-10-19 | secdevops | US-002 : décisions PO (dépôt public, Cloudflare Pages sans domaine, pas de push au Sprint 1 : H-S6, H-S7, M-25 réécrite) ; scan US-001 (contrôle `dist/_headers` bloquant, SEC-03 découpée en SEC-03a/SEC-03b, findings LOW → SEC-06) ; incident tinypool corrigé par Vitest 4.1.12 (M-16) ; état réel de la CI (§6, §8) ; §9 aligné sur les identifiants du backlog ; §10 statut des amendements ; §14 conditions avant le premier push |
| 1.2 | 2026-10-20 | secdevops | Revue US-002 cycle 1 : critères détaillés de SEC-10 à SEC-50 rétablis dans le backlog (§9 corrigé) ; §14 : MFA GitHub et Cloudflare du PO avant le push, commande gitleaks alignée sur `ci-security.md` §6.1 |
| 1.3 | 2026-10-20 | secdevops | Scan SEC-03a : M-11 et SR-03 à jour (en-têtes livrés, `dist/_headers` émis par le plugin) ; §14 : point 5 fait, MFA Cloudflare reporté à la création du projet Pages, état des conditions restantes |
| 1.4 | 2026-10-31 | secdevops | Scan US-005 : M-29 (police tierce), M-30 (`lucide-react`), M-31 (préférences locales), M-14 (état) |
