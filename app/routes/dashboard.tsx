import type { Route } from "./+types/dashboard";
import { getSystemInfo } from "~/lib/metrics-api";
import { StatusBar } from "~/components/dashboard/StatusBar";
import { CpuCard } from "~/components/dashboard/CpuCard";
import { MemoryCard } from "~/components/dashboard/MemoryCard";
import { DiskCard } from "~/components/dashboard/DiskCard";
import { LiveMetrics } from "~/components/dashboard/LiveMetrics";
import { RealTimeCharts } from "~/components/dashboard/RealTimeCharts";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Windows Performance Monitor" },
    { name: "description", content: "Real-time system metrics visualization" },
  ];
}

/**
 * Server Component: Dashboard Route
 * 
 * This demonstrates RSC best practices:
 * - Fetches initial system info on the server (could be from a database or config)
 * - Renders the static structure server-side
 * - Passes data to client components for real-time updates
 * - Minimal JavaScript sent to the browser (only interactive parts)
 */
export async function ServerComponent() {
  // Fetch system information on the server
  // In production, this could come from your backend API or database
  const systemInfo = await getSystemInfo();

  return (
    <div className="bg-gray-900 text-gray-100 p-4 sm:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header - Server Component (static) */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-400 mb-2">
            Windows Performance Monitor
          </h1>
          <p className="text-gray-400">
            Real-Time Metrics Visualization (React + D3)
          </p>
        </header>

        {/* Status Bar - Server Component (static structure) */}
        <StatusBar systemInfo={systemInfo} />

        {/* Live Metrics - Client Component (handles real-time updates) */}
        <LiveMetrics systemInfo={systemInfo} />

        {/* Metric Cards Grid - Server Components (static structure) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <CpuCard cpuCores={systemInfo.cpuCores} cpuSpeed={systemInfo.cpuSpeed} />
          <MemoryCard ramTotal={systemInfo.ramTotal} />
          <DiskCard />
        </div>

        {/* Real-Time Charts - Client Component (D3 visualization) */}
        <RealTimeCharts systemInfo={systemInfo} />

        {/* Instructions for connecting real backend */}
        <div className="mt-8 p-6 bg-gray-800 rounded-xl border border-yellow-500/30">
          <h3 className="text-xl font-bold text-yellow-400 mb-3">
            🔧 Integration Notes
          </h3>
          <div className="text-gray-300 space-y-2 text-sm">
            <p>
              <strong>Currently using simulated data.</strong> To connect to your Windows PC:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>
                Create a backend API on your Windows PC (Node.js, Python, etc.) that
                exposes endpoints for system metrics
              </li>
              <li>
                Update <code className="bg-gray-700 px-2 py-1 rounded">app/lib/metrics-api.ts</code> to
                call your real API endpoints
              </li>
              <li>
                The client components in{" "}
                <code className="bg-gray-700 px-2 py-1 rounded">
                  app/components/dashboard/
                </code>{" "}
                will automatically use the real data
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
