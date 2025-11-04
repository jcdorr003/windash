# WinDash Setup Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 22+ (for local development)
- pnpm (for local development)
- PostgreSQL 16 (if running locally without Docker)

## Quick Start

### Option 1: Full Docker Setup (Production-like)

```bash
# Build and start all services
docker compose up -d

# Check logs
docker compose logs -f

# Stop services
docker compose down
```

Access the application at `http://localhost:3000`

### Option 2: Local Development (Recommended)

```bash
# 1. Start PostgreSQL in Docker
docker compose -f docker-compose.dev.yml up -d postgres

# 2. Install dependencies
pnpm install

# 3. Push database schema
pnpm db:push

# 4. Start dev servers (React Router + WebSocket)
pnpm dev
```

Access the application at `http://localhost:5173` (Vite dev server)
WebSocket server runs at `ws://localhost:3001/agent`

### Option 3: Full Docker Dev Environment

```bash
# Start everything in Docker with hot reload
docker compose -f docker-compose.dev.yml up

# Stop
docker compose -f docker-compose.dev.yml down
```

## Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
DATABASE_URL=postgres://windash:windash@localhost:5432/windash
NODE_ENV=development
PORT=3000
WS_PORT=3001
SESSION_SECRET=your-secret-key-here
```

## Database Management

```bash
# Generate migration files from schema changes
pnpm db:generate

# Apply migrations (for production)
pnpm db:migrate

# Push schema directly (for development - faster)
pnpm db:push

# Open Drizzle Studio to view/edit data
pnpm db:studio
```

## Project Structure

```
windash/
├── app/
│   ├── routes/              # React Router routes
│   │   ├── dashboard.tsx    # Main dashboard
│   │   ├── pair.tsx         # Device pairing UI
│   │   └── api/             # API routes
│   ├── server/              # Backend code
│   │   ├── db/              # Database schema & connection
│   │   ├── services/        # Business logic
│   │   └── websocket/       # WebSocket server
│   ├── components/          # React components
│   └── lib/                 # Utilities
├── drizzle/                 # Database migrations
├── scripts/                 # Build & deployment scripts
├── Dockerfile               # Production image
├── Dockerfile.dev           # Development image
├── docker-compose.yml       # Production setup
└── docker-compose.dev.yml   # Development setup
```

## Device Pairing Flow

1. **Agent requests pairing code:**
   ```bash
   POST /api/device-codes
   Response: { "code": "ABCD-1234", "expiresAt": "..." }
   ```

2. **User approves device:**
   - Visit `/pair?code=ABCD-1234`
   - Enter device name
   - Click "Approve Device"

3. **Agent polls for token:**
   ```bash
   GET /api/device-token?code=ABCD-1234
   Response (when approved): { "token": "bearer-token-here" }
   ```

4. **Agent connects via WebSocket:**
   ```bash
   WS: ws://localhost:3001/agent?hostId=HOST-ID
   Authorization: Bearer <token>
   ```

5. **Agent sends metrics:**
   ```json
   {
     "type": "metrics",
     "samples": [
       {
         "v": 1,
         "ts": "2025-11-03T12:00:00Z",
         "hostId": "HOST-ID",
         "cpu": { "total": 45.2, "perCore": [50, 40, ...] },
         "mem": { "used": 8589934592, "total": 17179869184 },
         "disk": [{ "name": "C:", "used": 500000000000, "total": 1000000000000 }],
         "net": { "txBps": 1024000, "rxBps": 2048000 },
         "uptimeSec": 86400,
         "procCount": 150
       }
     ]
   }
   ```

## Troubleshooting

### Port conflicts
```bash
# Check what's using port 5432 (PostgreSQL)
lsof -i:5432

# Check what's using port 3000 (App)
lsof -i:3000

# Check what's using port 3001 (WebSocket)
lsof -i:3001
```

### Database connection issues
```bash
# Test PostgreSQL connection
docker exec -it windash-postgres psql -U windash -d windash

# View logs
docker logs windash-postgres
```

### Reset everything
```bash
# Stop all containers
docker compose down
docker compose -f docker-compose.dev.yml down

# Remove volumes (WARNING: deletes all data)
docker volume rm windash_postgres-data
docker volume rm windash_postgres-data-dev

# Kill any lingering processes
pkill -f "pnpm dev"
pkill -f "tsx watch"

# Restart
pnpm dev
```

## Building for Production

```bash
# Build Docker image
docker build -t windash:latest .

# Or use docker compose
docker compose build

# Start production stack
docker compose up -d
```

## TypeScript & Type Generation

```bash
# Generate React Router types
pnpm typecheck

# Types are auto-generated in .react-router/types/
```

## Notes

- This project uses **React Router v7 with React Server Components (RSC)** - this is experimental
- Server Components export `ServerComponent()` instead of default exports
- Type-safe routes via auto-generated `./+types/[route-name]` imports
- The WebSocket server runs independently from the React Router app
- Metrics are stored in PostgreSQL and can be queried for historical data
- Device pairing uses a secure token-based flow with time-limited codes
