# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Brainepedia App (`artifacts/brainepedia`)

React+Vite SPA with dark cyber-imperial theme (cyan `#00D2FF` / gold `#FFD700` / purple `#9D4EDD`).

### Tech Stack
- **Router**: wouter
- **Motion**: framer-motion
- **Charts**: recharts
- **UI**: shadcn/ui + tailwindcss v4
- **Forms**: react-hook-form + zod

### Auth
- Stored in localStorage: `brainepedia.auth.token` and `brainepedia.auth.user` (email, firstName, lastName, userId)
- RBAC roles: User, GlobalAdmin, Employer

### Routes (App.tsx)
- `/` landing, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-otp`, `/change-password`
- `/dashboard` — role-based redirect → `/admin/dashboard`, `/employer/dashboard`, `/user/dashboard`
- `/admin/*` — GlobalAdmin dashboards: dashboard, professions, districts, problem-nodes, seed, users
- `/user/profile`, `/user/profile/edit`, `/user/profile/create`, `/user/activity`, `/user/badges`, `/user/subscription-success`
- `/profession/select` → SelectProfession
- `/profession/:professionId` → DistrictMap (hex-grid city map)

### API facts
- All admin mutating endpoints: `?userId=` as URL query param
- All field names: PascalCase in FormData
- Profession POST two-step: POST then PUT to persist Name
- `POST /Professions/generate-seed?count=N`
- `POST /Districts/seed-districts/{professionId}`
- `POST /ProblemNodes/ai-generate?userId=` — AI-generated problem node

### Admin AI Features
- **AdminProfessions**: "Generate with AI" modal with count picker, animated loading messages, preview list, Accept All/Regenerate
- **AdminDistricts**: "Generate with AI" button triggers `POST /Districts/seed-districts/{professionId}` with animated overlay
- **AdminProblemNodes**: "Generate with AI" side panel with rich preview (title, context, mission brief, constraints list, expected outcomes list, XP/time badges), Regenerate + Save actions

## Content Calendar App (`artifacts/content-calendar`)

Standalone React+Vite SPA for the Brainepedia v2 marketing team. Runs on port 5000 (main workflow).

### Features
- **Dashboard**: stats cards, posts by platform bar charts, content pillar breakdown, status overview, content format mix, upcoming content panel
- **Calendar Table**: spreadsheet-style editable table with all 16 columns (date, day, campaign, pillar, platform, type, hook, caption, CTA, hashtags, media, designer, status, time, priority, link, notes), drag-and-drop row reorder, column visibility toggle, search + filters (status/platform/pillar), duplicate/delete rows
- **Monthly View**: calendar grid with per-day post dots, click to see day details, navigate months
- **AI Assistant**: template-based content generator for hooks, captions, CTAs, hashtag packs, campaign names by pillar/platform/type; "Add to Calendar" prefills the edit modal
- **Generate Monthly Calendar**: modal to auto-create a full month of draft posts by frequency and campaign goals
- **Export**: Excel (.xlsx with freeze row, auto-filter, column widths, summary sheet) and CSV download, print view
- **Data**: 40 preloaded June 2026 entries covering Beta Launch, Career Transformation, AI Learning, Experience Elevator, and more
- **Persistence**: localStorage key `brainepedia-calendar-v2`

### Stack
- React 19 + Vite + Tailwind v4 (no config file)
- `xlsx` (SheetJS) for Excel export
- Lucide React icons
- No external router (single-page, view state in App.tsx)

## User Preferences

### Deployment Build
- Always use `node build-release.mjs` to produce the deployment package at `brainepedia-release/`
- Deployment structure is always **flat** (no `public/` subdirectory) — all files at the root:
  ```
  assets/                  Vite JS + CSS assets
  favicon.png / favicon.svg
  index.html
  opengraph.jpg
  package.json
  pino-file.mjs
  pino-pretty.mjs
  pino-worker.mjs
  server.js                Express proxy + SPA server (iisnode entry)
  thread-stream-worker.mjs
  web.config
  ```
- Always Node.js + iisnode deployment (CJS bundle via esbuild, pino workers renamed to `.mjs`)
