# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

Condominium (HOA) management system. npm workspaces monorepo with two packages:

- `server/` — NestJS API, Prisma ORM, SQLite, JWT auth with role-based access (`ADMIN`, `SINDICO`, `MORADOR`)
- `client/` — React + TypeScript SPA, MUI components, React Query, React Router

Domain: residents/units, financial charges & payments, common-area bookings, announcements, maintenance requests.

## Setup

```bash
npm install
```

Backend needs `server/.env` (copy `server/.env.example`), then:

```bash
npm run prisma:migrate
npm run prisma:seed   # creates admin/admin user
```

Frontend needs `client/.env` with `VITE_API_URL=http://localhost:3000`.

## Commands

Run from repo root unless noted.

| Command | Purpose |
|---|---|
| `npm run dev` | Start backend (port 3000) and frontend (port 5173) concurrently |
| `npm run build` | Build server and client for production |
| `npm run test` | Run backend e2e tests, then Playwright e2e tests |
| `npm run test:api` | Backend e2e tests only (`server`, jest) |
| `npm run test:playwright` | Playwright browser tests only |
| `npm run prisma:generate` / `prisma:migrate` / `prisma:seed` | Prisma tasks, proxied to `server` workspace |

Workspace-scoped (run from `server/` or `client/`, or with `-w server` / `-w client`):

- `server`: `npm run start:dev` (watch mode), `npm run lint`, `npm run test` (unit specs), `npm run test:e2e`
- `client`: `npm run dev` (Vite), `npm run lint` (oxlint), `npm run build` (`tsc -b && vite build`)

Playwright tests (`tests/e2e/`) spin up their own server (port 3100) and client (port 5174) instances with an isolated SQLite file — do not confuse these with the dev ports (3000/5173).

## Architecture

### Server (`server/src/`)

Standard NestJS module-per-domain layout: `auth`, `users`, `residents`, `units`, `finance`, `bookings`, `announcements`, `maintenance`, each with a `dto/` subfolder. Shared cross-cutting code lives in `common/` (guards, decorators, filters). `prisma/` wraps the Prisma client as an injectable service.

- Auth: JWT via `@nestjs/passport` + `passport-jwt`; role checks via guards/decorators in `common/`.
- Enums (roles, charge/booking/maintenance status, priority) are **not** native Prisma enums (SQLite limitation) — they are string columns validated against union types defined in `src/common/enums.ts`. When adding a new status/role value, update the union type in `enums.ts` and any DTO validators, not the Prisma schema.
- Database: SQLite via Prisma (`server/prisma/schema.prisma`). After changing the schema, run `npm run prisma:migrate -w server` to create a migration — don't hand-edit the SQLite file or migrations folder.

### Client (`client/src/`)

- `api/` — HTTP client(s) (axios) calling the NestJS API
- `pages/<feature>/` — one folder per domain feature (dashboard, finance, bookings, announcements, maintenance, units, login)
- `components/`, `layout/`, `routes/`, `context/`, `types/` — shared UI, routing, auth context, shared TS types
- Data fetching goes through React Query; keep query keys colocated with the feature that owns them.

## Conventions

- TypeScript throughout; keep DTOs (`class-validator`) in sync with any request/response shape changes on the server.
- Server lint/format: ESLint + Prettier (`npm run lint -w server`). Client lint: oxlint (`npm run lint -w client`).
- Prefer editing existing modules/pages over introducing new top-level structure; follow the existing module-per-domain pattern for new features.

## Testing Expectations

Before considering backend changes done, run `npm run test:api` (or `npm run test -w server` for unit specs). For anything touching cross-cutting flows (auth, bookings conflict logic, finance calculations) or the UI, also run the Playwright suite (`npm run test:playwright`) — it exercises real login and page flows against a live server/client pair.
