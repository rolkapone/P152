---
description: Démarre le projet - vision, backlog, UX, stack, direction artistique, repo, threat model
argument-hint: <description de l'app>
---

Démarrage du projet. Description de l'app par le Product Owner :

$ARGUMENTS

Suis `CLAUDE.md`. Étapes, dans l'ordre :

1. Agent **scrum-master** : rédiger `docs/vision.md` et un premier `docs/backlog.md` (stories taguées `[UI]` / `[3D]`, MVP clairement séparé de la vision long terme). Si des points produit essentiels manquent, s'arrêter et me poser **au maximum 5 questions** avant de continuer.
2. Me présenter la vision et le top du backlog en résumé court, et **attendre ma validation**.
3. Agent **ux-designer** : personas, parcours, architecture des écrans, principes UX. Me résumer les écrans prévus.
4. Proposition de stack et d'architecture : **graphics-engineer** (moteur 3D, format de scène, perf), **developer** (application, sauvegarde, backend éventuel), puis **devops** (build, CI, hébergement). ADR dans `docs/architecture.md`, avec 2 alternatives écartées et pourquoi. L'architecture doit permettre la vision long terme (matériaux, styles, déco, partage) même si le MVP ne l'implémente pas. **Me demander validation de la stack.**
5. Après validation — en parallèle :
   - **ui-designer** : design system, tokens adaptés à la stack, page catalogue `docs/design/ui/maquettes/index.html` ;
   - **technical-artist** : direction artistique 3D, liste des assets du MVP avec leurs sources et licences, premiers presets de style ;
   - **devops** : initialiser le repo, l'outillage et la CI ;
   - **secdevops** : rédiger le threat model et définir les jobs sécurité.
   Puis **devops** + **qa-tester** : intégrer à la CI les jobs sécurité et les tests E2E Playwright.
6. Me montrer la direction visuelle (interface + rendu 3D : comment ouvrir les pages) et **attendre ma validation** du style.
7. **scrum-master** : ajouter au backlog les stories issues du threat model et les critères UX, écrire le plan de release (estimation du nombre de sprints avant le MVP) et préparer le Sprint 1 dans `docs/sprints/sprint-1.md`.
8. Me résumer l'état en quelques lignes et me dire de lancer `/sprint 1` quand je suis prêt.
