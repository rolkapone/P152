---
description: Exécute un sprint complet avec toute l'équipe
argument-hint: <numéro du sprint>
---

Lance le sprint $ARGUMENTS en suivant strictement le workflow de `CLAUDE.md`.

1. Agent **scrum-master** : finaliser `docs/sprints/sprint-$ARGUMENTS.md` (objectif, stories retenues, tâches, board). S'il existe une rétro du sprint précédent, appliquer ses actions.
2. Design du sprint, en parallèle quand c'est possible :
   - stories `[UI]` : **ux-designer** puis **ui-designer** (maquettes HTML) ;
   - stories `[3D]` : **technical-artist** (assets, matériaux, presets nécessaires).
   Le scrum-master ajoute les critères UX aux stories.
3. Me montrer l'objectif du sprint, la liste des stories (5 lignes max) et ce qu'il faut ouvrir pour voir les maquettes / aperçus, puis **attendre ma validation** (je peux demander des retouches).
4. Pour chaque story, dans l'ordre de priorité :
   implémentation (graphics-engineer pour `[3D]`, developer sinon) → reviewer → ui-designer en contrôle design (`[UI]`) → qa-tester (`[UI]`/`[3D]`) → secdevops → devops (CI + merge) → scrum-master (board à jour).
   3 cycles de correction max par story. Enregistre chaque rapport du reviewer dans `docs/reviews/<story-id>.md`.
   Si une story est bloquée (cycles dépassés, BLOCK sécurité non résolu, question produit) : la marquer BLOCKED, me le signaler en une ligne, et passer à la suivante.
5. À la fin : **scrum-master** écrit la revue et la rétro du sprint et met à jour le plan de release.
6. Me donner : stories livrées / non livrées, comment lancer l'app et tester la démo, estimation du nombre de sprints restants avant le MVP, questions ouvertes. Puis **t'arrêter** jusqu'à ma validation.
