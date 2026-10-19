# P152

3D desk-setup planner (React + TypeScript + Vite + three.js). See `docs/` for vision, backlog and architecture.

## Prerequisites (Windows: PowerShell or Git Bash)

- Node.js 24 LTS (`.nvmrc`)
- pnpm 10: `npm i -g pnpm@10.34.7`
- Git with Git LFS (`git lfs install`, bundled with Git for Windows)

## Commands

| Command                               | What it does                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                        | Install dependencies (CI: `pnpm install --frozen-lockfile`)                                                                     |
| `pnpm dev`                            | Dev server on http://localhost:5173                                                                                             |
| `pnpm test`                           | Unit tests (Vitest); `pnpm test:cov` adds coverage                                                                              |
| `pnpm lint`                           | ESLint; `pnpm format` / `pnpm format:check` Prettier                                                                            |
| `pnpm typecheck`                      | `tsc --noEmit`                                                                                                                  |
| `pnpm build`                          | Production build in `dist/`                                                                                                     |
| `pnpm check`                          | Everything CI runs on the app (format, lint, types, tests + coverage, build, bundle guard); not E2E, assets, audit nor licences |
| `pnpm check:assets`                   | Fails on files > 1 MiB not stored in Git LFS                                                                                    |
| `pnpm check:bundle`                   | Fails if test hooks (`__p152test`, `__p152perf`, `VITE_E2E`) are found in `dist/` (run after `pnpm build`)                      |
| `pnpm build:e2e` then `pnpm test:e2e` | E2E build (test hooks) + Playwright; first run: `pnpm exec playwright install chromium`                                         |
| `pnpm audit --audit-level high`       | Dependency audit (blocking in CI, job `sec-dependencies`)                                                                       |

Copy `.env.example` to `.env` for local settings (never committed).
Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`...).

Supply chain: `pnpm-workspace.yaml` holds `onlyBuiltDependencies` (install-script allow-list) and `minimumReleaseAge` (3 days). Local CI run results: `docs/ci/local-run-US-001.md`.
