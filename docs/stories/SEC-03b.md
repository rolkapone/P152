# SEC-03b — Déploiement sécurisé sur Cloudflare Pages  [Must avant le premier déploiement | 1 pt]

> Statut : **TODO** · Voie : à attribuer au planning (`socle:scrum-master`) · 1 pts · Must · Epic A — Fondations techniques. Index : [backlog](../backlog.md)..

En tant qu'équipe, je veux un déploiement protégé afin qu'aucun bundle altéré n'atteigne les utilisateurs.
Critères d'acceptation :
- [ ] Environnement GitHub `production` : approbation du PO, déploiement depuis les tags `v*` uniquement ; secrets Cloudflare présents uniquement dans cet environnement (et `preview` séparé avec son propre jeton).
- [ ] Jeton Cloudflare à portée « Pages : Edit » sur le seul compte ; MFA Cloudflare ; procédure de rotation écrite dans `docs/security/`.
- [ ] Après chaque déploiement, un contrôle automatique lit les en-têtes de l'URL réelle et échoue si un en-tête diffère de `config/security-headers.mjs`.
- [ ] Les previews portent `X-Robots-Tag: noindex` et ne sont jamais construites depuis un fork.
- [ ] *(suivi SEC-03a)* `Cross-Origin-Resource-Policy: same-origin` ajouté dans `config/security-headers.mjs` en passant par **ADR-OPS-06** (mise à jour de l'ADR, test d'en-têtes et contrôle CI alignés).
- [ ] *(suivi SEC-03a)* Vérifier que la règle `/index.html` des en-têtes est bien opérante sur Cloudflare Pages (elle est inopérante en local/preview) ; corriger ou retirer sinon.
Notes techniques / dépendances : devops + secdevops. Dépend de SEC-03a et SEC-02. À livrer avant le premier déploiement, sur ordre du PO. Pas de domaine personnalisé (`*.pages.dev`).
