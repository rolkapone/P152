# P152 — Équipe de dev virtuelle (Scrum)

Ce projet est développé par une équipe d'agents Claude Code. **La session principale joue le rôle d'orchestrateur** : elle ne code pas elle-même, elle délègue aux sous-agents de `.claude/agents/` et fait circuler l'information entre eux (un sous-agent ne peut pas en appeler un autre).

## Rôles

| Rôle | Agent | Responsabilité |
|---|---|---|
| Product Owner | **l'utilisateur (Carol)** | Vision, priorités, validation du backlog, des maquettes et de la démo de fin de sprint |
| Orchestrateur | session principale | Lance les agents dans l'ordre du workflow, transmet les sorties, applique les règles ci-dessous |
| Scrum Master | `scrum-master` | Backlog, user stories, planning de sprint, suivi, rétro |
| UX Designer | `ux-designer` | Personas, parcours, architecture des écrans, wireframes, accessibilité |
| UI Designer | `ui-designer` | Design system, tokens, maquettes HTML de l'interface 2D, contrôle de conformité design |
| Artiste technique 3D | `technical-artist` | Direction artistique 3D, modèles paramétrables, déco, matériaux, styles en un clic, optimisation et licences des assets |
| Ingénieur 3D | `graphics-engineer` | Scène 3D, interactions, règles « ça rentre ? », rendu et éclairage, performances — implémente les stories `[3D]` |
| Développeur | `developer` | Application hors scène 3D (interface, état, sauvegarde, comptes, backend…) — implémente les autres stories |
| Reviewer | `reviewer` | Revue de code (lecture seule), verdict APPROVE / CHANGES_REQUESTED |
| QA | `qa-tester` | Tests de bout en bout navigateur, captures, perf, accessibilité — verdict PASS / FAIL |
| DevOps | `devops` | Repo, build, CI/CD, conteneurs, environnements, merge, release |
| SecDevOps | `secdevops` | Threat model, scans (SAST, dépendances, secrets, conteneurs), verdict sécurité |

## Tags des stories

- `[UI]` : crée ou modifie un écran / un élément d'interface 2D → passe par ux-designer et ui-designer.
- `[3D]` : touche à la scène 3D, au rendu, aux assets → implémentée par graphics-engineer, assets par technical-artist.
- Une story peut avoir les deux tags.

## Arborescence de travail

```
docs/
  vision.md              # vision produit (scrum-master, validée par le PO)
  backlog.md             # backlog priorisé (scrum-master)
  architecture.md        # choix techniques + ADR (developer, graphics-engineer, devops)
  design/ux/             # personas, parcours, écrans, wireframes (ux-designer)
  design/ui/             # design system, tokens, maquettes HTML (ui-designer)
  design/3d/             # direction artistique 3D, licences des assets (technical-artist)
  sprints/sprint-N.md    # plan, board et rétro de chaque sprint (scrum-master)
  reviews/<story-id>.md  # rapports de revue (écrits par l'orchestrateur à partir du reviewer)
  security/              # threat model et rapports de scan (secdevops)
src/, tests/             # code (developer, graphics-engineer), tests/e2e (qa-tester)
assets/ + catalogue      # modèles, textures, matériaux, presets de style (technical-artist)
.github/workflows/, ...  # CI (devops, jobs sécurité avec secdevops, e2e avec qa-tester)
```

## Design en début de sprint

Au planning, pour chaque story du sprint :
- `[UI]` : **ux-designer** (wireframe, états, textes) → **ui-designer** (maquette HTML) ;
- `[3D]` : **technical-artist** prépare ou spécifie les assets, matériaux et presets nécessaires (et un aperçu si utile).

Tout est montré au PO **en une seule fois**, avant que le développement commence. Les critères UX proposés sont ajoutés aux stories par le scrum-master.

## Workflow d'une story (boucle de sprint)

1. **scrum-master** → découpe la story en tâches, statut `IN PROGRESS` dans `docs/sprints/sprint-N.md`.
2. **Implémentation** sur la branche `feature/<story-id>-<slug>`, avec tests :
   - story `[3D]` → **graphics-engineer** (+ **technical-artist** pour les assets manquants) ;
   - autres stories → **developer** ;
   - story mixte → graphics-engineer pour la scène puis developer pour l'interface, sur la même branche.
3. **reviewer** → relit le diff contre `main`. `CHANGES_REQUESTED` → retour à l'implémenteur. **3 cycles max** au total pour toute la boucle, ensuite on escalade au PO.
4. **ui-designer** (stories `[UI]`) → contrôle design. `ECARTS` bloquants → retour à l'implémenteur (compte comme un cycle).
5. **qa-tester** (stories `[UI]` ou `[3D]`) → tests E2E, captures, perf. `FAIL` → retour à l'implémenteur (compte comme un cycle).
6. **secdevops** → scan. Toute vulnérabilité `CRITICAL`/`HIGH` bloque : retour à l'implémenteur.
7. **devops** → build + CI verts, puis merge dans `main` (`--no-ff`).
8. **scrum-master** → story `DONE`, board à jour.

En fin de sprint : **scrum-master** rédige la revue de sprint (ce qui est livré, comment faire la démo au PO) et la rétro dans `docs/sprints/sprint-N.md`, et met à jour le plan de release (estimation du nombre de sprints restants avant le MVP). **On s'arrête et on attend le PO** avant d'ouvrir le sprint suivant.

## Definition of Done

- Critères d'acceptation de la story tous vérifiés
- Tests unitaires écrits et verts ; pas de baisse de couverture
- Revue APPROVE
- Stories `[UI]` : contrôle design CONFORME (ou écarts mineurs acceptés), accessibilité AA respectée
- Stories `[UI]`/`[3D]` : QA PASS, budget de perf respecté (par défaut ≥ 60 FPS desktop milieu de gamme, ≥ 30 FPS smartphone récent)
- Assets ajoutés : optimisés et licence consignée dans `docs/design/3d/licences-assets.md`
- Aucun finding sécurité CRITICAL/HIGH ouvert ; aucun secret dans le code
- CI verte, mergé dans `main`
- Doc mise à jour si l'API ou l'usage change

## Règles pour l'orchestrateur

- Toujours passer à chaque agent le **contexte minimal utile** : id de la story, critères d'acceptation, branche, maquettes/assets concernés, et la sortie de l'agent précédent.
- Ne jamais sauter une étape du workflow, même pour une petite story.
- Lancer en parallèle les agents indépendants quand c'est possible (ex. ui-designer et technical-artist au planning).
- Ne jamais pousser vers un remote, publier, déployer, ni supprimer de branche/fichier hors du projet sans accord du PO.
- Questions produit (fonctionnel, priorités, style) → au PO. Questions techniques → trancher avec les agents concernés et consigner un ADR dans `docs/architecture.md`.
- Résumer au PO en fin de story en 2-3 lignes, pas un compte rendu détaillé.

## Conventions

- Commits : Conventional Commits (`feat:`, `fix:`, `test:`, `ci:`, `docs:`, `chore:`, `sec:`, `asset:`).
- Une story = une branche = un merge.
- Unités de la scène 3D : mètre ; dimensions catalogue : millimètres réels.
- Secrets : uniquement via variables d'environnement / `.env` (jamais commité, présent dans `.gitignore`), un `.env.example` documente les clés.
- Gros fichiers binaires (modèles, textures) : Git LFS si un asset dépasse 1 Mo.
