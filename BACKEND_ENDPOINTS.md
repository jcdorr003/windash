# Backend API Endpoints - Implementation Summary

## ✅ Implemented Endpoints

### 1. POST /api/device-codes
**Purpose:** Generate a pairing code for device registration

**Request:**
```bash
curl -X POST http://192.168.1.57:3004/api/device-codes
```

**Response (201):**
```json
{
  "code": "ABCD-1234",
  "expiresAt": "2025-11-04T00:00:00.000Z"
}
```

**Details:**
- Code format: XXXX-XXXX (8 alphanumeric chars with hyphen)
- Valid for 5 minutes
- Stored in database with `pending` status

---

### 2. GET /api/device-token?code=<code>
**Purpose:** Poll for approval status and retrieve device token

**Request:**
```bash
curl "http://192.168.1.57:3004/api/device-token?code=ABCD-1234"
```

**Responses:**

**404 - Pending (still waiting for user approval):**
```json
{
  "status": "pending"
}
```

**404 - Invalid code:**
```json
{
  "error": "Invalid code"
}
```

**410 - Code expired (after 5 minutes):**
```json
{
  "error": "Code expired"
}
```

**200 - Approved (success):**
```json
{
  "token": "base64url-secure-token",
  "hostId": "host-1730679123456",
  "deviceId": "abc123def456..."
}
```

**Details:**
- Agent should poll every 2-3 seconds
- Returns 404 while pending (to distinguish from invalid codes)
- Returns 410 when expired (distinct from 404)
- Returns deviceId and hostId along with token for agent use

---

### 3. GET /api/devices
**Purpose:** List all paired devices for the current user

**Request:**
```bash
curl http://192.168.1.57:3004/api/devices
```

**Response (200):**
```json
{
  "devices": [
    {
      "id": "abc123...",
      "hostId": "host-1730679123456",
      "name": "My Windows PC",
      "isOnline": true,
      "lastSeenAt": "2025-11-03T23:00:00.000Z",
      "createdAt": "2025-11-03T22:00:00.000Z"
    }
  ]
}
```

---

### 4. WebSocket: ws://192.168.1.57:3005/agent
**Purpose:** Real-time metrics streaming from agent to server

**Connection:**
```
URL: ws://192.168.1.57:3005/agent?hostId=<hostId>
Headers:
  Authorization: Bearer <token>
```

**Connection Flow:**
1. Agent connects with `?hostId=<hostId>` query parameter
2. Must include `Authorization: Bearer <token>` header
3. Server validates token before accepting connection
4. Server sends acknowledgment: `{"type": "connected", "deviceId": "..."}`
5. Device status updated to `isOnline: true`

**Agent → Server Messages:**

**Metrics batch:**
```json
{
  "type": "metrics",
  "samples": [
    {
      "v": 1,
      "ts": "2025-11-03T22:42:11.857Z",
      "hostId": "026fd8c4...",
      "cpu": {
        "total": 10.9,
        "perCore": [8.5, 12.3, 10.1, 12.8]
      },
      "mem": {
        "used": 21363961856,
        "total": 34359738368
      },
      "disk": [
        {
          "name": "C:",
          "used": 123456789,
          "total": 500000000
        }
      ],
      "net": {
        "txBps": 1024,
        "rxBps": 2048
      },
      "uptimeSec": 86400,
      "procCount": 150
    }
  ]
}
```

**Application-level ping (optional):**
```json
{
  "type": "ping"
}
```

**Server → Agent Messages:**

**Connection acknowledgment:**
```json
{
  "type": "connected",
  "deviceId": "abc123..."
}
```

**Pong response:**
```json
{
  "type": "pong",
  "ts": "2025-11-03T22:42:15.000Z"
}
```

**Rate control (future use):**
```json
{
  "type": "setRate",
  "intervalMs": 5000
}
```

---

## WebSocket Features Implemented

✅ **Token Authentication**
- Validates `Authorization: Bearer <token>` header
- Rejects invalid tokens with close code 1008

✅ **Ping/Pong Keepalive**
- Automatically responds to WebSocket-level pings
- Handles application-level ping messages

✅ **Compression (permessage-deflate)**
- Enabled with optimized settings for metrics data
- Threshold: 1KB (compresses messages larger than 1KB)
- Level: 3 (balanced compression/speed)

✅ **Graceful Disconnection**
- Updates device status to offline on disconnect
- Removes connection from active connections map
- Logs disconnect events

✅ **Error Handling**
- Catches and logs message processing errors
- Closes connection with appropriate codes on auth failures
- Handles invalid JSON gracefully

---

## Database Schema

**device_codes table:**
- `code` - VARCHAR (XXXX-XXXX format)
- `userId` - VARCHAR (nullable until approved)
- `status` - ENUM ('pending', 'approved', 'expired')
- `expiresAt` - TIMESTAMP

**devices table:**
- `id` - VARCHAR (hex UUID)
- `userId` - VARCHAR (foreign key)
- `hostId` - VARCHAR (stable host identifier)
- `name` - VARCHAR (user-provided device name)
- `token` - VARCHAR (secure bearer token)
- `isOnline` - BOOLEAN
- `lastSeenAt` - TIMESTAMP
- `createdAt` - TIMESTAMP
- `updatedAt` - TIMESTAMP

**metrics table:**
- `id` - VARCHAR (hex UUID)
- `deviceId` - VARCHAR (foreign key)
- `timestamp` - TIMESTAMP
- `cpuTotal` - FLOAT
- `cpuPerCore` - JSONB (array of floats)
- `memUsed` - BIGINT
- `memTotal` - BIGINT
- `disk` - JSONB (array of {name, used, total})
- `netTxBps` - BIGINT
- `netRxBps` - BIGINT
- `uptimeSec` - BIGINT
- `procCount` - INTEGER

---

## Testing Your Agent

### 1. Request a pairing code:
```bash
curl -X POST http://192.168.1.57:3004/api/device-codes
```

### 2. Approve the code:
- Open browser: `http://192.168.1.57:3004/pair?code=<CODE>`
- Enter device name and click "Approve"

### 3. Poll for token:
```bash
curl "http://192.168.1.57:3004/api/device-token?code=<CODE>"
```

### 4. Connect WebSocket:
```bash
# Using wscat (install: npm install -g wscat)
wscat -c "ws://192.168.1.57:3005/agent?hostId=test-host" \
  -H "Authorization: Bearer <TOKEN>"
```

### 5. Send metrics:
```json
{"type":"metrics","samples":[{"v":1,"ts":"2025-11-03T23:00:00.000Z","hostId":"test-host","cpu":{"total":10.5,"perCore":[10,11]},"mem":{"used":8000000000,"total":16000000000},"disk":[{"name":"C:","used":100000000000,"total":500000000000}],"net":{"txBps":1024,"rxBps":2048},"uptimeSec":3600,"procCount":100}]}
```

---

## Cloudflare Tunnel Configuration

**WebSocket Support:**
Cloudflare Tunnel automatically supports WebSocket connections. No special configuration needed beyond:

1. Ensure tunnel is routing to your backend (port 3000 for app, port 3001 for WebSocket server)
2. WebSocket server runs on separate port (3001) or same port with path routing (`/agent`)
3. Cloudflare will detect `Upgrade: websocket` header and proxy accordingly

**Recommended tunnel config:**
```yaml
tunnel: <tunnel-id>
credentials-file: /path/to/credentials.json

ingress:
  - hostname: windash.jcdorr3.dev
    service: http://localhost:3000
  - service: http_status:404
```

Since your WebSocket server is on the same HTTP server (path `/agent`), the single service entry handles both HTTP and WebSocket traffic.

---

## Deployment Checklist

- [x] Device pairing API (`/api/device-codes`, `/api/device-token`)
- [x] Device listing API (`/api/devices`)
- [x] WebSocket server with token auth
- [x] Ping/pong keepalive
- [x] Compression (permessage-deflate)
- [x] Metrics storage in database
- [x] Device online/offline status tracking
- [ ] Rate limiting (recommend adding to prevent abuse)
- [ ] Metrics retention policy (cleanup old data)
- [ ] Real user authentication (currently using temp-user-1)

---

## Expected Agent Behavior

1. **Startup:**
   - POST to `/api/device-codes`
   - Display code to user
   - Begin polling `/api/device-token?code=...` every 2-3 seconds

2. **On Approval (HTTP 200):**
   - Extract `token`, `hostId`, `deviceId` from response
   - Connect WebSocket with token in Authorization header
   - Wait for `{"type": "connected"}` acknowledgment

3. **During Connection:**
   - Send metrics batches every 5 seconds (or configured interval)
   - Send WebSocket pings every 10 seconds
   - Handle `{"type": "setRate"}` messages (future feature)

4. **On Disconnect:**
   - Attempt reconnection with exponential backoff
   - Reuse existing token (don't request new code)
   - If token invalid, start pairing flow again

---

## Common Issues & Solutions

**404 on WebSocket connection:**
- Verify path is `/agent` (not `/ws` or other)
- Check Authorization header format: `Bearer <token>`
- Ensure hostId query parameter is present

**Token validation failure:**
- Token may be expired or invalid
- Request new device code and re-pair
- Check database for device record with matching token

**Metrics not storing:**
- Check WebSocket server logs for errors
- Verify message format matches MetricSample interface
- Ensure device exists in database before sending metrics

**Cloudflare Tunnel issues:**
- Verify tunnel is running: `cloudflared tunnel info`
- Check tunnel logs for connection errors
- Ensure DNS points to tunnel ID

---

## Next Steps

1. **Test with your Go agent** - it should now connect successfully
2. **Monitor logs** - check for connection attempts and metric storage
3. **Add rate limiting** - protect API endpoints from abuse
4. **Implement metrics retention** - clean up old data periodically
5. **Add real authentication** - replace temp-user-1 with proper auth

The backend is ready to accept connections from your WinDash agent! 🚀
