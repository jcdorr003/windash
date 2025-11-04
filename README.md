# Windash – Real-Time System & Device Metrics Dashboard

> ⚠️ **Experimental**: Uses React Router v7 + React Server Components (RSC). APIs may change; not production-stable yet.

Windash is a full‑stack monitoring dashboard with a device pairing flow, WebSocket batch metrics ingestion, PostgreSQL persistence (Drizzle ORM), and a dark, responsive UI with D3 visualizations. Ships minimal client JavaScript by default using RSC boundaries.

## 🏁 Quick Overview
| Concern | Implementation |
|---------|----------------|
| UI Rendering | React Router v7 RSC + Vite (`ServerComponent` exports) |
| Real‑Time Ingest | Standalone WebSocket server (port 3001) |
| Persistence | PostgreSQL + Drizzle (`users`, `device_codes`, `devices`, `metrics`) |
| Metrics Storage | Wide table + JSONB arrays (per‑core CPU, disk list) |
| Auth (current) | Temporary placeholder user `temp-user-1` |
| Styling | TailwindCSS v4 (config‑less) |
| Charts | D3 imperative updates (client components) |

## ✨ Key Features
- Device pairing: short‑lived codes → approval → bearer token issuance.
- Batch metrics ingestion via WebSocket (`type:"metrics"`, `samples[]`).
- RSC architecture: static layout server components + minimal interactive client components.
- Imperative high‑frequency DOM updates (avoid large React re-renders) in `LiveMetrics`.
- Drizzle migrations + studio workflow for schema evolution.
- Simulated metrics fallback until real agents are connected.

## 🧱 Architecture
```
 Agent ──(POST /api/device-codes)──▶ Code
 Browser User ──(pair UI)──▶ Approve → Device + Token
 Agent ──(poll /api/device-token)──▶ Token
 Agent ──(WebSocket ws://:3001/agent?hostId=H • Bearer token)──▶ Metrics Batches
 Server ──▶ storeMetricsBatch() ─▶ PostgreSQL (metrics)
 Dashboard (RSC) ──▶ initial layout + client charts → future real data
```
Core boundaries:
- Routes: request/response orchestration only.
- Services (`app/server/services/*`): pairing, token validation, metrics persistence.
- WebSocket handler: connection auth + message dispatch; never direct DB logic outside services.

## 📂 Structure (Essentials)
```
app/
  routes/                # RSC route files (export ServerComponent)
    dashboard.tsx        # Main dashboard (server component + client children)
    pair.tsx             # Device pairing UI & approval action
    api/                 # HTTP endpoints for pairing flow
      device-codes.ts    # POST generate code
      device-token.ts    # GET poll for token
  server/
    websocket-server.ts  # HTTP + WS bootstrap (port 3001)
    websocket/server.ts  # WebSocket logic (auth + metrics message)
    services/            # device-service.ts / metrics-service.ts
    db/schema.ts         # Drizzle table definitions
  components/dashboard/  # Server + client split components
  lib/metrics-api.ts     # Simulated metrics fetchers (replace for real data)
```

## 🔐 Device Pairing Flow
1. Agent: `POST /api/device-codes` → `{ code, expiresAt }` (5‑minute TTL).
2. User: open `/pair?code=XXXX-XXXX` → submit name → `approveDeviceCode()` creates device + token.
3. Agent: poll `GET /api/device-token?code=XXXX-XXXX`:
   - 404: pending/not_found
   - 410: expired
   - 200: `{ token }`
4. Agent: WebSocket connect `ws://host:3001/agent?hostId=<stableHostId>` with `Authorization: Bearer <token>`.
5. Metrics: send `{ type:"metrics", samples: MetricSample[] }` batches → stored → device marked online.
Polling cadence: keep ~2–3s; do not hammer. Respect expiry.

## 📡 Metrics Sample Shape
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
Extend metrics safely:
1. Update interface in `metrics-service.ts`.
2. Add column/JSON field in `db/schema.ts`.
3. Modify mapping inside `storeMetricsBatch()`.
4. Run `pnpm db:generate` and apply (`db:push` dev / `db:migrate` prod).

## 🔧 Development Scripts
```bash
pnpm dev          # App + WebSocket (ports 5173 + 3001)
pnpm typecheck    # React Router typegen + tsc
pnpm db:push      # Fast dev schema sync
pnpm db:generate  # Generate migration from schema changes
pnpm db:migrate   # Apply structured migrations (prod)
pnpm db:studio    # Drizzle Studio UI
pnpm build && pnpm start  # Production (HTTP 3000 + WS 3001 via script)
```
Docker dev helpers:
```bash
pnpm dev:stack        # Start Postgres + dev app
pnpm dev:stack:wipe   # Recreate DB volume
pnpm clean:dev        # Stop containers
```

## 🧪 RSC Patterns (Summary)
- Default: server component (no hooks, no browser APIs).
- Add `"use client"` only for hooks / D3 / real‑time updates (`LiveMetrics.tsx`, `RealTimeCharts.tsx`).
- Compose Server → Client; never import Server component inside Client directly—wrap via children.
- Minimize client boundaries for smaller bundles.

## � Performance Notes
- High‑frequency metric rendering uses direct DOM mutation (avoid React state churn).
- Batch insert metrics (`storeMetricsBatch`) rather than per-sample writes.
- Avoid heavy work in `meta()`; fetch in `ServerComponent()` only.

## 🛡️ Gaps / Future Work
- Real authentication & sessions (currently temp user).
- Metrics retention job (use `cleanOldMetrics()` externally scheduled).
- Frontend consumption of real DB/WebSocket data (currently simulated API).
- Validation & rate limiting (consider Zod + basic throttling).
- Token rotation / expiry policies.

## ❓ FAQ
**Why a separate WebSocket server?** Isolation of long‑lived connections; independent scaling.
**Can I add new message types?** Extend switch in `websocket/server.ts`; validate payload before calling services.
**Where do I put business logic?** Always inside `services/`; routes & WS layer should be thin.
**How to add a field to metrics?** Follow 4‑step extension process above; regen migrations.

## 📦 Resources
- React Router v7 Docs: https://reactrouter.com/
- Drizzle ORM: https://orm.drizzle.team/
- Tailwind v4: https://tailwindcss.com/
- D3.js: https://d3js.org/

## 📄 License
MIT – see `LICENSE`.

---
Built with ❤️ using experimental React Router v7 RSC.