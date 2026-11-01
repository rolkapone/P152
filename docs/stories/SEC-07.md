# SEC-07 — Licence propriétaire du dépôt  [Must | 1 pt | voie EXPRESS]

> Statut : **TODO** (Sprint 3) · EXPRESS · 1 pt · Epic A. Index : [backlog](../backlog.md). Décisions 47 et 48 : [decisions.md](../decisions.md).

En tant que propriétaire d'un produit à but lucratif, je veux un `LICENSE` propriétaire dans un dépôt public afin que le code reste réservé malgré sa visibilité.
Critères d'acceptation :
- [ ] Étant donné la racine du dépôt, alors `LICENSE` contient « Copyright © 2026 Carol MBONZIMA. All rights reserved. » suivi d'un avis court : aucune licence d'utilisation, de copie, de modification ni de distribution n'est accordée, sauf accord écrit (texte à faire relire par le PO ; pas un avis juridique).
- [ ] `package.json` : `"license": "UNLICENSED"` et `"private": true` ; `README` renvoie à `LICENSE`.
- [ ] `scripts/check-licenses.mjs` et dependency-review ne traitent pas la licence du projet comme une dépendance ; `pnpm check` vert.
- [ ] L'alerte Scorecard « License » (#7) est documentée comme acceptée (choix du PO) dans [dette.md](../dette.md) ; aucun paiement.
Notes : developer (ou devops), puis reviewer. Aucun effet à l'exécution. Pas de SHA dans les docs.
