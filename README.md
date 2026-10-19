# P152

3D desk-setup planner (React + TypeScript + Vite + three.js). See `docs/` for vision, backlog and architecture.

## Prerequisites (Windows: PowerShell or Git Bash)

- Node.js 24 LTS (`.nvmrc`)
- pnpm 10: `npm i -g pnpm@10.34.7`
- Git with Git LFS (`git lfs install`, bundled with Git for Windows)

## Commands

| Command             | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `pnpm install`      | Install dependencies                                  |
| `pnpm dev`          | Dev server on http://localhost:5173                   |
| `pnpm test`         | Unit tests (Vitest); `pnpm test:cov` adds coverage    |
| `pnpm lint`         | ESLint; `pnpm format` / `pnpm format:check` Prettier  |
| `pnpm typecheck`    | `tsc --noEmit`                                        |
| `pnpm build`        | Production build in `dist/`                           |
| `pnpm check`        | Everything CI runs (except E2E and assets)            |
| `pnpm check:assets` | Fails on files > 1 MiB not stored in Git LFS          |

Copy `.env.example` to `.env` for local settings (never committed).
Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`...).
