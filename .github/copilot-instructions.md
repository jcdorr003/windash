# Windash AI Coding Instructions

Concise, project-specific guidance for AI agents contributing to Windash (React Router v7 + React Server Components, Drizzle + PostgreSQL, WebSocket metrics ingestion). Focus on these patterns and conventions.

## Architecture Essentials
- Dual runtime: React Router v7 RSC app (HTTP, port 3000 prod / 5173 dev) + standalone WebSocket server (`app/server/websocket-server.ts`, port 3001) for agent metric ingestion.
- Persistence via Drizzle ORM (`app/server/db/schema.ts`) – tables: `users`, `device_codes`, `devices`, `metrics`. Metrics stored in wide rows with JSONB for arrays (cpuPerCore, disk) – prefer batch inserts (`storeMetricsBatch`).
- Business logic isolated in services (`app/server/services/*`). Never duplicate pairing/metrics logic inside routes or WebSocket handlers; call service functions.

## React Server Components (RSC) Pattern
- Routes export `ServerComponent()` (e.g. `app/routes/dashboard.tsx`). Default to Server Components; only add `"use client"` when needing hooks, browser APIs, real-time updates (see `LiveMetrics.tsx`, `RealTimeCharts.tsx`).
- Composition rule: Server -> Client is OK; Client -> Server import is NOT. If you need to wrap a Server component with client behavior, pass it as `children`.
- Keep real-time, high-frequency DOM mutations imperative inside client components instead of triggering large React re-renders (pattern in `LiveMetrics.tsx`).

## Adding/Modifying Routes
- Place new route in `app/routes/`. Import its generated types via `import type { Route } from "./+types/<name>"` after running `pnpm typecheck` (which triggers `react-router typegen`).
- Use `meta()` for SEO; avoid heavy work inside meta. Use async data fetch inside `ServerComponent()` only.

## Client vs Server Components Examples
- Server card example: `CpuCard.tsx` – pure presentational, no hooks; do NOT add `"use client"` unless interactivity is introduced.
- Client example: `RealTimeCharts.tsx` – D3 + `useEffect` for SVG mutations.

## Device Pairing Flow (Do Not Diverge)
1. Agent: `POST /api/device-codes` (`device-codes.ts` → `createDeviceCode`). Returns `{ code, expiresAt }`.
2. User: visits `/pair?code=XXXX-XXXX` (UI in `pair.tsx`). Approval calls action which: ensures temp user (`ensureTempUser`), `approveDeviceCode` → creates device + token.
3. Agent: polls `GET /api/device-token?code=XXXX-XXXX` until 200. HTTP statuses: 404 pending/not_found, 410 expired, 200 approved.
4. WebSocket connect: `ws://host:3001/agent?hostId=<stableHostId>` with `Authorization: Bearer <token>`.
5. Metrics push: JSON `{ type: "metrics", samples: MetricSample[] }` → stored via `storeMetricsBatch` → device marked online (`updateDeviceStatus`).
- Respect 5‑minute expiry on codes; if introducing retries/backoff, keep 2–3s poll interval.

## WebSocket Conventions
- Entry: `setupWebSocketServer` at `app/server/websocket/server.ts`. Any new message type: extend switch pattern INSIDE message handler; reuse validation & status updates.
- Track connections in `connections` Map keyed by `deviceId`; prefer helper (`sendToDevice`) for outbound messages.
- Always validate tokens with `validateDeviceToken` before accepting connection; do NOT bypass.

## Database & Drizzle Guidelines
- Schema extensions go in `schema.ts`; generate migration with `pnpm db:generate` then apply with `pnpm db:migrate` (prod) or `pnpm db:push` (dev). Avoid manual SQL files unless advanced.
- Use `eq`, `desc`, etc. from Drizzle for queries; prefer service-layer functions for reuse.
- For high-volume metrics cleanup, use `cleanOldMetrics(retentionDays)`; schedule externally (cron/k8s) – do not embed timers in WebSocket handler.

## Metrics Data Shape (Reference)
```ts
interface MetricSample {
  v: number; ts: string; hostId: string;
  cpu: { total: number; perCore: number[] };
  mem: { used: number; total: number };
  disk: { name: string; used: number; total: number }[];
  net: { txBps: number; rxBps: number };
  uptimeSec: number; procCount: number;
}
```
- When adding fields: 1) Update `MetricSample` in `metrics-service.ts`, 2) Extend table in `schema.ts`, 3) Adjust insertion mapping in `storeMetricsBatch`, 4) Regenerate migrations.

## Development Workflows (Use Exact Scripts)
- Start dev (app + WS): `pnpm dev` (uses `concurrently`).
- Type generation + TS check: `pnpm typecheck`.
- DB ops: `pnpm db:push` (fast dev), `pnpm db:migrate` (structured), `pnpm db:studio` (explore). Avoid writing raw queries inline.
- Production build: `pnpm build` then `pnpm start` (script orchestrates app & WS via `scripts/start-production.js`).
- Docker dev stack: `pnpm dev:stack` (or `--rebuild`, `--wipe`). Clean with `pnpm clean:dev`.

## Coding Conventions
- Logging: use `logDebug(tag, message, data)` from `app/server/utils/log.ts` – don’t `console.log` in services except during error fallback.
- Tokens: generated with `generateBearerToken()`; never expose in logs beyond debug during dev; if adding rotation, centralize in device-service.
- Temporary auth: all logic uses `temp-user-1`. If adding real auth, replace calls to `ensureTempUser` and propagate `userId` through pairing & device scope.

## Performance & RSC Discipline
- Minimize client boundaries; prefer passing static data from ServerComponents rather than fetching again on client.
- For high-frequency metric updates, mutate targeted DOM nodes (pattern in `LiveMetrics`) instead of full React state cascades.
- Keep D3 operations isolated in `useEffect`; don’t mix heavy calculations inside render.

## Safe Extension Checklist
When adding a feature: 1) Decide server vs client component early. 2) Add service function if business logic interacts with DB. 3) Update types in one place. 4) Run `pnpm typecheck` before commit. 5) Prefer incremental migrations (`db:generate`) for schema changes.

## Gaps / TODO Awareness (Don’t invent solutions silently)
- No real auth/session yet; flag changes depending on future auth.
- No retention scheduler; if adding, implement external job or separate worker process.
- Frontend still uses simulated metrics (`metrics-api.ts`); mark clearly when switching to real API.

---
If any section is unclear or you need deeper examples (e.g., adding a new metric field, or integrating real agent data into dashboard UI), request clarification before proceeding.
