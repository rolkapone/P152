# SEC-09 — Maintenance des dépendances, lot 2a : ESLint 10  [Must | 3 pts | voie RENFORCÉE]

> Statut : **TODO** (Sprint 3, après le 6/11) · RENFORCÉE (nouvelle majeure d'outillage, chaîne de build) · 3 pts · Décisions 45, 46. Échéance dure : **2026-11-30** (exception minimatch). Absorbe le critère « migration ESLint 9 » de [SEC-06](SEC-06.md).

En tant qu'équipe, je veux passer à ESLint 10 afin de lever l'exception minimatch avant le 2026-11-30.
Critères d'acceptation :
- [ ] ESLint 10 et plugins compatibles installés ; `pnpm lint` vert sans désactiver de règle ; ADR consigné (versions, plugins remplacés).
- [ ] `pnpm audit` et OSV : minimatch vulnérable absent de l'arbre ; l'exception de [exceptions](../security/exceptions.md) est clôturée.
- [ ] *(dette US-003)* La règle de frontières de couches n'interdit plus `from ".."` dans `core` (`eslint.config.js`), avec un test du lint ; le test TS7026 devient un vrai test de compilation ; branche inatteignable de `withDefaults` supprimée ou couverte.
- [ ] Les règles maison (`waitForTimeout`, imports interdits) gardent leurs tests dans `tests/unit/lint-rules.test.ts`.
- [ ] `pnpm check` vert, secdevops : revue approfondie (diff de lockfile, scripts d'installation).
Notes : developer ; plan B si ESLint 10 bloque avant le 25/11 : demander au PO de prolonger l'exception. Dépendances : SEC-08.
