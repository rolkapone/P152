# ADR-OPS-07 — Environnements, branches et release : trunk-based court, `--no-ff`, semver, CHANGELOG

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** Règles projet : une story = une branche = un merge `--no-ff` ; Conventional Commits ; seul le devops merge sur `main` après reviewer APPROVE, secdevops validé, QA PASS. Équipe d'agents + un PO : pas besoin de multiplier les environnements.

**Décision.**
- **Branches** : `main` (toujours vert, déployable), `feature/<story-id>-<slug>` de courte durée (une story), `hotfix/<slug>` si besoin. Pas de branche `develop`, pas de `release/*` tant qu'un seul train de livraison existe. Les branches de travail sont rebasées/mises à jour sur `main` avant le merge si `main` a avancé (le devops relance alors la CI). Suppression de branche après merge : **sur accord du PO** (règle projet).
- **Merge d'une story** (devops) : rejouer `pnpm check` + E2E sur la branche, `git merge --no-ff feature/...`, rejouer sur `main`, puis noter le résultat. Rouge = pas de merge, renvoi de l'erreur exacte.
- **Environnements** :
  | Environnement | Source | URL | Rôle |
  |---|---|---|---|
  | local | poste Windows | `localhost:5173` | dev, hooks `VITE_E2E` possibles |
  | preview | chaque PR (artefact `dist`) | URL `*.pages.dev` par branche, `X-Robots-Tag: noindex` | démo au PO, QA manuelle |
  | production | tag de release sur `main` | `*.pages.dev` puis domaine du PO | version publique |

  Pas de staging séparé (la preview de `main` joue ce rôle). Les previews et la production ne contiennent **aucun secret** (tout `VITE_*` est public) ; il n'y a pas de variable d'environnement sensible au MVP, `.env.example` documente les clés (vides ou factices).
- **Release (à la demande du PO)** : tag **semver** `vMAJOR.MINOR.PATCH` annoté sur `main` ; `0.x` jusqu'au MVP, `1.0.0` à la validation du MVP par le PO, puis un MINOR par release produit (R2, R3…) ; `CHANGELOG.md` au format *Keep a Changelog*, alimenté depuis les commits Conventional Commits par le devops, version du `package.json` alignée sur le tag ; GitHub Release avec le changelog. Déploiement en production **uniquement sur ordre du PO**, depuis le tag.
- **Dépôt distant** : création, premier `push`, protections de branche et secrets GitHub **uniquement après accord du PO**. Si le dépôt est privé sur le plan gratuit (pas de protection de branche), le devops applique la règle par processus ; un dépôt public (ou un plan payant) permet d'activer les « rulesets » avec `ci-ok` obligatoire.

**Conséquences.** (+) Process minimal, lisible, aligné sur le workflow Scrum du projet ; chaque story est un merge auditable, annulable avec `git revert -m 1`. (−) Sans protection de branche automatique, le respect du « main vert » repose sur le devops ; pas de staging isolé (acceptable sans backend).

**Alternatives écartées.**
1. **GitFlow (develop + release + hotfix)** : prévu pour des versions parallèles maintenues ; ici une seule version vivante, cela ajouterait des merges sans bénéfice.
2. **Commits directs sur `main` / squash systématique** : plus rapide, mais perd le lien story-branche exigé par les règles du projet et la lisibilité de l'historique (`--no-ff`) ; le squash est écarté pour garder les commits Conventional Commits individuels.
3. **Déploiement continu automatique de `main` en production** : tentant, mais contraire à la règle « rien n'est déployé sans accord du PO » ; la production suit les tags décidés par le PO.
4. **Changesets / release-please / semantic-release** : automatisent versions et changelog, mais sont pensés pour des bibliothèques publiées ou ajoutent un bot/PR de release ; surdimensionné pour une application à un seul livrable. Réévaluable si le projet se scinde en packages (ADR-APP-07).
