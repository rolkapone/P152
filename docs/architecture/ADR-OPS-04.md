# ADR-OPS-04 — Assets lourds : Git LFS (> 1 Mo), contrôle en CI, aucun binaire hors règles

> Index des ADR : [index.md](index.md). Découpé de l'ancien `docs/architecture.md` (contenu inchangé).


**Contexte.** CLAUDE.md : Git LFS si un asset dépasse 1 Mo. Le MVP est procédural (peu ou pas de binaires) mais R2/R3/R4 amènent GLB, KTX2, HDRI. L'historique Git ne doit pas gonfler. Git LFS est livré avec Git for Windows.

**Décision.**
- `.gitattributes` (créé avec le repo) : `*.glb *.gltf(bin) *.ktx2 *.hdr *.exr *.basis *.psd *.blend *.fbx *.mp4 *.webm` → `filter=lfs diff=lfs merge=lfs -text` ; sources lourdes (`.blend`, `.psd`) rangées sous `assets/source/` et jamais copiées dans `public/` ni dans le build. Les PNG/JPG/SVG légers (UI) restent en Git normal.
- Garde-fou en CI et en `pre-commit` : `scripts/check-assets.mjs` échoue si un fichier > 1 Mo est suivi hors LFS, ou si un fichier LFS est resté à l'état « pointeur » dans `dist`.
- CI : `actions/checkout` avec `lfs: true` **uniquement** dans les jobs qui en ont besoin (`assets`, `build` dès qu'il y a des binaires, `e2e`) pour économiser la bande passante LFS.
- Budgets d'assets : lus depuis `assets/catalog/budgets.json` (propriété du technical-artist) et appliqués par `check:assets` (ADR-3D-04) ; le script ne contient aucun seuil en dur.
- Quota : le stockage/bande passante LFS gratuit de GitHub est limité (de l'ordre de 10 Gio, **à vérifier à l'ouverture du repo**) ; surveillance par le devops à chaque release ; les rebuilds de CI ne retéléchargent que les jobs concernés.
- Les fichiers binaires servis en production sont **ceux du build** (hachés dans `dist/assets/`), pas les pointeurs LFS.

**Conséquences.** (+) Dépôt léger à cloner, historique propre, règle automatisable. (−) Chaque contributeur doit avoir `git lfs install` (inclus dans Git for Windows, rappelé dans le README) ; le quota gratuit peut devenir limitant en R4 (bibliothèque de modèles) ; réécrire l'historique pour migrer vers LFS après coup est pénible, d'où la règle posée dès le premier commit.

**Alternatives écartées.**
1. **Binaires directement dans Git** : simple jusqu'à ce que l'historique atteigne des centaines de Mo ; irréversible sans réécriture d'historique.
2. **Stockage externe d'assets (bucket R2/S3) référencé par hash, hors Git** : pas de quota LFS, mais assets non versionnés avec le code, build non reproductible hors ligne, secrets/droits d'accès à gérer. Option de repli si le quota LFS est dépassé (R4).
3. **Dépôt séparé pour les assets (submodule)** : isole le poids, mais submodules = friction pour une équipe qui apprend, et CI plus complexe.
