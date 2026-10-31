# Sécurité en CI — P152

> Story : US-002 (définition des scans) ; intégration : SEC-01 (devops + secdevops). Auteur : secdevops. **Version 1.2 du 2026-10-20** (v1.0 au kickoff ; historique en §9).
> Cadre : ADR-OPS-01 (pnpm, `onlyBuiltDependencies`, `minimumReleaseAge`), ADR-OPS-03 (GitHub Actions, slot `# SECDEVOPS-SLOT`, `ci-ok`), ADR-OPS-06 (Cloudflare Pages, CSP stricte, hooks `VITE_E2E`), ADR-APP-03 (import) dans [`architecture/index.md`](../architecture/index.md) ; threat model [`threat-model.md`](threat-model.md) ; scan [`scans/US-001.md`](scans/US-001.md) ; exécution locale [`docs/ci/local-run-US-001.md`](../ci/local-run-US-001.md).
> **Le devops intègre** : secdevops n'édite pas `.github/`. Depuis US-001, les jobs sont **intégrés** : la source de vérité du YAML est [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (bloc `SECDEVOPS-SLOT`) et [`.github/workflows/security-scheduled.yml`](../../.github/workflows/security-scheduled.yml). Ce document fixe la **politique** et l'**état** ; il ne duplique plus le YAML.
> **Contexte Sprint 1 (décision PO)** : pas de dépôt distant ni de push. La CI n'a jamais tourné sur GitHub ; elle est vérifiée **en local** avec les mêmes commandes. Les contrôles propres à GitHub sont inactifs jusqu'au premier push (Sprint 2).

## 1. Vue d'ensemble et état réel

Légende de la colonne État : **Vérifié local** = commande exécutée sur le poste au scan US-001, résultat propre ; **Intégré** = présent dans les workflows, non exécutable hors GitHub ; **Inactif** = dépend du dépôt distant ou de réglages GitHub (SEC-02) ; **À faire** = story citée.

| Contrôle | Outil (version épinglée) | Où | Quand | Bloquant | Menaces | État |
|---|---|---|---|---|---|---|
| Secrets (historique complet) | gitleaks 8.30.1 (binaire + SHA-256) | `ci.yml` `sec-secrets` | PR, push `main` | **Toute détection** | M-19 | Vérifié local (aucune fuite, 44 commits, SEC-01) ; hebdo : **Intégré (SEC-01, `security-scheduled.yml` `secrets`)** |
| Secrets (build) | gitleaks 8.30.1 `dir dist` | `ci.yml` `sec-build-hardening` | PR, push `main` | **Toute détection** | M-19 | Vérifié local |
| Secrets (plateforme) | GitHub secret scanning + push protection | réglages du dépôt | à chaque push | **Push refusé** | M-19 | Inactif (SEC-02, **à activer avant le premier push**) |
| SAST code | CodeQL `javascript-typescript`, `security-extended` (`github/codeql-action` v4.39.0) | `ci.yml` `sec-codeql` | PR, push `main` | **≥ High** via ruleset (SEC-02) | M-03, SR-02 | Intégré (non exécutable en local) ; hebdo : **Intégré (SEC-01, `security-scheduled.yml` `codeql`)** |
| SAST workflows | CodeQL `actions` + zizmor 1.31.1 (`uvx`) | `ci.yml` `sec-codeql`, `sec-workflows` | PR, push `main` | zizmor **high** ; CodeQL ≥ High via ruleset | M-17, M-18 | zizmor vérifié local (0 high) ; installation sans empreinte : **SEC-06** |
| SAST règles projet | Semgrep CE 1.181.0 (image épinglée par digest) : `p/typescript`, `p/react`, `p/javascript`, [`.semgrep/p152.yml`](../../.semgrep/p152.yml) | `ci.yml` `sec-semgrep` | PR, push `main` | règles **ERROR** | M-03, M-11, M-12, SR-01/02 | Intégré ; **non vérifié** (Docker non démarré, pas d'autre moyen sûr sous Windows) : à exécuter au premier push ou avec Docker Desktop (SEC-01 `local-run-SEC-01.md`) |
| Vulnérabilités dépendances | `pnpm audit --audit-level high` | `ci.yml` `sec-dependencies` + `security-scheduled.yml` `audit` | PR, push `main`, hebdo | **HIGH/CRITICAL** (prod et dev) | M-16 | Vérifié local (0 vulnérabilité après Vitest 4.1.12) |
| Vulnérabilités dépendances (2e source) | OSV-Scanner (`google/osv-scanner-action` v2.7.0) | idem | PR, push `main`, hebdo | non (rapport SARIF) | M-16 | Vérifié local (OSV-Scanner 2.7.0) |
| Diff de dépendances en PR | `actions/dependency-review-action` v4.9.0 | `ci.yml` `sec-dependencies` | PR | **HIGH/CRITICAL** + licence hors liste | M-16, M-20, M-21 | Inactif (PR GitHub uniquement) |
| Licences | `pnpm licenses list --prod --json` + [`scripts/check-licenses.mjs`](../../scripts/check-licenses.mjs) | `ci.yml` `sec-dependencies` | PR, push `main` | licence **hors liste blanche** | M-21 | Vérifié local (0 refusée, 0 à revoir) |
| CSP et en-têtes du build | bash sur `dist/_headers` | `ci.yml` `sec-build-hardening` | PR, push `main` | directive manquante ou interdite, **fichier absent** | M-11, SR-03 | Intégré ; **échoue aujourd'hui** (`dist/_headers` absent) → **SEC-03a avant le premier push** |
| `index.html` sans inline ni tiers | bash sur `dist/index.html` | `ci.yml` `sec-build-hardening` | PR, push `main` | script/style inline, URL externe | M-11, M-14 | Vérifié local |
| Hooks de test absents | `check:bundle` (job `build`) + grep `__p152test`, `__p152perf`, `VITE_E2E`, `*.map` | `ci.yml` `build` et `sec-build-hardening` | PR, push `main` | **toute occurrence** | M-12, SR-04 | Vérifié local |
| Mises à jour | Dependabot (npm, github-actions, docker-compose) | [`.github/dependabot.yml`](../../.github/dependabot.yml) | hebdo + alertes | n/a (PR revues) | M-16, M-17 | Inactif ; l'entrée `docker-compose` ne suit rien : **SEC-06** |
| Hygiène du dépôt | OpenSSF Scorecard (`ossf/scorecard-action` v2.5.0) | `security-scheduled.yml` `scorecard` | hebdo | non | M-17, M-20, M-22 | Inactif ; `id-token: write` retiré (SEC-01) |
| Conteneurs / IaC | trivy | — | **pas au MVP** (aucune image applicative ni IaC, ADR-OPS-05) ; à activer dès qu'un Dockerfile applicatif ou de l'IaC apparaît (R6) | HIGH/CRITICAL | — | Sans objet |

Agrégation : le job `security` (`permissions: {}`) échoue si un `sec-*` est en `failure`, `cancelled` ou `skipped` (SEC-01) ; `ci-ok` exige `security` en succès. Le job `assets` (budgets, licences des assets, LFS) reste propriété du devops/technical-artist ; secdevops le considère comme un contrôle de conformité (M-28).

### 1.1 Versions épinglées (relevé du 2026-10-19, commit `dfdfcfe`)

Source de vérité : les workflows. Toutes les actions sont épinglées par SHA de commit complet, version en commentaire ; les 12 SHA ont été comparés à leur tag par `git ls-remote` au scan US-001 (12/12 conformes).

| Élément | Version | Utilisé par |
|---|---|---|
| `actions/checkout` | v7.0.1 | tous les jobs |
| `actions/setup-node` / `pnpm/action-setup` | v7.1.0 / v6.1.0 | `quality`, `unit`, `build`, `assets`, `e2e`, `sec-dependencies`, `audit` |
| `actions/upload-artifact` / `actions/download-artifact` | v7.0.2 / v8.0.2 | `unit`, `build`, `e2e` / `sec-build-hardening` |
| `github/codeql-action` (`init`, `analyze`, `upload-sarif`) | v4.39.0 | `sec-codeql`, `sec-semgrep`, `sec-dependencies`, `security-scheduled.yml` |
| `actions/dependency-review-action` | v4.9.0 | `sec-dependencies` |
| `google/osv-scanner-action` | v2.7.0 | `sec-dependencies`, `audit` |
| `astral-sh/setup-uv` | v10.3.0 | `sec-workflows` |
| `ossf/scorecard-action` | v2.5.0 | `scorecard` |
| gitleaks | 8.30.1, SHA-256 `linux_x64` vérifié contre le fichier de checksums officiel | `sec-secrets`, `sec-build-hardening` |
| zizmor | 1.31.1 via `uvx` (**sans empreinte**, SEC-06) | `sec-workflows` |
| Image `semgrep/semgrep` | 1.181.0 + digest `sha256` | `sec-semgrep` |
| Image `mcr.microsoft.com/playwright` | v1.64.1-noble + digest `sha256` | `e2e` |
| Node / pnpm | 24 (`.nvmrc`) / 10.34.7 (`packageManager`) | tous les jobs Node |

## 2. Politique de sévérité

| Sévérité | En PR | Sur `main` (scan hebdo) | Suite |
|---|---|---|---|
| Secret | **Bloque** | Bloque + incident | Révocation et rotation **immédiates** (dépôt public : le secret est considéré compromis), puis nettoyage |
| CRITICAL | **Bloque** | Correctif sous 24 h | Retour à l'implémenteur |
| HIGH | **Bloque** | Correctif sous 7 jours | Retour à l'implémenteur |
| MEDIUM | Signalé | Backlog sous 30 jours | Item proposé au scrum-master |
| LOW / info | Signalé | Backlog au mieux | Item proposé au scrum-master (ex. SEC-06) |

**Exceptions** (faux positif vérifié, vulnérabilité non atteignable, ex. CVE d'un serveur de dev Vite jamais exposé) : uniquement avec identifiant (GHSA/CVE/règle), justification, approbateur secdevops et **date d'expiration ≤ 30 jours**, consignées dans `docs/security/exceptions.md` (créé à la première exception ; une exception en cours, voir le fichier) et dans l'outil :
- `pnpm audit` : `auditConfig.ignoreGhsas` (dans `pnpm-workspace.yaml`) ;
- OSV-Scanner : `osv-scanner.toml` `[[IgnoredVulns]]` avec `ignoreUntil` et `reason` ;
- Semgrep : commentaire `// nosemgrep: <id> -- <raison>` ;
- CodeQL : rejet de l'alerte dans l'onglet Code scanning avec motif ;
- gitleaks : `[[allowlists]]` de `.gitleaks.toml` (jamais pour un vrai secret).

Une vulnérabilité se corrige de préférence par montée de version, pas par exception : c'est ce qui a été fait en US-001 (avis critiques `tinypool` via Vitest 3.2.7 → **Vitest 4.1.12** et `@vitest/coverage-v8` 4.1.12).

## 3. Détail des contrôles

### 3.1 Secrets — gitleaks
- Historique **complet** (`fetch-depth: 0`) : un secret supprimé dans un commit ultérieur reste exploitable.
- Configuration : [`.gitleaks.toml`](../../.gitleaks.toml) (règles par défaut + jeton Cloudflare + variables `VITE_*` nommées comme des secrets, car **toute variable `VITE_*` est publique** ; allowlist des valeurs factices de `.env.example`). Règles projet validées par un canari au scan US-001.
- Binaire téléchargé depuis la release officielle, **version épinglée et somme SHA-256 vérifiée** (pas d'action tierce : `gitleaks-action` demande une licence pour les comptes d'organisation).
- Second passage sur `dist/` (`gitleaks dir`) : attrape un secret injecté au build par une variable d'environnement.
- Hebdomadaire sur `main` : job `secrets` de `security-scheduled.yml` (SEC-01), même binaire et même checksum que la CI.
- Local : le hook pre-commit (`simple-git-hooks`) ne lance que `lint-staged` ; gitleaks n'est pas installé sur le poste. Recommandé mais non bloquant : `gitleaks git --pre-commit --staged --redact`. **Obligatoire avant le premier push** : scan de toutes les branches (§6.1).

### 3.2 SAST — CodeQL + Semgrep + zizmor
- **CodeQL** (gratuit sur dépôt public) : `javascript-typescript` en `build-mode: none`, suite `security-extended` ; langage `actions` pour les workflows ; `tests/fixtures/**` et `dist/**` exclus. CodeQL ne fait pas échouer le job : le blocage passe par le **ruleset de `main`** (« Require code scanning results », seuil *Security: High or higher*, *Alerts: Errors*) — SEC-02. Planification hebdomadaire : job `codeql` de `security-scheduled.yml` (SEC-01).
- **Semgrep CE** (`--metrics=off`) : deux passes, une complète en SARIF (toutes sévérités, Code scanning), une bloquante `--severity ERROR --error`. Règles projet [`.semgrep/p152.yml`](../../.semgrep/p152.yml) : 9 règles, dont 3 ERROR (`p152-dom-html-sink`, `p152-react-dangerously-set-inner-html`, `p152-dynamic-code`) et 6 WARNING (stockage hors `src/persistence/`, `JSON.parse` hors `src/core/io/`, hooks de test, `message` listener, `Math.random` pour des ids, `http://`). Elles doublent volontairement les règles ESLint (`no-eval`, etc.) : ESLint peut être désactivé localement par un commentaire, Semgrep est revu par secdevops. Exécution locale : `docker run` (§7).
- **zizmor** : `pull_request_target`, injection de contexte dans `run:`, actions non épinglées, `persist-credentials`, permissions excessives, empoisonnement de cache. Bloquant à partir de *high*. Au scan US-001 : 0 high ; 7 medium en persona *regular* (dont `artipacked` sur 4 jobs, reclassé LOW) → SEC-06.

### 3.3 Dépendances (SCA) et licences
- `pnpm audit --audit-level high` (lit le lockfile) : **bloquant**, dépendances de prod **et** de dev (les outils de build et de test s'exécutent en CI et produisent le bundle ; l'incident `tinypool` de US-001 touchait justement une dépendance de dev). En cas d'indisponibilité du service d'audit, le job échoue (pas de faux vert) et est relancé.
- OSV-Scanner sur `pnpm-lock.yaml` : seconde base de données, **non bloquant** au départ (rapport SARIF) ; à rendre bloquant après un sprint d'observation si le bruit est faible.
- `dependency-review-action` (PR seulement) : bloque l'**introduction** d'une dépendance HIGH/CRITICAL ou sous licence non autorisée, affiche le score OpenSSF.
- Licences : liste blanche MIT, MIT-0, ISC, 0BSD, BSD-2/3-Clause, Apache-2.0, Zlib, CC0-1.0, Unlicense, BlueOak-1.0.0, Python-2.0. À revoir (avertissement) : MPL-2.0, CC-BY-3.0/4.0. Tout le reste (GPL, AGPL, LGPL, SSPL, BUSL, CC-BY-NC, inconnu) bloque. Format JSON de `pnpm licenses list` en pnpm 10.34.7 : vérifié au scan US-001.
- Garde-fous d'installation (ADR-OPS-01, [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml)) : `onlyBuiltDependencies: [esbuild, simple-git-hooks]`, `minimumReleaseAge: 4320` (3 jours). Override temporaire `rollup: 4.64.7` à retirer à partir du 2026-10-23, puis `pnpm install`, `pnpm audit`, `pnpm check`.
- **Revue humaine de toute nouvelle dépendance directe** (secdevops, à chaque story) : le paquet existe et correspond au dépôt source attendu, âge et activité, nombre de mainteneurs, scripts d'installation, poids, alternative sans dépendance. C'est la principale parade au typosquatting et aux noms inventés par un agent (M-16, acteur T-A).

### 3.4 Contrôle du build (`sec-build-hardening`)
Exécuté sur l'artefact `dist` du job `build` (celui-là même qui serait déployé) :
1. **Hooks de test** : aucune occurrence de `__p152test`, `__p152perf` ni `VITE_E2E` dans `dist/`, aucun fichier `*.map` (prérequis `build.sourcemap: false`, en place dans `vite.config.ts`). Ce contrôle double volontairement `check:bundle` du job `build` : c'est la vérification indépendante de secdevops.
2. **`dist/_headers`** présent et contenant :
   - CSP avec `default-src 'self'`, `script-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`, `frame-ancestors 'none'` ;
   - nulle part `'unsafe-inline'`, `'unsafe-eval'`, `'unsafe-hashes'` ; dans `script-src` ni `*`, ni `data:`, ni `blob:`, ni `http:`/`https:` ;
   - `'wasm-unsafe-eval'` : **avertissement** jusqu'à l'ADR de SEC-10, ensuite accepté ;
   - `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`.
3. **`dist/index.html`** : aucun `<script>` sans `src`, aucun `<style>`, aucun attribut `style=`, aucun `src`/`href` vers `http(s)://` ou `//` (pas de CDN, polices auto-hébergées).
4. **gitleaks** sur `dist/`.

**Décision (scan US-001)** : l'absence de `dist/_headers` reste une **erreur bloquante** ; pas d'avertissement temporaire. Le fichier n'existe pas encore : **SEC-03a** livre `config/security-headers.mjs` (source unique, ADR-OPS-06) qui génère `public/_headers`, copié par Vite dans `dist/`, **en tête du Sprint 2 et avant le premier push**. La CSP de référence est celle d'ADR-OPS-06 (elle inclut `form-action 'none'` et `upgrade-insecure-requests`, exigés ou compatibles avec ce contrôle).

**Ajout demandé avec SEC-03a** (spécification, intégration par le devops) : vérifier aussi `Strict-Transport-Security` (`max-age` ≥ 31536000), exigé par le critère de SEC-03a. Sur `*.pages.dev`, HTTPS est déjà imposé par le préchargement HSTS du TLD `.dev` ; l'en-tête reste utile si l'app change d'hôte. `includeSubDomains` et `preload` ne seront envisagés qu'avec un domaine du PO (SEC-37).

Le test E2E (job `e2e`, QA) complète ce contrôle statique : échec sur tout `securitypolicyviolation` avec la même CSP (amendement US-022). Aujourd'hui `vite preview` ne sert aucun en-tête de sécurité : la configuration `preview.headers` vient avec SEC-03a. Après déploiement, SEC-03b vérifie les en-têtes réellement servis.

### 3.5 Épinglage et mises à jour
- **Actions** : épinglées par SHA de commit complet avec la version en commentaire (`uses: actions/checkout@<sha40> # v7.0.1`). Résolution d'un tag : `git ls-remote https://github.com/<owner>/<repo> refs/tags/<tag>` (prendre le SHA du commit ; pour un tag annoté, la ligne `^{}`). Activer l'option de dépôt « Require actions to be pinned to a full-length commit SHA » (SEC-02).
- **Images** : épinglées par digest (`image:tag@sha256:...`), résolu par `docker buildx imagetools inspect <image:tag>`. Mettre à jour tag et digest ensemble. Les images utilisées en `container:` de workflow ne sont suivies par aucun écosystème Dependabot actif (l'entrée `docker-compose` n'a pas de fichier compose à surveiller) → SEC-06 (script de vérification ou Renovate).
- **Outils téléchargés** : version exacte et checksum vérifié pour les binaires (gitleaks fait ; zizmor à faire en SEC-06 : archive de la release GitHub avec SHA-256 épinglé, ou `uvx --require-hashes`).
- **Dependabot** retenu (natif, gratuit, aligné sur ADR-OPS-01) plutôt que Renovate ; Renovate reste le repli si le support du lockfile pnpm 10 ou des `container:` pose problème. `cooldown` de 3 jours aligné sur `minimumReleaseAge` (zizmor recommande 7 : écart accepté, threat model §11) ; les mises à jour de **sécurité** ne sont pas retardées.

### 3.6 Permissions et déclencheurs
- Workflow : `permissions: contents: read` par défaut ; seuls les jobs qui publient du SARIF ont `security-events: write` ; l'agrégateur `security` a `permissions: {}`.
- `checkout` avec `persist-credentials: false` : en place sur les jobs `sec-*` et `e2e`, désormais aussi sur `quality`, `unit`, `build`, `assets` (SEC-01 ; zizmor `artipacked` : 4 → 0).
- `id-token: write` dans `security-scheduled.yml` (`scorecard`) retiré (SEC-01) : `publish_results: false` ne l'exige pas.
- **Jamais** de `pull_request_target`, ni de `workflow_run` qui consomme un artefact de PR (sauf ADR + revue secdevops) : aucun dans les workflows actuels.
- Aucun contexte non fiable (`github.event.*`, `head_ref`) interpolé dans un `run:` ; les contextes utilisés passent par `env:`.
- Aucun secret dans `ci.yml` : les secrets de déploiement vivront dans `deploy.yml` (absent tant que le PO n'a pas ordonné de déploiement) sous l'environnement protégé (SEC-03b).
- Les PR de forks (dépôt public) s'exécutent avec un jeton en lecture seule : l'envoi SARIF peut y échouer ; c'est attendu, le résultat du scan reste visible dans le log.

## 4. Correspondance spécification → workflows

| Spécification (§3) | Implémentation | Écart |
|---|---|---|
| §3.1 gitleaks historique | `ci.yml` `sec-secrets` | gitleaks hebdo : `security-scheduled.yml` `secrets` (SEC-01) |
| §3.1 / §3.4 gitleaks `dist` | `ci.yml` `sec-build-hardening`, dernier step | — |
| §3.2 CodeQL | `ci.yml` `sec-codeql` (matrice `javascript-typescript`, `actions`) | hebdo : `security-scheduled.yml` `codeql` (SEC-01) |
| §3.2 Semgrep | `ci.yml` `sec-semgrep` (deux passes) | — |
| §3.2 zizmor | `ci.yml` `sec-workflows` | installation sans empreinte (SEC-06) |
| §3.3 audit, dependency-review, OSV, licences | `ci.yml` `sec-dependencies` ; `security-scheduled.yml` `audit` | — |
| §3.4 hooks, `_headers`, `index.html` | `ci.yml` `sec-build-hardening` | `_headers` absent tant que SEC-03a n'est pas livrée ; contrôle HSTS à ajouter avec SEC-03a |
| Agrégation | `ci.yml` `security`, puis `ci-ok` | `skipped` traité comme un échec dans `security` ; `ci-ok` exige déjà `success` strict (SEC-01) |
| §3.5 Dependabot | `.github/dependabot.yml` | entrée `docker-compose` sans effet (SEC-06) |
| §3.6 permissions | `ci.yml`, `security-scheduled.yml` | — (traités par SEC-01) |

Toute modification du bloc `SECDEVOPS-SLOT` passe par une revue secdevops (CODEOWNERS une fois SEC-02 en place).

## 5. Fichiers de configuration sécurité

| Fichier en place (fait foi) | Propriétaire | Brouillon d'origine (kickoff, figé) |
|---|---|---|
| [`.gitleaks.toml`](../../.gitleaks.toml) | secdevops | [`ci/gitleaks.toml`](ci/gitleaks.toml) |
| [`.semgrep/p152.yml`](../../.semgrep/p152.yml) | secdevops | [`ci/semgrep-p152.yml`](ci/semgrep-p152.yml) |
| [`scripts/check-licenses.mjs`](../../scripts/check-licenses.mjs) | devops (règles : secdevops) | [`ci/check-licenses.mjs`](ci/check-licenses.mjs) |
| [`.github/dependabot.yml`](../../.github/dependabot.yml) | devops | v1.0 de ce document |
| [`.github/workflows/security-scheduled.yml`](../../.github/workflows/security-scheduled.yml) | devops (contenu : secdevops) | v1.0 de ce document |
| `config/security-headers.mjs` → `public/_headers` | devops + secdevops | créé (SEC-03a) : le plugin Vite émet `dist/_headers` (pas de `public/_headers`) et configure `preview.headers` |
| `CODEOWNERS`, `SECURITY.md` | devops, avec l'accord du PO | **à créer (SEC-02)** |

Les brouillons de [`docs/security/ci/`](ci/) ne sont plus maintenus (ils peuvent déjà différer des fichiers en place : formatage, en-tête). **Toute modification se fait dans les fichiers en place.** Ils portent un bandeau « Obsolète, voir les fichiers en place » (SEC-01) et pourront être supprimés (des tâches du sprint 1 y font encore référence).

## 6. Dépôt GitHub (SEC-02, avec l'accord du PO)

### 6.1 Ordre du premier push (Sprint 2)

Le premier push publie d'un coup tout l'historique local. Ordre à respecter (repris du threat model §14) :

1. **SEC-03a mergée** dans `main` : `dist/_headers` généré ; `sec-build-hardening` rejoué en local et vert.
2. **Scan final des secrets** sur toutes les branches locales : `gitleaks git --config .gitleaks.toml --log-opts=--all --redact .` sans fuite ; `git ls-files` ne contient aucun `.env` (seul `.env.example`).
3. **MFA actif sur les comptes GitHub et Cloudflare du PO** (passkey ou clé de sécurité de préférence), avant la création du dépôt et du projet Pages.
4. Création du dépôt **public** par le PO (vide). **Avant le push** : secret scanning et **push protection** actifs, Dependabot alerts, **private vulnerability reporting**.
5. Fait par SEC-01 : `persist-credentials: false` sur tous les `checkout`, retrait de `id-token: write`, gitleaks et CodeQL hebdomadaires.
6. Push ; puis réglages ci-dessous (§6.2) ; puis SEC-01 : PR de test avec 4 échecs volontaires (faux secret, `innerHTML`, dépendance HIGH, `__p152test` dans `dist`), SARIF visibles dans Code scanning.

### 6.2 Réglages

- [ ] MFA sur tous les comptes avec droit d'écriture (passkey ou clé de sécurité de préférence).
- [ ] Ruleset `main` : PR obligatoire (fusion par « Create a merge commit » = `--no-ff`), check `ci-ok` requis, **code scanning merge protection** (CodeQL : Security ≥ High, Alerts ≥ Errors), force-push et suppression interdits. Note : avec PR obligatoire, le merge `--no-ff` du devops se fait via la PR et non par push direct.
- [ ] Secret scanning + **push protection**, Dependabot alerts et security updates, **private vulnerability reporting**, `SECURITY.md` (canal de signalement, délai de réponse, périmètre).
- [ ] Actions : jeton par défaut en lecture seule, « Require approval for all outside collaborators », création/approbation de PR par Actions désactivée, épinglage SHA obligatoire si l'option est proposée.
- [ ] `CODEOWNERS` : `.github/`, `.semgrep/`, `.gitleaks.toml`, `config/security-headers.mjs`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, `scripts/check-*.mjs`.
- [ ] Environnements `preview` et `production` (SEC-03b) : secrets Cloudflare uniquement ici ; `production` avec approbation du PO et tags `v*`. Déploiement par envoi direct (wrangler) de l'artefact testé, sans l'intégration Git de Cloudflare. URL `*.pages.dev` (pas de domaine personnalisé) : ne jamais supprimer le projet Pages une fois l'URL diffusée (threat model M-25).

## 7. Commandes locales (Windows, Git Bash) et état de vérification

Prérequis Git Bash pour les hooks et pnpm : `export PATH="/c/Program Files/nodejs:$APPDATA/npm:$PATH"` (si `$APPDATA` est au format Windows, utiliser le chemin `/c/Users/<user>/AppData/Roaming/npm`).

| Outil | Installation | Commande | État au 2026-10-19 |
|---|---|---|---|
| pnpm audit / licences | inclus avec pnpm 10.34.7 | `pnpm audit --audit-level high` ; `pnpm licenses list --prod --json > licenses.json && node scripts/check-licenses.mjs licenses.json` | Exécuté (US-001) |
| gitleaks | `winget install Gitleaks.Gitleaks` (vérifier l'id avec `winget search gitleaks`), `scoop install gitleaks`, ou binaire de la release officielle avec contrôle SHA-256 | `gitleaks git --config .gitleaks.toml --log-opts=--all --redact .` ; `gitleaks dir --redact dist` | Exécuté depuis un binaire vérifié dans le scratchpad (non installé sur le poste) |
| OSV-Scanner | binaire Windows de la release officielle ou `scoop install osv-scanner` | `osv-scanner scan --lockfile=pnpm-lock.yaml` | Exécuté (idem) |
| zizmor | binaire de la release `zizmorcore/zizmor`, `pipx install zizmor` ou `uvx zizmor` | `zizmor --offline --min-severity high .github/workflows/` | Exécuté (idem, mode hors ligne : les audits en ligne sont remplacés par la vérification `git ls-remote` des SHA) |
| Semgrep | démarrer Docker Desktop puis `docker run --rm -v "$PWD:/src:ro" semgrep/semgrep:1.181.0@sha256:<digest de ci.yml> semgrep scan --metrics=off --config p/typescript --config p/react --config p/javascript --config .semgrep/ /src` | idem CI | **Non exécuté** (démon Docker arrêté) : relecture manuelle ; à exécuter dès que `src/` contient du code applicatif (US-003) |
| CodeQL, dependency-review, Scorecard | services GitHub | — | **Non exécutables** sans dépôt distant |
| trivy | non requis au MVP | — | Sans objet |

Points restant à confirmer au premier passage sur GitHub (confiance moyenne) : support du lockfile pnpm 10 par Dependabot, comportement de `dependency-review-action` sur le graphe pnpm, remontée SARIF des PR de forks.

## 8. Suivi des findings du scan US-001

| Finding (sévérité) | Traitement |
|---|---|
| `dist/_headers` absent (contrôle bloquant) | SEC-03a, Sprint 2 en tête, avant le premier push |
| `persist-credentials` manquant sur 4 jobs (LOW) | **Corrigé (SEC-01)** |
| `id-token: write` superflu (LOW) | **Corrigé (SEC-01)** |
| gitleaks et CodeQL hebdomadaires absents (LOW) | **Corrigé (SEC-01)** |
| zizmor sans empreinte (LOW) | SEC-06 |
| Digests d'images non suivis par Dependabot (LOW) | SEC-06 |
| ESLint 9 déprécié (LOW) | SEC-06 (migration avec ADR) |
| `cooldown` Dependabot 3 jours (INFO) | Accepté (threat model §11) |
| Agrégateur `security` et `skipped` (INFO) | **Corrigé (SEC-01)** |
| En-tête « Brouillon » obsolète dans `.gitleaks.toml` et `scripts/check-licenses.mjs` (INFO) | `.gitleaks.toml` corrigé par secdevops (US-002) ; `scripts/check-licenses.mjs` : en-tête déjà à jour, brouillons de `docs/security/ci/` bannérisés (SEC-01) |
| Override `rollup: 4.64.7` (INFO) | Retrait à partir du 2026-10-23 (risque R8 du sprint) |

## 9. Historique des versions

| Version | Date | Changements |
|---|---|---|
| 1.0 | 2026-10-19 | Spécification initiale (kickoff) avec YAML proposé pour le slot, `dependabot.yml` et workflow hebdomadaire |
| 1.1 | 2026-10-19 | US-002 : état réel des contrôles et versions épinglées (§1, §1.1) ; YAML retiré au profit des workflows qui font foi (§4) ; décision `_headers` bloquant et SEC-03a ; ajout du contrôle HSTS avec SEC-03a ; findings LOW → SEC-06 (§8) ; Vitest 4.1.12 ; ordre du premier push (§6.1) ; état des vérifications locales (§7) |
| 1.2 | 2026-10-20 | Revue US-002 cycle 1 : MFA GitHub et Cloudflare du PO avant la création du dépôt (§6.1) |
| 1.3 | 2026-10-20 | SEC-01 : findings LOW de SEC-06 absorbés (persist-credentials, id-token, `skipped` = échec, gitleaks et CodeQL hebdomadaires) ; exécution locale consignée dans [`docs/ci/local-run-SEC-01.md`](../ci/local-run-SEC-01.md) ; Semgrep et CodeQL non vérifiés ; restent en SEC-06 : zizmor sans empreinte, digests d'images non suivis, migration ESLint |
