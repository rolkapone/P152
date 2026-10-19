# Utiliser l'équipe de dev

## Prérequis (Windows)
- Claude Code installé
- Git for Windows (Claude Code s'en sert sous Windows, et l'équipe travaille en branches git)
- La stack de l'app (Node, Python…) — devops te dira quoi installer au kickoff

## Démarrer
```powershell
cd F:\P152
claude
```
Puis dans Claude Code :
```
/kickoff Une app qui ... (décris ton idée : pour qui, quoi, contraintes, plateforme web/mobile/desktop)
```
Le scrum-master te pose quelques questions, tu valides la vision, le ux-designer imagine les écrans, tu valides la stack, puis le ui-designer crée le style visuel (tu le valides en ouvrant `docs\design\ui\maquettes\index.html` dans ton navigateur) pendant que l'équipe met en place le repo, la CI et le threat model.

À chaque sprint, les designers produisent les maquettes des écrans à développer : tu les ouvres, tu valides (ou tu demandes des retouches), et seulement ensuite le développement démarre.

## L'équipe
scrum-master · ux-designer · ui-designer · technical-artist (look 3D, déco, matériaux, styles) · graphics-engineer (scène 3D, rendu, perf) · developer · reviewer · qa-tester (tests navigateur, captures, FPS) · devops · secdevops

## Ensuite
- `/avancement` — point d'étape en 5 lignes : où on en est, combien de sprints avant le MVP
- `/sprint 1` — exécute tout le sprint (dev → review → sécu → merge pour chaque story), puis s'arrête pour ta démo
- `/story US-004` — fait passer une seule story par tout le circuit
- `/agents` — voir / modifier les agents
- Tu peux aussi appeler un agent directement : « demande au secdevops un audit complet de main »

## Ton rôle
Tu es le **Product Owner** : tu valides la vision, le backlog, la stack et chaque fin de sprint. L'équipe ne pousse rien sur un remote et ne déploie rien sans ton accord.

## Personnaliser
- Les rôles et le workflow : `CLAUDE.md`
- Chaque agent : `.claude/agents/*.md` (prompt, outils autorisés, modèle `sonnet` / `opus` / `haiku` / `inherit`)
- Les commandes : `.claude/commands/*.md`
