# SEC-13 — Maintenance des dépendances, lot 2b : autres majeures  [Must | 5 pts | voie RENFORCÉE]

> Statut : **TODO** (marge du Sprint 3, sinon Sprint 4) · RENFORCÉE · 5 pts (à redécouper en 2 PR au besoin) · Décision 45. Après [SEC-09](SEC-09.md).

En tant qu'équipe, je veux appliquer les majeures restantes, une famille par PR, afin de ne pas cumuler la dette.
Critères d'acceptation (une PR et un `pnpm check` vert par famille, dans cet ordre) :
- [ ] Vite 8 + plugin-react 6 : build, preview et E2E sous CSP de production verts ; bundle ≤ 195 / 295 kB gz (décision 43) ; `public/react-aria-pressable.css` inchangé.
- [ ] Vitest 5 + coverage 5 : seuils de couverture inchangés ; aucun test dépendant du temps réel.
- [ ] TypeScript 6 : zéro erreur, aucune suppression de typage ajoutée.
- [ ] jsdom 30 et lint-staged 17 : hook de commit fonctionnel (essai à vide).
- [ ] Chaque PR Dependabot correspondante est fermée avec renvoi ; #12 et #13 (CI rouge) traitées ici ou fermées avec explication.
Notes : developer + devops ; secdevops en revue approfondie sur chaque lockfile. Le retrait de l'override rollup (SEC-03a T7, R8) se fait avec Vite 8.
