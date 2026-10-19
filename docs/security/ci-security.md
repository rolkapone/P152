# Sécurité en CI — P152

> Story : US-002 (définition des scans) ; intégration : SEC-01 (devops + secdevops). Auteur : secdevops, 2026-10-19.
> Cadre : ADR-OPS-01 (pnpm, `onlyBuiltDependencies`, `minimumReleaseAge`), ADR-OPS-03 (GitHub Actions, slot `# SECDEVOPS-SLOT`, `ci-ok`), ADR-OPS-06 (Cloudflare Pages, CSP stricte, hooks `VITE_E2E`), ADR-APP-03 (import), threat model `docs/security/threat-model.md`.
> **Le devops intègre** : secdevops n'édite pas `.github/`. Les brouillons de fichiers sont dans `docs/security/ci/` avec leur chemin cible.

## 1. Vue d'ensemble

| Contrôle | Outil | Quand | Bloquant | Sortie | Menaces |
|---|---|---|---|---|---|
| Secrets (historique complet) | gitleaks (binaire épinglé + checksum) | PR, push `main`, hebdo | **Toute détection** | log masqué (`--redact`) | M-19 |
| Secrets (build) | gitleaks `dir dist` | PR, push `main` | **Toute détection** | log | M-19 |
| Secrets (plateforme) | GitHub secret scanning + push protection | à chaque push | **Push refusé** | alertes | M-19 |
| SAST code | CodeQL `javascript-typescript`, suite `security-extended` | PR, push `main`, hebdo | **≥ High** via ruleset « code scanning merge protection » | SARIF | M-03, SR-02 |
| SAST workflows | CodeQL `actions` + zizmor | PR, push `main` | zizmor **high** ; CodeQL ≥ High via ruleset | SARIF / log | M-17, M-18 |
| SAST règles projet | Semgrep CE (`p/typescript`, `p/react`, `p/javascript`, `.semgrep/p152.yml`) | PR, push `main` | règles **ERROR** | SARIF | M-03, M-11, M-12, SR-01/02 |
| Vulnérabilités dépendances | `pnpm audit --audit-level high` | PR, push `main`, hebdo | **HIGH/CRITICAL** (prod et dev) | log | M-16 |
| Vulnérabilités dépendances (2e source) | OSV-Scanner (`pnpm-lock.yaml`) | PR, push `main`, hebdo | non (rapport) | SARIF | M-16 |
| Diff de dépendances en PR | `actions/dependency-review-action` | PR | **HIGH/CRITICAL** + licence hors liste | résumé du job | M-16, M-20, M-21 |
| Licences | `pnpm licenses list --prod` + `scripts/check-licenses.mjs` | PR, push `main` | licence **hors liste blanche** | log | M-21 |
| CSP et en-têtes du build | bash sur `dist/_headers` | PR, push `main` | directive manquante ou interdite | log | M-11, SR-03 |
| `index.html` sans inline ni tiers | bash sur `dist/index.html` | PR, push `main` | script/style inline, URL externe | log | M-11, M-14 |
| Hooks de test absents | grep `__p152test`, `__p152perf`, `VITE_E2E` dans `dist/` | PR, push `main` | **toute occurrence** | log | M-12, SR-04 |
| Mises à jour | Dependabot (npm, github-actions, docker-compose) | hebdo + alertes sécurité | n/a (PR revues) | PR | M-16, M-17 |
| Hygiène du dépôt | OpenSSF Scorecard (optionnel) | hebdo | non | SARIF | M-17, M-20, M-22 |
| Conteneurs / IaC | trivy | **pas au MVP** (aucune image applicative, ADR-OPS-05) ; à activer dès qu'un Dockerfile applicatif ou de l'IaC apparaît (R6) | HIGH/CRITICAL | SARIF | — |

Le job `assets` (budgets, licences des assets, LFS) reste propriété du devops/technical-artist ; secdevops le considère comme un contrôle de conformité (M-28).

## 2. Politique de sévérité

| Sévérité | En PR | Sur `main` (scan hebdo) | Suite |
|---|---|---|---|
| Secret | **Bloque** | Bloque + incident | Révocation et rotation **immédiates** (dépôt public : le secret est considéré compromis), puis nettoyage |
| CRITICAL | **Bloque** | Correctif sous 24 h | Retour à l'implémenteur |
| HIGH | **Bloque** | Correctif sous 7 jours | Retour à l'implémenteur |
| MEDIUM | Signalé | Backlog sous 30 jours | Item proposé au scrum-master |
| LOW / info | Signalé | Backlog au mieux | Item proposé au scrum-master |

**Exceptions** (faux positif vérifié, vulnérabilité non atteignable, ex. CVE d'un serveur de dev Vite jamais exposé) : uniquement avec identifiant (GHSA/CVE/règle), justification, approbateur secdevops et **date d'expiration ≤ 30 jours**, consignées dans `docs/security/exceptions.md` (créé à la première exception) et dans l'outil :
- `pnpm audit` : `auditConfig.ignoreGhsas` (dans `pnpm-workspace.yaml`) ;
- OSV-Scanner : `osv-scanner.toml` `[[IgnoredVulns]]` avec `ignoreUntil` et `reason` ;
- Semgrep : commentaire `// nosemgrep: <id> -- <raison>` ;
- CodeQL : rejet de l'alerte dans l'onglet Code scanning avec motif ;
- gitleaks : `[[allowlists]]` de `.gitleaks.toml` (jamais pour un vrai secret).

## 3. Détail des contrôles

### 3.1 Secrets — gitleaks
- Historique **complet** (`fetch-depth: 0`) : un secret supprimé dans un commit ultérieur reste exploitable.
- Configuration : `docs/security/ci/gitleaks.toml` → `.gitleaks.toml` (règles par défaut + jeton Cloudflare + variables `VITE_*` nommées comme des secrets, car **toute variable `VITE_*` est publique**).
- Binaire téléchargé depuis la release officielle, **version épinglée et somme SHA-256 vérifiée** (pas d'action tierce : `gitleaks-action` demande une licence pour les comptes d'organisation).
- Second passage sur `dist/` (`gitleaks dir`) : attrape un secret injecté au build par une variable d'environnement.
- Local (optionnel, hook pre-commit via `simple-git-hooks`, ignoré si l'outil est absent) : `gitleaks git --pre-commit --staged --redact`.

### 3.2 SAST — CodeQL + Semgrep + zizmor
- **CodeQL** (gratuit sur dépôt public) : `javascript-typescript` en `build-mode: none`, suite `security-extended` ; langage `actions` pour les workflows. CodeQL ne fait pas échouer le job : le blocage passe par le **ruleset de `main`** (« Require code scanning results », seuil *Security: High or higher*, *Alerts: Errors*) — voir SEC-02.
- **Semgrep CE** (image `semgrep/semgrep` épinglée par digest, `--metrics=off`) : deux passes, une complète en SARIF (toutes sévérités, Code scanning), une bloquante `--severity ERROR --error`. Règles projet : `docs/security/ci/semgrep-p152.yml` → `.semgrep/p152.yml` (puits HTML du DOM, `dangerouslySetInnerHTML`, code dynamique, stockage hors `persistence/`, `JSON.parse` hors `core/io`, hooks de test, `postMessage`, `Math.random` pour des ids, `http://`). Elles doublent volontairement les règles ESLint (`no-eval`, `react/no-danger`) : ESLint peut être désactivé localement par un commentaire, Semgrep est revu par secdevops.
- **zizmor** (analyse statique des workflows GitHub Actions) : `pull_request_target`, injection de contexte dans `run:`, actions non épinglées, `persist-credentials`, permissions excessives, empoisonnement de cache. Bloquant à partir de *high*.

### 3.3 Dépendances (SCA) et licences
- `pnpm audit --audit-level high` (lit le lockfile, pas besoin d'installer) : **bloquant**, dépendances de prod **et** de dev (les outils de build s'exécutent en CI et produisent le bundle). En cas d'indisponibilité du service d'audit, le job échoue (pas de faux vert) et est relancé.
- OSV-Scanner sur `pnpm-lock.yaml` : seconde base de données, **non bloquant** au départ (rapport SARIF), pour éviter un double blocage sur des sévérités non normalisées ; à rendre bloquant après un sprint d'observation si le bruit est faible.
- `dependency-review-action` (PR seulement, graphe de dépendances gratuit sur dépôt public) : bloque l'**introduction** d'une dépendance HIGH/CRITICAL ou sous licence non autorisée, affiche le score OpenSSF.
- Licences : `pnpm licenses list --prod --json` → `scripts/check-licenses.mjs` (brouillon `docs/security/ci/check-licenses.mjs`). Liste blanche : MIT, MIT-0, ISC, 0BSD, BSD-2/3-Clause, Apache-2.0, Zlib, CC0-1.0, Unlicense, BlueOak-1.0.0, Python-2.0. À revoir (avertissement) : MPL-2.0, CC-BY-3.0/4.0. Tout le reste (GPL, AGPL, LGPL, SSPL, BUSL, CC-BY-NC, inconnu) bloque.
- **Revue humaine de toute nouvelle dépendance directe** (secdevops, à chaque story) : le paquet existe et correspond au dépôt source attendu, âge et activité, nombre de mainteneurs, scripts d'installation, poids, alternative sans dépendance. C'est la principale parade au typosquatting et aux noms inventés par un agent (M-16, acteur T-A).

### 3.4 Contrôle du build (`build-hardening`)
Exécuté sur l'artefact `dist` du job `build` (celui-là même qui serait déployé) :
1. **Hooks de test** : aucune occurrence de `__p152test`, `__p152perf` ni `VITE_E2E` dans `dist/`. Prérequis : `build.sourcemap` à `false` en production (les source maps contiennent le code source, y compris la branche éliminée, et feraient échouer le contrôle) — amendement US-001.
2. **`dist/_headers`** présent et contenant :
   - CSP avec `default-src 'self'`, `script-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`, `frame-ancestors 'none'` ;
   - nulle part `'unsafe-inline'`, `'unsafe-eval'`, `'unsafe-hashes'` ; dans `script-src` ni `*`, ni `data:`, ni `blob:`, ni `http:`/`https:` ;
   - `'wasm-unsafe-eval'` : **avertissement** jusqu'à l'ADR de SEC-10, ensuite accepté ;
   - `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`.
3. **`dist/index.html`** : aucun `<script>` sans `src`, aucun `<style>`, aucun attribut `style=`, aucun `src`/`href` vers `http(s)://` (pas de CDN, polices auto-hébergées).
4. **gitleaks** sur `dist/`.

Le test E2E (job `e2e`, QA) complète ce contrôle statique : échec sur tout `securitypolicyviolation` avec la même CSP (amendement US-022). Après déploiement, SEC-03 vérifie les en-têtes réellement servis.

### 3.5 Épinglage et mises à jour
- **Actions** : épinglées par SHA de commit complet avec la version en commentaire (`uses: actions/checkout@<sha40> # v5.0.0`). Résolution d'un tag : `git ls-remote https://github.com/actions/checkout refs/tags/v5.0.0` (prendre le SHA du commit ; pour un tag annoté, la ligne `^{}`). Activer l'option de dépôt « Require actions to be pinned to a full-length commit SHA » si disponible.
- **Images** : épinglées par digest (`image:tag@sha256:...`), résolu par `docker buildx imagetools inspect <image:tag>`.
- **Outils téléchargés** (gitleaks, zizmor) : version exacte ; checksum vérifié pour les binaires.
- **Dependabot** retenu (natif, gratuit, aligné sur ADR-OPS-01) plutôt que Renovate ; Renovate reste le repli si le support du lockfile pnpm 10 par Dependabot pose problème. `cooldown` aligné sur `minimumReleaseAge` ; les mises à jour de **sécurité** ne sont pas retardées par le cooldown.

### 3.6 Permissions et déclencheurs
- Workflow : `permissions: contents: read` par défaut ; seuls les jobs qui publient du SARIF ont `security-events: write`.
- `checkout` avec `persist-credentials: false` partout.
- **Jamais** de `pull_request_target`, ni de `workflow_run` qui consomme un artefact de PR (sauf ADR + revue secdevops).
- Aucun secret dans `ci.yml` : les secrets de déploiement vivent dans `deploy.yml` sous l'environnement protégé (SEC-03).
- Les PR de forks (dépôt public) s'exécutent avec un jeton en lecture seule : l'envoi SARIF peut y échouer ; c'est attendu, le résultat du scan reste visible dans le log.

## 4. YAML proposé pour le slot `# SECDEVOPS-SLOT` de `.github/workflows/ci.yml`

Hypothèses à vérifier par le devops lors de l'intégration :
- le job `build` publie l'artefact de production sous le nom **`dist`** ;
- `pnpm/action-setup` lit la version dans `package.json#packageManager`, Node via `.nvmrc` ;
- les `<SHA>`, `<VERSION>`, `<DIGEST>` et `<SHA256>` sont remplacés par des valeurs résolues (je n'invente aucun SHA : les valeurs doivent être lues sur les dépôts officiels au moment de l'intégration) ;
- `ci-ok` ajoute `security` à ses `needs`.

```yaml
  # ============================ SECDEVOPS-SLOT ============================
  # Propriétaire : secdevops. Spécification : docs/security/ci-security.md
  # Toute modification de ce bloc passe par une revue secdevops (CODEOWNERS).

  sec-secrets:
    name: security / secrets (gitleaks)
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    permissions:
      contents: read
    env:
      GITLEAKS_VERSION: "<VERSION>"     # ex. 8.x.y, >= 8.25
      GITLEAKS_SHA256: "<SHA256>"       # ligne linux_x64 de gitleaks_<VERSION>_checksums.txt
    steps:
      - uses: actions/checkout@<SHA> # vX.Y.Z
        with:
          fetch-depth: 0              # historique complet
          persist-credentials: false
      - name: Installer gitleaks (version et checksum épinglés)
        run: |
          set -euo pipefail
          url="https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz"
          curl -sSfL -o /tmp/gitleaks.tgz "$url"
          echo "${GITLEAKS_SHA256}  /tmp/gitleaks.tgz" | sha256sum -c -
          tar -xzf /tmp/gitleaks.tgz -C /tmp gitleaks
          sudo install -m 0755 /tmp/gitleaks /usr/local/bin/gitleaks
      - name: gitleaks sur tout l'historique git
        run: |
          set -euo pipefail
          cfg=(); [ -f .gitleaks.toml ] && cfg=(--config .gitleaks.toml)
          gitleaks git "${cfg[@]}" --redact --verbose --exit-code 1 .

  sec-codeql:
    name: security / codeql (${{ matrix.language }})
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    permissions:
      contents: read
      security-events: write
      actions: read
    strategy:
      fail-fast: false
      matrix:
        language: [javascript-typescript, actions]
    steps:
      - uses: actions/checkout@<SHA> # vX.Y.Z
        with:
          persist-credentials: false
      - uses: github/codeql-action/init@<SHA> # vX.Y.Z
        with:
          languages: ${{ matrix.language }}
          build-mode: none
          queries: security-extended
          config: |
            paths-ignore:
              - tests/fixtures/**
              - dist/**
      - uses: github/codeql-action/analyze@<SHA> # vX.Y.Z
        with:
          category: "/language:${{ matrix.language }}"

  sec-semgrep:
    name: security / semgrep
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    permissions:
      contents: read
      security-events: write
    container:
      image: semgrep/semgrep:<VERSION>@sha256:<DIGEST>
    steps:
      - uses: actions/checkout@<SHA> # vX.Y.Z
        with:
          persist-credentials: false
      - name: Semgrep, rapport complet (SARIF, non bloquant)
        run: >
          semgrep scan --metrics=off
          --config p/typescript --config p/react --config p/javascript
          --config .semgrep/
          --exclude tests/fixtures --exclude dist
          --sarif --output semgrep.sarif
      - name: Envoi SARIF
        if: always() && hashFiles('semgrep.sarif') != ''
        uses: github/codeql-action/upload-sarif@<SHA> # vX.Y.Z
        with:
          sarif_file: semgrep.sarif
          category: semgrep
      - name: Semgrep, règles bloquantes (ERROR)
        run: >
          semgrep scan --metrics=off
          --config p/typescript --config p/react --config p/javascript
          --config .semgrep/
          --exclude tests/fixtures --exclude dist
          --severity ERROR --error

  sec-workflows:
    name: security / workflows (zizmor)
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@<SHA> # vX.Y.Z
        with:
          persist-credentials: false
      - uses: astral-sh/setup-uv@<SHA> # vX.Y.Z
      - name: zizmor (bloquant à partir de high)
        env:
          GH_TOKEN: ${{ github.token }}   # audits en ligne (actions vulnérables connues), lecture seule
        run: uvx zizmor@<VERSION> --min-severity high .github/workflows/

  sec-dependencies:
    name: security / dependencies & licences
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@<SHA> # vX.Y.Z
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@<SHA> # vX.Y.Z
      - uses: actions/setup-node@<SHA> # vX.Y.Z
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - name: pnpm audit (bloquant HIGH/CRITICAL, prod + dev)
        run: pnpm audit --audit-level high
      - name: Dependency review (PR uniquement)
        if: github.event_name == 'pull_request'
        uses: actions/dependency-review-action@<SHA> # vX.Y.Z
        with:
          fail-on-severity: high
          fail-on-scopes: runtime, development
          allow-licenses: MIT, MIT-0, ISC, 0BSD, BSD-2-Clause, BSD-3-Clause, Apache-2.0, Zlib, CC0-1.0, Unlicense, BlueOak-1.0.0, Python-2.0, MPL-2.0, CC-BY-4.0, CC-BY-3.0
          comment-summary-in-pr: never
          show-openssf-scorecard: true
          warn-on-openssf-scorecard-level: 3
      - name: OSV-Scanner (rapport, non bloquant)
        uses: google/osv-scanner-action/osv-scanner-action@<SHA> # vX.Y.Z
        continue-on-error: true
        with:
          scan-args: |-
            --lockfile=pnpm-lock.yaml
            --format=sarif
            --output=osv.sarif
      - name: Envoi SARIF OSV
        if: always() && hashFiles('osv.sarif') != ''
        uses: github/codeql-action/upload-sarif@<SHA> # vX.Y.Z
        with:
          sarif_file: osv.sarif
          category: osv-scanner
      - name: Installation (scripts limités par onlyBuiltDependencies)
        run: pnpm install --frozen-lockfile
      - name: Licences des dépendances de production
        run: |
          set -euo pipefail
          pnpm licenses list --prod --json > licenses.json
          node scripts/check-licenses.mjs licenses.json

  sec-build-hardening:
    name: security / build hardening (CSP, headers, test hooks)
    needs: build
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    permissions:
      contents: read
    env:
      GITLEAKS_VERSION: "<VERSION>"
      GITLEAKS_SHA256: "<SHA256>"
    steps:
      - uses: actions/download-artifact@<SHA> # vX.Y.Z
        with:
          name: dist
          path: dist
      - name: Hooks de test absents du build de production
        run: |
          set -euo pipefail
          if grep -rIlE '__p152test|__p152perf|VITE_E2E' dist/; then
            echo "::error::Hook de test ou VITE_E2E présent dans dist/ (ADR-APP-08, M-12)"; exit 1
          fi
          if find dist -name '*.map' | grep -q .; then
            echo "::error::Source maps présentes dans dist/ (build.sourcemap doit être false en prod)"; exit 1
          fi
      - name: CSP et en-têtes de sécurité (dist/_headers)
        run: |
          set -euo pipefail
          H=dist/_headers; fail=0
          [ -f "$H" ] || { echo "::error::$H absent"; exit 1; }
          csp="$(grep -iE '^[[:space:]]*Content-Security-Policy:' "$H" | head -n1 | cut -d: -f2-)"
          [ -n "$csp" ] || { echo "::error::Aucune Content-Security-Policy dans $H"; exit 1; }
          for d in "default-src 'self'" "script-src 'self'" "object-src 'none'" \
                   "base-uri 'none'" "form-action 'none'" "frame-ancestors 'none'"; do
            grep -qF -- "$d" <<<"$csp" || { echo "::error::CSP : directive manquante : $d"; fail=1; }
          done
          for bad in "'unsafe-inline'" "'unsafe-eval'" "'unsafe-hashes'"; do
            if grep -qF -- "$bad" "$H"; then echo "::error::Source interdite dans $H : $bad"; fail=1; fi
          done
          script_src="$(grep -oE "script-src[^;]*" <<<"$csp" || true)"
          if grep -qE "(^|[[:space:]])(\*|data:|blob:|http:|https:)" <<<"${script_src#script-src}"; then
            echo "::error::script-src trop large : $script_src"; fail=1
          fi
          if grep -qF "'wasm-unsafe-eval'" <<<"$csp"; then
            echo "::warning::'wasm-unsafe-eval' présent : autorisé uniquement après l'ADR de SEC-10"
          fi
          for h in "X-Content-Type-Options: nosniff" "Referrer-Policy:" "Permissions-Policy:" \
                   "Cross-Origin-Opener-Policy: same-origin"; do
            grep -qiF -- "$h" "$H" || { echo "::error::En-tête manquant : $h"; fail=1; }
          done
          exit "$fail"
      - name: index.html sans script/style en ligne ni ressource tierce
        run: |
          set -euo pipefail
          I=dist/index.html; fail=0
          if grep -Pzq '(?is)<script\b(?![^>]*\bsrc\s*=)[^>]*>' "$I"; then echo "::error::<script> en ligne dans $I"; fail=1; fi
          if grep -Piq '<style\b' "$I"; then echo "::error::<style> en ligne dans $I"; fail=1; fi
          if grep -Piq '\sstyle\s*=' "$I"; then echo "::error::attribut style= dans $I"; fail=1; fi
          if grep -Piq '\s(src|href)\s*=\s*["'"'"']?(https?:)?//' "$I"; then echo "::error::ressource externe dans $I"; fail=1; fi
          exit "$fail"
      - name: Installer gitleaks (version et checksum épinglés)
        run: |
          set -euo pipefail
          url="https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz"
          curl -sSfL -o /tmp/gitleaks.tgz "$url"
          echo "${GITLEAKS_SHA256}  /tmp/gitleaks.tgz" | sha256sum -c -
          tar -xzf /tmp/gitleaks.tgz -C /tmp gitleaks
          sudo install -m 0755 /tmp/gitleaks /usr/local/bin/gitleaks
      - name: gitleaks sur dist/
        run: gitleaks dir --redact --verbose --exit-code 1 dist

  security:
    name: security
    if: always()
    needs: [sec-secrets, sec-codeql, sec-semgrep, sec-workflows, sec-dependencies, sec-build-hardening]
    runs-on: ubuntu-24.04
    timeout-minutes: 2
    permissions: {}
    steps:
      - name: Verdict sécurité
        env:
          RESULTS: ${{ toJSON(needs.*.result) }}
        run: |
          echo "$RESULTS"
          if echo "$RESULTS" | grep -qE '"(failure|cancelled)"'; then
            echo "::error::Au moins un contrôle de sécurité a échoué"; exit 1
          fi
  # ========================== fin SECDEVOPS-SLOT ==========================
```

Remarques d'intégration :
- `sec-build-hardening` est `skipped` si `build` échoue ; `ci-ok` échoue déjà dans ce cas.
- Si le contrôle « hooks absents » existe aussi dans le job `build` (ADR-OPS-03), on garde les deux : celui-ci est la vérification indépendante de secdevops.
- Le chemin de `.semgrep/` est un dossier : Semgrep charge tous les `.yml` qu'il contient.
- Temps estimé : 3 à 5 min en parallèle des autres jobs (CodeQL est le plus long).

## 5. Fichiers d'accompagnement (le devops les crée)

| Brouillon (secdevops) | Cible |
|---|---|
| `docs/security/ci/gitleaks.toml` | `.gitleaks.toml` |
| `docs/security/ci/semgrep-p152.yml` | `.semgrep/p152.yml` |
| `docs/security/ci/check-licenses.mjs` | `scripts/check-licenses.mjs` |
| section 5.1 ci-dessous | `.github/dependabot.yml` |
| section 5.2 ci-dessous | `.github/workflows/security-scheduled.yml` |

### 5.1 `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: npm            # couvre pnpm (pnpm-lock.yaml) ; vérifier le support pnpm 10
    directory: /
    schedule: { interval: weekly, day: monday, time: "05:00", timezone: Europe/Paris }
    cooldown:                         # aligné sur minimumReleaseAge ; ne retarde pas les MAJ de sécurité
      default-days: 3
      semver-major-days: 7
    open-pull-requests-limit: 10
    versioning-strategy: increase
    groups:
      dev-tooling:
        dependency-type: development
        update-types: [minor, patch]
      runtime-minor:
        dependency-type: production
        update-types: [minor, patch]
    commit-message: { prefix: chore, include: scope }
    labels: [dependencies]

  - package-ecosystem: github-actions # met à jour les SHA épinglés et leur commentaire de version
    directory: /
    schedule: { interval: weekly, day: monday, time: "05:00", timezone: Europe/Paris }
    cooldown: { default-days: 3 }
    groups:
      actions:
        patterns: ["*"]
    commit-message: { prefix: ci, include: scope }
    labels: [dependencies, ci]

  - package-ecosystem: docker-compose # image Playwright (ADR-OPS-05) ; si non supporté, utiliser "docker"
    directory: /
    schedule: { interval: weekly }
    commit-message: { prefix: chore, include: scope }
    labels: [dependencies]
```

### 5.2 `.github/workflows/security-scheduled.yml` (hebdomadaire)

But : détecter les nouvelles CVE sur `main` sans attendre une PR, et suivre l'hygiène du dépôt.

```yaml
name: security-scheduled
on:
  schedule:
    - cron: "23 4 * * 1"     # lundi 04:23 UTC
  workflow_dispatch:
permissions:
  contents: read
jobs:
  audit:
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    permissions:
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@<SHA> # vX.Y.Z
        with: { persist-credentials: false }
      - uses: pnpm/action-setup@<SHA> # vX.Y.Z
      - uses: actions/setup-node@<SHA> # vX.Y.Z
        with: { node-version-file: .nvmrc }
      - run: pnpm audit --audit-level high
      - uses: google/osv-scanner-action/osv-scanner-action@<SHA> # vX.Y.Z
        continue-on-error: true
        with:
          scan-args: |-
            --lockfile=pnpm-lock.yaml
            --format=sarif
            --output=osv.sarif
      - if: always() && hashFiles('osv.sarif') != ''
        uses: github/codeql-action/upload-sarif@<SHA> # vX.Y.Z
        with: { sarif_file: osv.sarif, category: osv-scanner-scheduled }

  scorecard:                   # optionnel, recommandé sur dépôt public
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    permissions:
      contents: read
      security-events: write
      id-token: write          # requis uniquement si publish_results: true
    steps:
      - uses: actions/checkout@<SHA> # vX.Y.Z
        with: { persist-credentials: false }
      - uses: ossf/scorecard-action@<SHA> # vX.Y.Z
        with:
          results_file: scorecard.sarif
          results_format: sarif
          publish_results: false
      - uses: github/codeql-action/upload-sarif@<SHA> # vX.Y.Z
        with: { sarif_file: scorecard.sarif, category: scorecard }
```

CodeQL est également à planifier chaque semaine : ajouter `schedule` au déclencheur de `ci.yml` ou dupliquer le job `sec-codeql` ici (choix du devops).

## 6. Réglages du dépôt GitHub (SEC-02, avec l'accord du PO)

- [ ] MFA sur tous les comptes avec droit d'écriture.
- [ ] Ruleset `main` : PR obligatoire (fusion par « Create a merge commit » = `--no-ff`), check `ci-ok` requis, **code scanning merge protection** (CodeQL : Security ≥ High, Alerts ≥ Errors), force-push et suppression interdits. Note : avec PR obligatoire, le merge `--no-ff` du devops se fait via la PR et non par push direct.
- [ ] Secret scanning + **push protection**, Dependabot alerts et security updates, **private vulnerability reporting**, `SECURITY.md` (canal de signalement, délai de réponse, périmètre).
- [ ] Actions : jeton par défaut en lecture seule, « Require approval for all outside collaborators », création/approbation de PR par Actions désactivée, épinglage SHA obligatoire si l'option est proposée.
- [ ] `CODEOWNERS` : `.github/`, `.semgrep/`, `.gitleaks.toml`, `config/security-headers.mjs`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, `scripts/check-*.mjs`.
- [ ] Environnements `preview` et `production` (SEC-03) : secrets Cloudflare uniquement ici ; `production` avec approbation du PO et tags `v*`.

## 7. Commandes locales (Windows) et état de vérification

| Outil | Installation | Commande |
|---|---|---|
| gitleaks | `winget install Gitleaks.Gitleaks` (vérifier l'id avec `winget search gitleaks`) ou `scoop install gitleaks` | `gitleaks git --redact .` |
| Semgrep | `pipx install semgrep` (support Windows natif récent) ou Docker : `docker run --rm -v "${PWD}:/src" semgrep/semgrep semgrep scan --config p/typescript --config .semgrep/` | idem CI |
| OSV-Scanner | binaire Windows de la release officielle ou `scoop install osv-scanner` | `osv-scanner scan --lockfile=pnpm-lock.yaml` |
| zizmor | `pipx install zizmor` ou `uvx zizmor` | `zizmor .github/workflows/` |
| pnpm audit / licences | inclus avec pnpm | `pnpm audit --audit-level high` ; `pnpm licenses list --prod` |
| trivy | non requis au MVP | — |

**État au 2026-10-19** : aucun de ces outils (ni Node/pnpm) n'est installé sur le poste, et le dépôt ne contient encore aucun code ni workflow : **aucun scan n'a pu être exécuté**. Le YAML, les règles Semgrep et le script de licences ont été revus manuellement mais **pas exécutés** ; ils devront être validés au premier passage en CI (critère de SEC-01 : PR de test avec 4 cas d'échec volontaires). Points à confirmer à ce moment-là (confiance moyenne) : format JSON de `pnpm licenses list` en pnpm 10, support de l'écosystème `docker-compose` et du lockfile pnpm 10 par Dependabot, syntaxe `[[allowlists]]` de la version de gitleaks retenue.
