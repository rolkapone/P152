# Revue SEC-01 : Pipeline sécurité en CI

## Cycle 1 : APPROVE (2026-10-20)

Branche `feature/SEC-01-pipeline-securite` (7300750, ccb5692, 7206f2b ; 3385ccc déjà dans main). ci.yml et security-scheduled.yml relus en entier.

### Exécuté pendant la revue
- `pnpm check` vert (98,11 % instructions, 96,28 % branches).
- zizmor 1.31.1 hors ligne, `--min-severity high` : 0 finding. Persona auditor : 14 findings, uniquement info/low (7 anonymous-definition, 6 undocumented-permissions, 1 concurrency-limits).
- gitleaks 8.30.1 avec `.gitleaks.toml` : 47 commits, aucune fuite.
- actionlint absent : syntaxe relue à la main.

### Bloquant
Aucun.

### Non bloquant (à tracer dans SEC-06)
- ci-security.md : l'en-tête de `scripts/check-licenses.mjs` est déclaré « à jour », mais sa ligne 2 dit encore « Brouillon secdevops… ».
- docs/ci/local-run-SEC-01.md:19 : le persona auditor donne aussi 7 alertes low, pas seulement 7 infos.
- docs/ci/local-run-SEC-01.md:3 : nuancer « extraites telles quelles » (config gitleaks conditionnelle, zizmor en binaire local, OSV par commande équivalente).
- ci.yml:117 : la config gitleaks conditionnelle laisse le job vert si `.gitleaks.toml` disparaît (règle p152 perdue). La rendre obligatoire, comme dans security-scheduled.yml:56.
- ci.yml:229 / security-scheduled.yml:23 : `continue-on-error` sur OSV est voulu (le blocage passe par `pnpm audit`). Le `|| true` de ci.yml:287 n'affaiblit pas le contrôle.
- docs/security/ci/* : la ligne « Brouillon… à copier » contredit le bandeau « obsolète » ; coquille « n est ».
- security-scheduled.yml : pas d'agrégateur ni de notification en cas d'échec (voir SEC-02).
- Au premier push : `upload-sarif` dans le conteneur semgrep, et `security-events: write` sur les PR venant de forks.

### Vérifié
Épinglage (aucun nouveau SHA, gitleaks SHA-256 identique partout, images par digest) ; permissions minimales par job ; `persist-credentials: false` partout ; agrégateur `security` (`always()`, échec sur failure/cancelled/skipped) et `ci-ok` en success strict ; triggers sans `pull_request_target` ; jobs hebdomadaires CodeQL et gitleaks corrects ; contrôle `dist/_headers` toujours bloquant (rouge attendu jusqu'à SEC-03a).

### Critères d'acceptation
- [x] Slot sécurité complet, agrégateur requis par ci-ok.
- [ ] PR de test distante : reportée au Sprint 2 (décision PO).
- [x] Fichiers en place et épinglage.
- [x] Jobs exécutés en local et consignés ; les non-exécutables sont marqués « non vérifié ».
- [x] Cas négatifs rejoués (5) ; innerHTML non rejoué (Semgrep), consigné.
- [x] Bandeau « obsolète ».
- [ ] SARIF dans Code scanning : reporté au Sprint 2.
- [x] Findings de SEC-06 absorbés (persist-credentials, id-token, skipped, scans hebdomadaires).
