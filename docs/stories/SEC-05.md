# SEC-05 — Revue de sécurité avant la release MVP  [Must | 1 pt]

> Statut : **TODO** · Voie : à attribuer au planning (`socle:scrum-master`) · 1 pts · Must · Epic A — Fondations techniques. Index : [backlog](../backlog.md).

En tant que PO, je veux une revue de sécurité finale afin de publier sans risque connu.
Critères d'acceptation :
- [ ] Threat model révisé ; scans complets sur `main` sans CRITICAL/HIGH ouvert.
- [ ] Tests manuels de l'import avec le jeu de fichiers malveillants ; en-têtes de l'URL de production vérifiés (Mozilla HTTP Observatory, note visée A+).
- [ ] Rapport `docs/security/release-mvp.md`.
Notes techniques / dépendances : secdevops. Dernière story du MVP ; dépend de SEC-03a, SEC-03b, US-018, US-022.
