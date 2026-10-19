---
description: Fait passer une seule story par tout le workflow (design, dev, review, QA, sécu, merge)
argument-hint: <id de la story, ex. US-004>
---

Traite uniquement la story $ARGUMENTS en suivant le workflow de `CLAUDE.md` :

- si elle est `[UI]` et n'a pas encore de maquette : ux-designer → ui-designer ; si elle est `[3D]` et que des assets manquent : technical-artist. Me montrer le résultat et attendre ma validation.
- ensuite : implémentation (graphics-engineer pour `[3D]`, developer sinon) → reviewer → ui-designer en contrôle design (`[UI]`) → qa-tester (`[UI]`/`[3D]`) → secdevops → devops (CI + merge) → scrum-master (mise à jour du board).

3 cycles de correction max. Enregistre le rapport du reviewer dans `docs/reviews/$ARGUMENTS.md`. Termine par un résumé de 3 lignes : livré ou non, ce qui a coincé, prochaine story conseillée.
