# SEC-07 — Licence propriétaire du dépôt  [Must | 1 pt | voie EXPRESS]

> Statut : **DONE** (Sprint 3, PR #24) · EXPRESS · 1 pt · Epic A. Revue EXPRESS APPROVE. Index : [backlog](../backlog.md). Décisions 47 et 48 : [decisions.md](../decisions.md). Alerte Scorecard #7 acceptée : [dette](../dette.md).

En tant que propriétaire d'un produit à but lucratif, je veux un `LICENSE` propriétaire dans un dépôt public afin que le code reste réservé malgré sa visibilité.
Critères d'acceptation :
- [x] Étant donné la racine du dépôt, alors `LICENSE` contient « Copyright © 2026 Carol MBONZIMA. All rights reserved. » suivi d'un avis court : aucune licence d'utilisation, de copie, de modification ni de distribution n'est accordée, sauf accord écrit. Relecture du texte par le PO **ouverte** (non bloquante ; pas un avis juridique).
- [x] `package.json` : `"license": "UNLICENSED"` et `"private": true` ; `README` renvoie à `LICENSE`.
- [x] `scripts/check-licenses.mjs` et dependency-review ne traitent pas la licence du projet comme une dépendance ; `pnpm check` vert (revue APPROVE, PR #24).
- [x] L'alerte Scorecard « License » (#7) est documentée comme acceptée (choix du PO) dans [dette.md](../dette.md) ; aucun paiement.

Notes : livré en mode EXPRESS (developer, reviewer, devops). Aucun effet à l'exécution. Pas de SHA dans les docs.
