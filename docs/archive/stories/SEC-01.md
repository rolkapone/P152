# SEC-01 — Pipeline sécurité en CI  [Must | 3 pts]

> Archive : story **DONE** au Sprint 1. Voie : —. Index : [backlog](../../backlog.md). Dette de la story : [dette.md](../../dette.md).

En tant qu'équipe, je veux que chaque PR soit scannée (secrets, SAST, dépendances, licences, workflows, build) afin qu'aucune vulnérabilité CRITICAL/HIGH ni aucun secret n'atteigne `main`.
**État au 2026-10-20 : DONE.** Mergée dans `main` (voir l'historique). Revue APPROVE au cycle 1/3 ; secdevops PASS. La PR de test distante et le SARIF sont reportés au Sprint 2 (décision PO, pas de push) ; les findings restants sont tracés dans SEC-06.
Critères d'acceptation :
- [x] Le slot `# SECDEVOPS-SLOT` de `ci.yml` contient les jobs de `docs/security/ci-security.md` (gitleaks, CodeQL, Semgrep, zizmor, SCA + licences, `build-hardening`) et un job agrégateur `security` requis par `ci-ok`.
- [ ] *(reste à faire, rattaché à SEC-02 T5 : la première PR distante, #2, est celle du correctif E2E, sans cas négatifs)* Une PR de test contenant un faux secret, un `innerHTML`, une dépendance vulnérable HIGH, et un `dist` contenant `__p152test` fait échouer la CI (4 cas vérifiés puis annulés).
- [x] `.gitleaks.toml`, `.semgrep/p152.yml`, `scripts/check-licenses.mjs`, `.github/dependabot.yml` et le workflow hebdomadaire sont en place ; actions et images épinglées par SHA/digest.
- [x] *(vérification locale, Sprint 1)* Chaque job de sécurité est exécuté en local avec la même commande que dans `ci.yml` (gitleaks, SCA + licences, zizmor, `build-hardening` hors contrôle `_headers`, Semgrep) et le résultat est consigné dans `docs/ci/local-run-SEC-01.md` ; ce qui n'est pas exécutable en local (CodeQL, Semgrep si Docker est arrêté) est listé comme non vérifié, jamais comme vert.
- [x] *(vérification locale)* Les 4 cas négatifs (faux secret, `innerHTML`, dépendance HIGH, `__p152test` dans `dist`) sont rejoués en local sur une copie jetable, chacun fait échouer la commande du job correspondant, puis tout est annulé (arbre propre) ; les cas non faisables sont consignés.
- [x] `docs/security/ci/` porte un bandeau « obsolète : les fichiers actifs sont à la racine / dans `.github/` » (finding de la revue US-002).
- [x] Les rapports SARIF remontent dans l'onglet Code scanning. *(vérifié sur la PR #2, première CI distante 17/17 verte ; `dependency-review` exécuté sur la PR)*
Notes techniques / dépendances : devops + secdevops. Dépend de US-001 (CI exécutée au moins une fois). Le contrôle `dist/_headers` de `build-hardening` **reste bloquant** (décision secdevops, scan US-001) : il n'y a pas d'avertissement toléré. La génération de `public/_headers` est donc livrée par SEC-03a **avant le premier push** (Sprint 2, en tête). Les findings LOW du scan US-001 sont regroupés dans SEC-06.
