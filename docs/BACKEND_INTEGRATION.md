# WinDash - Real-Time System Monitoring Backend Integration

## Architecture Overview

### Services
- **Web App**: React Router v7 with RSC (port 3000)
- **WebSocket Server**: Standalone Node.js server for agent connections (port 3001)
- **PostgreSQL**: Database for users, devices, and metrics (port 5432)

### Data Flow
1. Agent generates device code via `POST /api/device-codes`
2. Agent opens browser to `/pair?code=XXXX-XXXX`
3. User approves device, creating a bearer token
4. Agent polls `GET /api/device-token?code=XXXX` until approved
5. Agent connects to WebSocket at `ws://localhost:3001/agent?hostId={hostId}` with Bearer token
6. Agent sends metric batches every 2 seconds
7. Dashboard fetches devices and displays real-time metrics

## Development Setup

### Prerequisites
- Node.js 20+
- pnpm
- Docker & Docker Compose (for PostgreSQL)

### Installation

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start PostgreSQL:**
   ```bash
   docker compose up postgres -d
   ```

3. **Run database migrations:**
   ```bash
   pnpm db:push
   ```

4. **Start dev servers:**
   ```bash
   pnpm dev
   ```
   This runs both:
   - Web app on http://localhost:5173
   - WebSocket server on ws://localhost:3001

### Database Management

```bash
# Generate migration files
pnpm db:generate

# Push schema changes
pnpm db:push

# Open Drizzle Studio
pnpm db:studio
```

## API Endpoints

### POST /api/device-codes
Generate a new device pairing code.

**Response:**
```json
{
  "code": "ABCD-1234",
  "expiresAt": "2025-11-03T18:00:00Z"
}
```

### GET /api/device-token?code=XXXX-XXXX
Check device code status and get token when approved.

**Responses:**
- `404`: Code pending or not found
- `410`: Code expired
- `200`: Code approved
  ```json
  {
    "token": "base64url-encoded-token"
  }
  ```

### WebSocket: ws://localhost:3001/agent?hostId={hostId}
**Headers:**
- `Authorization: Bearer {token}`

**Message Format:**
```json
{
  "type": "metrics",
  "samples": [{
    "v": 1,
    "ts": "2025-11-03T17:22:53Z",
    "hostId": "abc123",
    "cpu": {"total": 45.2, "perCore": [50, 40, 45, 50]},
    "mem": {"used": 8589934592, "total": 17179869184},
    "disk": [{"name": "C:\\", "used": 107374182400, "total": 268435456000}],
    "net": {"txBps": 1048576, "rxBps": 2097152},
    "uptimeSec": 3600,
    "procCount": 250
  }]
}
```

## Production Deployment

### Building

```bash
pnpm build
```

### Docker Compose

```bash
docker compose up -d
```

This runs:
- PostgreSQL on port 5432
- Web app on port 3000
- WebSocket server on port 3001

### Environment Variables

```env
DATABASE_URL=postgres://windash:windash@postgres:5432/windash
NODE_ENV=production
PORT=3000
WS_PORT=3001
SESSION_SECRET=your-secure-random-string
```

## Project Structure

```
app/
  routes/
    api/
      device-codes.ts      # POST endpoint for code generation
      device-token.ts      # GET endpoint for token retrieval
    pair.tsx               # Pairing UI page
    dashboard.tsx          # Main dashboard
  server/
    db/
      schema.ts            # Drizzle schema definitions
      index.ts             # Database client
    services/
      device-service.ts    # Device pairing logic
      metrics-service.ts   # Metrics storage logic
    websocket/
      server.ts            # WebSocket server setup
    websocket-server.ts    # Standalone WS entry point
  components/
    dashboard/             # Dashboard components
```

## Database Schema

### users
- id, email, passwordHash, name, createdAt, updatedAt

### device_codes
- code (PK), userId (FK), status, createdAt, expiresAt

### devices
- id (PK), userId (FK), hostId, name, token, isOnline, lastSeenAt, createdAt, updatedAt

### metrics
- id (PK), deviceId (FK), timestamp, cpuTotal, cpuPerCore, memUsed, memTotal, disk, netTxBps, netRxBps, uptimeSec, procCount

## Next Steps

### TODO: Authentication
- [ ] Add user signup/login routes
- [ ] Implement session middleware
- [ ] Protect routes that require authentication
- [ ] Associate devices with authenticated users

### TODO: Dashboard Updates
- [ ] Fetch user's devices from database
- [ ] Display real-time metrics
- [ ] Add historical charts
- [ ] Show device connection status

### TODO: Agent Updates
- [ ] Replace mock API calls with real endpoints
- [ ] Use actual WebSocket URL from config
- [ ] Handle token refresh/expiration
