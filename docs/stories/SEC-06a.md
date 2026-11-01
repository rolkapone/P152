# SEC-06a — Garde CodeQL, fuzz hebdomadaire et ancrage Semgrep  [Could | 3 pts | voie RENFORCÉE]

> Statut : **TODO** (Sprint 3, après le 6/11) · RENFORCÉE (CI, permissions, SARIF) · 3 pts, extraits de [SEC-06](SEC-06.md) (qui garde le reste, 2 pts). Décisions 40 et 44.

En tant qu'équipe, je veux remettre la garde CodeQL en CI et durcir les contrôles récurrents afin de compenser la règle retirée du ruleset.
Critères d'acceptation :
- [ ] Un job CI lit le SARIF CodeQL de la PR et échoue si une alerte ≥ high est ouverte (test : alerte factice sur une PR jetable titrée « DO NOT MERGE », jamais mergée) ; ajouté aux checks requis par `ci-ok`.
- [ ] Un fuzz hebdomadaire de `parseSetup` s'exécute avec graine aléatoire (journalisée dans le résumé du job), échec = issue/notification ; la graine fixe reste en CI de PR.
- [ ] Les chemins de `.semgrep/p152.yml` sont ancrés ; test de la règle (cas qui déborde → non détecté).
- [ ] zizmor installé à version et empreinte fixées ; `upload-sarif` fonctionne dans le conteneur Semgrep.
- [ ] Le critère « 10 runs » (décision 44) est consigné dans `docs/qa/ci-e2e-runner.md` avec la commande.
Notes : devops + secdevops. Restent dans SEC-06 : le reste de la liste (Dependabot docker, CODEOWNERS, dette de test, `waitForTimeout`, drei, etc.).
