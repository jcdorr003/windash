# Windows Performance Monitor Dashboard

A real-time system monitoring dashboard built with React Router v7 + React Server Components.

## Architecture Overview

This dashboard demonstrates **React Server Components (RSC)** best practices by splitting the application into server and client components based on their responsibilities.

### Server Components (Static Structure)

These components render once on the server and provide the initial HTML structure:

- **`app/routes/dashboard.tsx`** - Main route with `ServerComponent` that fetches system info
- **`app/components/dashboard/StatusBar.tsx`** - Status indicator structure
- **`app/components/dashboard/CpuCard.tsx`** - CPU metrics card layout
- **`app/components/dashboard/MemoryCard.tsx`** - Memory metrics card layout
- **`app/components/dashboard/DiskCard.tsx`** - Disk I/O card layout

**Benefits:**
- These components don't ship JavaScript to the browser
- SEO-friendly and fast initial page load
- Server can access backend APIs directly (databases, config files, etc.)

### Client Components (Interactive)

These components handle real-time updates and user interactions:

- **`app/components/dashboard/LiveMetrics.tsx`** - Polls for metrics and updates DOM
- **`app/components/dashboard/RealTimeCharts.tsx`** - D3 charts with live data visualization

**Benefits:**
- Only interactive parts ship JavaScript
- Can use React hooks (`useState`, `useEffect`)
- Handle browser APIs and real-time updates

## Data Flow

```
Server Component (Dashboard Route)
    ↓
Fetch system info on server (CPU cores, RAM total, etc.)
    ↓
Render static HTML structure
    ↓
Pass data as props to Client Components
    ↓
Client Components hydrate and start polling
    ↓
Real-time updates (metrics + charts)
```

## Key RSC Patterns Used

### 1. Server-Side Data Fetching
```tsx
// app/routes/dashboard.tsx
export async function ServerComponent() {
  // Runs on server - can access databases, APIs, file system
  const systemInfo = await getSystemInfo();
  
  return <Dashboard systemInfo={systemInfo} />;
}
```

### 2. Server Component → Client Component
```tsx
// Server Component renders static structure
<div className="metric-card">
  <h2>CPU</h2>
  {/* Client Component handles live updates */}
  <LiveMetrics systemInfo={systemInfo} />
</div>
```

### 3. Minimal Client-Side JavaScript
- Only `LiveMetrics` and `RealTimeCharts` are client components
- Static cards, headers, and layout are server components
- Results in smaller bundle size and faster load times

## Current Implementation

**Status:** Using simulated data

The dashboard currently generates random metrics to demonstrate functionality. To connect to your Windows PC:

### Integration Steps

1. **Create Backend API** on your Windows PC:
   ```typescript
   // Example Node.js endpoint
   app.get('/api/system-info', (req, res) => {
     res.json({
       ramTotal: os.totalmem() / (1024**3),
       cpuCores: os.cpus().length,
       cpuSpeed: os.cpus()[0].speed / 1000,
     });
   });
   
   app.get('/api/metrics', (req, res) => {
     res.json({
       cpuUsage: getCurrentCpuUsage(),
       ramUsed: (os.totalmem() - os.freemem()) / (1024**3),
       diskRead: getDiskReadSpeed(),
       diskWrite: getDiskWriteSpeed(),
       timestamp: Date.now(),
     });
   });
   ```

2. **Update API Layer**:
   Edit `app/lib/metrics-api.ts` to replace simulated calls with real API calls:
   ```typescript
   export async function getSystemInfo(): Promise<SystemInfo> {
     const response = await fetch('http://your-windows-pc:3000/api/system-info');
     return response.json();
   }
   ```

3. **Update Client Component**:
   Edit `app/components/dashboard/LiveMetrics.tsx` to fetch from your API:
   ```typescript
   const response = await fetch('http://your-windows-pc:3000/api/metrics');
   const metrics = await response.json();
   ```

## Running the Dashboard

```bash
# Development
pnpm dev

# Production build
pnpm build
pnpm start
```

Visit `http://localhost:5173/dashboard`

## Technologies

- **React Router v7** with RSC support
- **React 19** with Server Components
- **D3.js v7** for data visualization
- **TailwindCSS v4** for styling
- **TypeScript** for type safety

## File Structure

```
app/
├── routes/
│   └── dashboard.tsx          # Main route (Server Component)
├── components/dashboard/
│   ├── StatusBar.tsx          # Server Component
│   ├── CpuCard.tsx            # Server Component
│   ├── MemoryCard.tsx         # Server Component
│   ├── DiskCard.tsx           # Server Component
│   ├── LiveMetrics.tsx        # Client Component
│   └── RealTimeCharts.tsx     # Client Component
├── lib/
│   └── metrics-api.ts         # API layer
└── types/
    ├── metrics.ts             # Shared types
    └── d3.d.ts                # D3 type declarations
```

## Why RSC for This Dashboard?

1. **Static Structure on Server**: Metric cards, headers, and layout don't need client-side JavaScript
2. **Selective Hydration**: Only chart and live update components hydrate on client
3. **Better Performance**: Smaller JavaScript bundle (only interactive parts ship to browser)
4. **Direct Backend Access**: Server Components can fetch from databases/APIs without exposing credentials
5. **Future-Ready**: Prepares for streaming, suspense, and partial rendering features

## Next Steps

- [ ] Connect to real Windows PC backend API
- [ ] Add authentication for remote monitoring
- [ ] Implement data streaming with Server-Sent Events
- [ ] Add historical data charts (24-hour view)
- [ ] Create alerts/notifications for threshold breaches
