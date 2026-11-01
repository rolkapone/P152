# SEC-08 — Maintenance des dépendances, lot 1 (actions et runtime)  [Must | 2 pts | voie STANDARD]

> Statut : **TODO** (Sprint 3) · STANDARD (secdevops en scan ciblé : empreintes d'actions, aucune majeure) · 2 pts · Epic A. Décision 45. Suite : [SEC-09](SEC-09.md), [SEC-13](SEC-13.md).

En tant qu'équipe, je veux fusionner les mises à jour sûres déjà proposées par Dependabot afin de réduire le bruit et la surface d'attaque.
Critères d'acceptation :
- [ ] Les actions GitHub de la PR #11 sont mises à jour avec empreinte (SHA) conservée et version en commentaire ; zizmor sans nouvelle alerte.
- [ ] Les dépendances runtime de la PR #15 sont mises à jour (mineures/correctifs seulement) ; budget bundle 195 / 295 kB gz tenu (mesure avant/après dans la PR) ; E2E CSP verts.
- [ ] Les PR Dependabot couvertes sont fermées avec renvoi vers la PR de la story ; les autres restent ouvertes jusqu'à SEC-09 / SEC-13.
- [ ] `pnpm check` vert, `pnpm audit` sans HIGH/CRITICAL nouveau ; aucun nouvel override `pnpm.overrides` ajouté sans note dans [exceptions](../security/exceptions.md).
Notes : devops (PR) + developer ; #12 et #13 (CI rouge) hors lot. Pas de CI E2E inutile : une seule vérification de la CI par PR.
