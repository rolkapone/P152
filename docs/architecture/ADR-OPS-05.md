# ADR-OPS-05 — Conteneurs : pas d'image applicative au MVP ; image Playwright épinglée pour les E2E reproductibles

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** L'app est une SPA statique (ADR-APP-01) : la « production » est un dossier de fichiers sur un CDN. Le développement tourne nativement sur Windows (Node + pnpm). Les E2E (captures, rendu WebGL) varient entre Windows et Linux (polices, anti-crénelage), ce qui rend les comparaisons visuelles instables.

**Décision.**
- **Aucun Dockerfile applicatif** au MVP (rien à exécuter côté serveur). Pas de conteneur de dev obligatoire : `pnpm install && pnpm dev` doit suffire sous Windows.
- **Un seul conteneur, optionnel pour l'humain et utilisé en CI : l'environnement E2E.** `docker-compose.yml` avec un service `e2e` basé sur `mcr.microsoft.com/playwright:v<version Playwright>-noble` (tag **identique à la version de `@playwright/test`**, vérifié par un script), exécuté en utilisateur non-root, avec le code monté en lecture seule et `pnpm test:e2e` en commande. Le job `e2e` de la CI utilise la même image (`container:`).
- **Rendu WebGL en CI** : Chromium headless utilise un rendu logiciel (SwiftShader). Les **FPS mesurés en CI ne sont pas représentatifs** d'un GPU réel : en CI, la QA vérifie les budgets **déterministes** (draw calls, triangles, mémoire via `window.__p152perf`, poids chargé, absence d'erreurs) ; les FPS (60/30) sont mesurés **manuellement sur matériel réel** et consignés dans le rapport QA.
- Si une image applicative devient utile (R6, API maison) : Dockerfile multi-stage, image de base épinglée par digest, utilisateur non-root, système de fichiers en lecture seule, scan de l'image par secdevops (emplacement `security`). Pour un test « prod-like » local d'une SPA : `nginxinc/nginx-unprivileged` avec les mêmes en-têtes, optionnel.

**Conséquences.** (+) E2E identiques sur toutes les machines et en CI, pas de Docker obligatoire pour développer (Docker Desktop est lourd sous Windows). (−) Les développeurs sans Docker lancent les E2E nativement (captures légèrement différentes : les tests visuels de référence sont donc **générés et comparés uniquement dans l'image**).

**Alternatives écartées.**
1. **Conteneur de dev complet (devcontainer / compose pour tout)** : environnement uniforme, mais surcoût sous Windows (WSL2, volumes lents, HMR plus lent) pour une pile 100 % Node qui fonctionne déjà nativement.
2. **Dockerfile applicatif servant `dist` avec nginx dès le MVP** : une image à construire, scanner, héberger, pour servir des fichiers qu'un CDN gratuit sert mieux.
3. **Playwright installé nu sur les runners (`playwright install --with-deps`)** : plus simple, mais dépendances système variables selon l'image runner et temps d'installation à chaque exécution.
