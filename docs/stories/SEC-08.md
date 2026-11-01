# SEC-08 — Maintenance des dépendances, lot 1 (actions et runtime)  [Must | 2 pts | voie STANDARD]

> Statut : **DONE** (Sprint 3, PR #26) · STANDARD · 2 pts · Epic A. Revue APPROVE, secdevops PASS. Décision 45. Suite : [SEC-09](SEC-09.md), [SEC-13](SEC-13.md).

En tant qu'équipe, je veux fusionner les mises à jour sûres déjà proposées par Dependabot afin de réduire le bruit et la surface d'attaque.
Critères d'acceptation :
- [x] Les actions GitHub de la PR #11 sont mises à jour avec empreinte (SHA) conservée et version en commentaire ; zizmor sans nouvelle alerte.
- [x] Les dépendances runtime de la PR #15 sont mises à jour (mineures/correctifs seulement) ; budget bundle 195 / 295 kB gz tenu (mesure avant/après dans la PR) ; E2E CSP verts.
- [x] Les PR Dependabot couvertes sont fermées avec renvoi vers la PR de la story (#11 et #15 fermées, remplacées par #26) ; les autres restent ouvertes jusqu'à SEC-09 / SEC-13.
- [x] `pnpm check` vert, `pnpm audit` sans HIGH/CRITICAL nouveau ; aucun nouvel override `pnpm.overrides` sans note dans [exceptions](../security/exceptions.md).

Notes : livré par devops et developer. #12 et #13 (CI rouge) hors lot.
Écart à consigner : `dependency-review-action` passe en v5 (majeure d'action), acceptée par secdevops alors que la fiche disait « aucune majeure » ; à confirmer par le PO (décision à inscrire si validée).
