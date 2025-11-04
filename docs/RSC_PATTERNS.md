# RSC Quick Reference for This Dashboard

## Component Decision Tree

```
Need React hooks (useState, useEffect)?
├─ YES → Client Component ("use client")
└─ NO
   ├─ Need browser APIs (window, document)?
   │  └─ YES → Client Component
   └─ NO
      ├─ Handles user interactions (onClick, onChange)?
      │  └─ YES → Client Component
      └─ NO → Server Component (default)
```

## Pattern Examples from Dashboard

### Pattern 1: Server Component Route
**When**: Initial page load, data fetching
**Example**: `app/routes/dashboard.tsx`

```tsx
export async function ServerComponent() {
  // Fetch data on server
  const data = await getSystemInfo();
  
  // Render structure + pass to client components
  return (
    <Layout>
      <ServerCard data={data} />
      <ClientMetrics systemInfo={data} />
    </Layout>
  );
}
```

### Pattern 2: Static Server Component
**When**: Display-only, no interactivity
**Example**: `app/components/dashboard/CpuCard.tsx`

```tsx
// No "use client" directive = Server Component
export function CpuCard({ cpuCores, cpuSpeed }: Props) {
  return (
    <div className="card">
      <h2>CPU</h2>
      <p>Cores: {cpuCores}</p>
      {/* Static structure, updated by client component */}
      <div id="cpu-gauge"></div>
    </div>
  );
}
```

### Pattern 3: Interactive Client Component
**When**: Polling, real-time updates, hooks
**Example**: `app/components/dashboard/LiveMetrics.tsx`

```tsx
"use client"; // Required!

import { useState, useEffect } from "react";

export function LiveMetrics({ systemInfo }: Props) {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await fetchMetrics();
      setMetrics(data);
      // Update DOM directly
      document.getElementById('cpu-gauge').textContent = data.cpu;
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return null; // Or minimal UI
}
```

### Pattern 4: D3 Visualization Client Component
**When**: Complex browser-based rendering
**Example**: `app/components/dashboard/RealTimeCharts.tsx`

```tsx
"use client";

import { useRef, useEffect } from "react";

export function Chart({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    // D3 manipulation
    d3.select(svgRef.current)
      .append("circle")
      .attr("r", 50);
  }, [data]);
  
  return <svg ref={svgRef}></svg>;
}
```

## Composition Rules

### ✅ Allowed
```tsx
// Server → Server
<ServerLayout>
  <ServerCard />
</ServerLayout>

// Server → Client
<ServerLayout>
  <ClientMetrics />
</ServerLayout>

// Client → Client
<ClientWrapper>
  <ClientChart />
</ClientWrapper>
```

### ❌ Not Allowed
```tsx
// Client → Server (Can't import Server Component in Client)
"use client";
import { ServerCard } from "./ServerCard"; // Error!

export function ClientWrapper() {
  return <ServerCard />; // Won't work
}
```

### ✅ Workaround: Children Prop
```tsx
// Server Component
export function Dashboard() {
  return (
    <ClientWrapper>
      {/* Server Component passed as children */}
      <ServerCard />
    </ClientWrapper>
  );
}

// Client Component
"use client";
export function ClientWrapper({ children }) {
  return <div className="wrapper">{children}</div>;
}
```

## Common Mistakes

### ❌ Wrong: Everything as Client Component
```tsx
"use client"; // Unnecessary!

export function SimpleCard({ title }: Props) {
  return <div><h2>{title}</h2></div>; // No hooks or interactions
}
```

### ✅ Right: Keep as Server Component
```tsx
// No directive needed
export function SimpleCard({ title }: Props) {
  return <div><h2>{title}</h2></div>;
}
```

### ❌ Wrong: Server Component with Hooks
```tsx
// No "use client" directive
export function MetricsDisplay() {
  const [data, setData] = useState(null); // Error! Can't use hooks
  return <div>{data}</div>;
}
```

### ✅ Right: Add Client Directive
```tsx
"use client";

export function MetricsDisplay() {
  const [data, setData] = useState(null);
  return <div>{data}</div>;
}
```

## Data Fetching Patterns

### Server Component (Recommended)
```tsx
export async function ServerComponent() {
  // Direct fetch on server
  const data = await db.query('SELECT * FROM metrics');
  return <Display data={data} />;
}
```

### Client Component (For Real-Time)
```tsx
"use client";

export function LiveData() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/metrics');
      setData(await response.json());
    };
    
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return <Display data={data} />;
}
```

## Performance Tips

1. **Default to Server Components**: Less JavaScript shipped
2. **Client Components for Interactivity Only**: Don't over-use `"use client"`
3. **Pass Data Down**: Server → Client component props
4. **Imperative DOM Updates**: For high-frequency updates (see `LiveMetrics.tsx`)
5. **Memoize Callbacks**: Use `useCallback` in Client Components with D3

## TypeScript Patterns

### Route Types
```tsx
import type { Route } from "./+types/dashboard";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard" }];
}

export async function ServerComponent({ params }: Route.ComponentProps) {
  // Type-safe params
}
```

### Shared Types
```tsx
// app/types/metrics.ts
export interface SystemMetrics {
  cpuUsage: number;
  ramUsed: number;
}

// Use in components
import type { SystemMetrics } from "~/types/metrics";
```

## Dashboard-Specific Patterns

### Imperative DOM Updates (Performance)
```tsx
// Instead of re-rendering entire component
useEffect(() => {
  if (!metrics) return;
  
  // Direct DOM manipulation for real-time updates
  const gauge = document.getElementById('cpu-gauge');
  gauge.style.strokeDashoffset = `${100 - metrics.cpuUsage}`;
}, [metrics]);
```

### D3 with React Refs
```tsx
const svgRef = useRef<SVGSVGElement>(null);

useEffect(() => {
  if (!svgRef.current) return;
  
  const svg = d3.select(svgRef.current);
  svg.append("path").attr("d", line(data));
}, [data]);

return <svg ref={svgRef}></svg>;
```

## When to Break the Rules

1. **Large Static Lists**: Might be faster as Client Component with virtualization
2. **Third-Party Libraries**: If they require `useEffect`, must be Client Component
3. **Form Validation**: Complex forms might benefit from Client Component
4. **Real-Time Everything**: If entire page updates constantly, reconsider architecture

---

**Remember**: The goal is **progressive enhancement**. Server Components provide instant HTML, Client Components add interactivity where needed.
