# Scan sécurité SEC-03a : En-têtes de sécurité et CSP

- Date : 2026-10-20. Branche `feature/SEC-03a-headers-csp` (HEAD `553e62f`) contre `main` : 5 commits, 17 fichiers (+282/-10), aucun changement dans `src/`, `package.json` ni `pnpm-lock.yaml`.
- Entrée : revue APPROVE, cycle 1 ([`docs/reviews/SEC-03a.md`](../../reviews/SEC-03a.md)).
- Outils : Semgrep 1.181.0 (image `semgrep/semgrep@sha256:81474464…304b`, le digest de `ci.yml`, Docker 29.8.2), gitleaks 8.30.1, OSV-Scanner 2.7.0 (binaires vérifiés aux scans précédents), pnpm 10.34.7, Playwright Chromium (SwiftShader).

VERDICT: PASS

## Contrôles exécutés

| Contrôle | Commande / méthode | Résultat |
|---|---|---|
| **SAST Semgrep** (première exécution réelle sur le projet) | Comme le job `sec-semgrep` : `docker run --rm -v F:/P152:/src:ro semgrep/semgrep:1.181.0@sha256:8147…304b semgrep scan --metrics=off --config p/typescript --config p/react --config p/javascript --config .semgrep/ --exclude tests/fixtures --exclude dist`, puis la même commande avec `--severity ERROR --error` | 83 règles (74 du registre, 9 de `.semgrep/p152.yml`), 107 fichiers, 0 erreur d'analyse. **4 WARNING, 0 ERROR** ; le mode bloquant renvoie 0. Les 4 WARNING sont `p152-test-hook-reference` dans `src/render/scene/PerfProbe.tsx:2,36,86,112`. Ils sont attendus : le module n'est chargé que si `VITE_E2E`, et il est absent de `dist` (voir plus bas). Avertissements Semgrep sur les motifs `include`/`exclude` non ancrés de `p152.yml` (finding 4) |
| SCA bloquant | `pnpm audit --audit-level high` | **No known vulnerabilities found** |
| SCA 2e source | `osv-scanner scan source --lockfile pnpm-lock.yaml` | **No issues found** |
| Dépendances ajoutées | `git diff main... -- package.json pnpm-lock.yaml` | Aucune |
| Secrets, branche | `gitleaks git --config .gitleaks.toml --log-opts=main..feature/SEC-03a-headers-csp --redact .` | **no leaks found** |
| Secrets, tout l'historique | `gitleaks git --config .gitleaks.toml --log-opts=--all --redact .` (8 branches locales, 88 commits) | **no leaks found** |
| Secrets, fichiers | `gitleaks dir` sur `dist`, `config`, `public`, `tests/e2e`, ainsi que les fichiers non suivis `KICKOFF.txt` et `_claude-setup/` | **no leaks found** ; `git ls-files` ne suit que `.env.example` |
| Auteurs | `git log --all --format='%ae %ce'` | Les 88 commits ont tous `81617903+rolkapone@users.noreply.github.com`, aucune adresse professionnelle |
| Build | `pnpm build` | `dist/_headers` (664 o), `index.html`, `react-aria-pressable.css`, `assets/` |
| **sec-build-hardening** | Les 3 étapes `run:` de `ci.yml` (hooks de test et source maps ; CSP et en-têtes ; `index.html` sans contenu en ligne), extraites du workflow et rejouées sur `dist`, puis `gitleaks dir dist` | **3/3 OK**. **Contre-épreuve** : avec un `_headers` modifié (`style-src 'self' 'unsafe-inline'`, `max-age=300`), l'étape échoue comme prévu sur les deux erreurs |
| En-têtes servis | `vite preview` sur `dist` (production), `curl -I` puis Playwright | Les en-têtes servis sont identiques à `dist/_headers` ; `react-aria-pressable.css` est servi en `text/css` avec `nosniff` |
| **Runtime CSP (clôture du finding 1 de US-004)** | `dist` de production servi avec les en-têtes de prod et ouvert dans Playwright Chromium. Écouteur `securitypolicyviolation` posé avant le chargement, console collectée. Actions : attente de la scène `ready`, clic sur les 5 boutons, glisser et molette sur le canvas | **0 violation, 0 erreur console** (seulement l'avertissement `THREE.Clock` déprécié, connu). DOM : **0 élément `<style>`**, `#react-aria-pressable-style` est un `LINK`, 3 éléments pressables avec `touch-action` calculé `manipulation` (la règle s'applique). Requêtes : `/`, `react-aria-pressable.css`, 2 JS, 1 CSS, **0 requête externe** |
| Contre-épreuve runtime | Même `dist`, sans la ligne `<link id="react-aria-pressable-style">` | Le finding réapparaît : 1 violation `style-src-elem inline` (`index-*.js:71`), React Aria injecte un `<style>`, `touch-action: auto`. La détection fonctionne et le correctif est bien la cause de la disparition de la violation |
| Autres injecteurs de style | grep `createElement("style")`, `insertRule`, `adoptedStyleSheets` dans `dist` | 2 occurrences : celle de React Aria `usePress` (neutralisée), et le code des styles « hoistables » de React DOM, qui n'est utilisé que pour un `<style precedence>` en JSX (absent de `src/`). `usePreventScroll` (overlays) n'est pas dans le bundle actuel. Un futur overlay serait détecté par la fixture CSP des E2E |

## CSP et en-têtes contre le threat model (M-11, SR-03) et ADR-OPS-06

| Exigence | Constat | État |
|---|---|---|
| CSP identique à ADR-OPS-06 | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests` : identique caractère pour caractère (et imposé par `tests/unit/security-headers.test.ts`) | Conforme |
| Pas de `unsafe-inline`, `unsafe-eval` ni `unsafe-hashes` (SR-03) | Absents ; le contrôle CI bloque leur ajout (vérifié par la contre-épreuve) | Conforme |
| Source unique (M-11) | `config/security-headers.mjs` sert à `dist/_headers`, à `preview.headers` (preview et E2E), au test unitaire et à la fixture E2E. Le plugin émet directement `dist/_headers` au lieu de `public/_headers` : écart de forme avec M-11, équivalent sur le fond, `ci-security.md` déjà corrigé | Conforme (texte du threat model mis à jour) |
| E2E en échec sur `securitypolicyviolation` (ADR-OPS-06 point 3) | `tests/e2e/fixtures.ts` : fixture `auto`, importée par les 6 specs, qui collecte les événements et les erreurs console CSP | Conforme |
| `nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, `COOP same-origin`, `HSTS max-age=31536000` | Présents. HSTS ≥ 1 an est désormais contrôlé en CI. Pas de `includeSubDomains`/`preload` sur `*.pages.dev` : c'est correct, ADR-OPS-06 les réserve à un domaine du PO (SEC-37) | Conforme |
| `X-Frame-Options` | Absent : `frame-ancestors 'none'` le couvre pour tous les navigateurs supportés (ADR-OPS-06) | Conforme |
| Dev server | Pas de CSP sur `vite dev` (le HMR en a besoin), comme le prévoit l'ADR. La CSP est vérifiée sur preview et en E2E | Conforme |

### Avis demandés

**`Cross-Origin-Resource-Policy: same-origin`** : favorable, **non bloquant** (LOW, finding 2). Il empêche une page tierce de charger nos ressources en `no-cors` (`<img>`, `<script>`) dans son processus, ce qui protège contre les attaques par canal auxiliaire de type Spectre et le hotlinking des modèles et textures (bande passante, R4). L'application ne charge que des ressources de sa propre origine, ce qui est vérifié au runtime : rien ne casse. Les aperçus Cloudflare (`<hash>.p152.pages.dev`) sont des origines distinctes mais autonomes, et les robots d'aperçu de lien chargent côté serveur, donc ne sont pas concernés. Deux points d'attention : (a) si un jour une image doit être intégrée par un site tiers (partenaires, affiliation R5), il faudra une règle `cross-origin` limitée à ce chemin ; (b) si les assets passent sur une autre origine (bucket R2), c'est cette origine qui portera son propre CORP. `same-site` n'apporte rien de plus ici (`pages.dev` est dans la Public Suffix List, donc « site » = le projet). Ajout à faire **d'abord dans ADR-OPS-06** puis dans `security-headers.mjs`, dans SEC-03b. Inutile de bloquer SEC-03a pour cela.

**`img-src data:`** : acceptable, **sans risque significatif**. Une image `data:` ne peut pas exécuter de script (un SVG chargé via `<img>` ou en fond CSS ne fait tourner ni script ni requête externe) et ne permet pas d'exfiltration : le contenu est déjà dans la page, et l'exfiltration passerait par `img-src` vers un hôte externe, qui reste interdit. Le seul risque est une usurpation visuelle à partir d'une injection HTML, déjà maîtrisée par SR-02. Le besoin est anticipé (textures embarquées des glTF et miniatures générées, R2/R4), mais **aucun usage aujourd'hui** (0 `data:image` dans `dist`). Par moindre privilège, on aurait pu attendre la première story qui en a besoin. L'ADR l'a validé en connaissance de cause et la confiance est haute que c'est sans impact : je le garde, sans finding. En revanche, **`data:` ne doit jamais apparaître dans `script-src`, `style-src`, `worker-src` ni `connect-src`** : le contrôle CI le vérifie pour `script-src` ; finding 5 pour les autres directives.

## Revue manuelle ciblée du diff

| Point | Constat | État |
|---|---|---|
| `config/security-headers.mjs` | Objets figés, aucune entrée externe ; `renderHeadersFile` produit un format `_headers` Cloudflare valide (LF, indentation de 2 espaces) | Conforme |
| `index.html` + `public/react-aria-pressable.css` | `<link>` de même origine, aucun contenu en ligne. Le contenu est identique au `textContent` de `react-aria@3.53.1` `usePress` (la revue l'a vérifié, et `touch-action` est bien appliqué au runtime). Le fichier n'est pas haché : il est servi avec le cache par défaut de Pages (revalidation), donc pas de risque de version périmée bloquante | Conforme. La revue recommande un test de non-divergence (finding 3) |
| `tests/e2e/fixtures.ts` | `exposeFunction`/`addInitScript` limités aux tests ; rien dans `dist` (contrôle hooks OK) | Conforme |
| `ci.yml` (contrôle HSTS) | `grep -oE 'max-age=[0-9]+'` + comparaison numérique ; une valeur absente donne 0 et l'étape échoue | Conforme |
| `vite.config.ts` | Le plugin s'applique au build et à preview, pas au dev | Conforme |
| Règle `/index.html` du `_headers` | Ne s'applique pas à `/` sur Cloudflare Pages (relevé par la revue). Sans incidence sécurité : Pages sert le HTML en revalidation par défaut, et les en-têtes de sécurité sont sur `/*` | SEC-03b (vérification sur un vrai déploiement) |

## Findings

| # | Sévérité | Source | Emplacement | Problème | Correction recommandée | Confiance |
|---|---|---|---|---|---|---|
| 1 | — (clôture) | runtime | US-004 finding 1 (MEDIUM, React Aria `<style>` inline) | **CLOS** par SEC-03a : 0 violation au runtime avec la CSP de prod. La contre-épreuve reproduit la violation sans le correctif. Sans `unsafe-inline` ni hash | — | haute |
| 2 | LOW | manuel | `config/security-headers.mjs`, ADR-OPS-06 | Pas de `Cross-Origin-Resource-Policy` (voir l'avis ci-dessus) | Ajouter `Cross-Origin-Resource-Policy: same-origin` sur `/*`, d'abord dans ADR-OPS-06, puis dans le contrôle `sec-build-hardening` ; SEC-03b | haute |
| 3 | LOW | manuel (revue, confirmé) | `public/react-aria-pressable.css` | Une mise à jour de React Aria pourrait changer la règle ou l'id `react-aria-pressable-style` sans qu'on le voie. Si l'id change, la violation reviendra et la fixture E2E la détectera. Si seule la règle change, rien ne le signale | Test unitaire qui compare le fichier au `textContent` et au `STYLE_ID` de `usePress.mjs` installé (non-bloquant n° 1 de la revue) ; à rattacher à SEC-06 | haute |
| 4 | LOW | Semgrep (avertissement outil) | `.semgrep/p152.yml` (`p152-json-parse-outside-io`, `-test-hook-reference`, `-insecure-random`, `-plain-http-url`, `-react-dangerously-set-inner-html`, `-storage-outside-persistence`) | Les motifs `paths.include`/`exclude` du type `src/**` vont être interprétés comme ancrés (`/src/**`) par une prochaine version de Semgrep. Le résultat est identique ici, car le scan part de la racine, mais un changement de comportement silencieux est possible lors d'une montée de version de l'image | Écrire explicitement `/src/**`, `/src/core/io/**`, etc. (secdevops, SEC-06) | haute |
| 5 | LOW | manuel | `ci.yml` `sec-build-hardening` | Le contrôle refuse les sources larges (`*`, `data:`, `blob:`, `http(s):`) dans `script-src` seulement. Un ajout de `data:`/`*` dans `style-src`, `connect-src` ou `worker-src` ne serait pas bloqué. Le test unitaire d'égalité stricte le détecterait, mais il peut être modifié dans la même PR. Rejoint le non-bloquant n° 8 de la revue sur `style-src 'self'` | Étendre la boucle : `style-src` = `'self'` exactement, et pas de `*`/`data:`/`http(s):` dans `connect-src`/`worker-src` ; SEC-06 | haute |
| 6 | INFO | manuel | `security-headers.mjs` (`preview.headers`) | HSTS et `upgrade-insecure-requests` servis par `vite preview` : sans effet en HTTP sur `localhost`. Une preview HTTPS épinglerait HSTS un an sur l'hôte, et une preview via l'IP du réseau local casserait les sous-ressources | Une ligne dans le README (non-bloquant n° 3 de la revue) | haute |

Aucun finding CRITICAL ni HIGH, aucun secret. Les findings 2 à 6 sont proposés au scrum-master comme items de backlog (2 dans SEC-03b ; 3, 4 et 5 dans SEC-06).

## Conditions avant le premier push (threat model §14), une fois SEC-03a mergée

| # | Condition | État au 2026-10-20 |
|---|---|---|
| 1 | SEC-03a mergée, `sec-build-hardening` vert en local | **Vert sur la branche** (ce scan). Reste : merge `--no-ff` par devops, puis rejouer `pnpm build` + les 3 étapes sur `main` |
| 2 | Scan gitleaks final de toutes les branches, aucun `.env` suivi | **Propre aujourd'hui** (88 commits, 8 branches). **À refaire juste avant le push**, car `feature/US-006-choix-bureau` continue d'avancer |
| 3 | MFA du PO | **À faire / à confirmer par le PO** : GitHub (passkey ou clé) **avant le push**. Cloudflare : avant la création du compte ou du projet Pages (SEC-03b), donc pas un prérequis du push si aucun compte Cloudflare n'est encore relié au projet |
| 4 | Dépôt public créé, protections actives avant le push | Dépôt `rolkapone/P152` créé et vide (remote `origin`). **Reste à confirmer dans Settings > Code security** : secret scanning + **push protection**, private vulnerability reporting, Dependabot alerts. Pour les dépôts publics, GitHub active normalement le secret scanning par défaut ; la push protection doit être vérifiée explicitement (confiance moyenne) |
| 5 | `persist-credentials: false`, retrait de `id-token: write`, gitleaks et CodeQL hebdomadaires | **Fait** (SEC-01) : tous les `checkout` de `ci.yml` et `security-scheduled.yml`, aucun `id-token` dans `.github/`, jobs hebdomadaires présents |
| — | Réécriture des e-mails (adresse noreply) | **Fait** : les 88 commits ont tous l'adresse noreply. Le bundle de sauvegarde d'avant la réécriture se trouve dans le scratchpad, hors du dépôt : il ne doit jamais être poussé ni ajouté au dépôt |
| 6 | Après le push | SEC-02 : ruleset `main` (`ci-ok`, code scanning ≥ High), `CODEOWNERS`, `SECURITY.md`, réglages Actions (jeton en lecture seule, approbation des forks). Puis SEC-01 : PR de test avec 4 échecs volontaires, SARIF visibles |
