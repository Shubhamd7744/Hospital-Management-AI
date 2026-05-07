# MedFlow HMS

A full-stack Hospital Management System for a single-location Indian hospital. Supports patient registration, OPD queue, IPD admissions, billing, mediclaim tracking, discharge summaries, and reporting.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/hms run dev` — run the React frontend (port auto-assigned)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Demo Credentials

| Role         | Username    | Password   |
|--------------|-------------|------------|
| Admin        | admin       | admin123   |
| Doctor       | drpatel     | doctor123  |
| Doctor       | drsharma    | doctor123  |
| Receptionist | reception1  | staff123   |
| Receptionist | reception2  | staff123   |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite, TailwindCSS v4, shadcn/ui, Recharts, Zustand, React Query
- API: Express 5 (port 8080, path `/api`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/hms/` — React + Vite frontend (all 11 modules)
- `artifacts/api-server/` — Express API server
- `lib/db/src/schema/` — Drizzle schema files (10 tables)
- `lib/api-spec/openapi.yaml` — OpenAPI 3.0 contract (source of truth)
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks (do not edit)
- `artifacts/hms/src/pages/` — All page components
- `artifacts/hms/src/hooks/use-auth.ts` — Zustand auth store (persisted)
- `artifacts/hms/src/main.tsx` — Wires auth token getter to API client

## Architecture decisions

- Contract-first: OpenAPI spec drives both server validation and client hooks via Orval codegen
- Simple token auth: Base64-encoded JSON `{userId, role, iat}`, verified on each request by decoding; no JWT library
- Password hashing: SHA256(password + "hms-salt-2024") — simple, no bcrypt dependency
- Auth token stored in localStorage via Zustand persist middleware; injected into every API call via `setAuthTokenGetter`
- Numeric DB values stored as Postgres `numeric` type; always coerced with `Number()` in API responses

## Product

11 modules for a single-location Indian hospital:
1. **Auth/Roles** — Login with role-based access (admin, doctor, receptionist)
2. **Patient Registration** — Unique patient IDs (HMS-XXXX), duplicate mobile detection
3. **Universal Search** — Search patients by name, mobile, or patient ID
4. **OPD Queue** — Daily token system, real-time status (waiting → in_consultation → completed)
5. **Consultations** — Doctor workspace with symptoms, diagnosis, prescription, follow-up
6. **IPD/Beds** — Bed grid by ward type, admission management, census tracking
7. **Mediclaim** — Insurance claim lifecycle (pending → submitted → approved/rejected)
8. **Billing** — Itemized bills (OPD/IPD), draft/final/paid workflow, print support
9. **Discharge Summary** — Clinical discharge with medications, procedures, condition at discharge
10. **Reports Dashboard** — OPD trend, revenue breakdown, bed occupancy charts
11. **Audit Logs** — All system events

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change
- Run `pnpm --filter @workspace/db run push` after any schema change
- The auth token getter reads from `localStorage["hms-auth"].state.token` — this is the Zustand persist format
- API routes are prefixed `/api` by the shared proxy; routes defined without the prefix inside Express

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
