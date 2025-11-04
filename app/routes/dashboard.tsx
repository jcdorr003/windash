import type { Route } from "./+types/dashboard";
import { getSystemInfo } from "~/lib/metrics-api";
import { ensureTempUser, getUserDevices } from "~/server/services/device-service";
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
  const systemInfo = await getSystemInfo();

  // Fetch user's devices
  const tempUserId = "temp-user-1"; // TODO: Replace with real session user
  await ensureTempUser(tempUserId);
  const devices = await getUserDevices(tempUserId);

  return (
    <div className="bg-gray-900 text-gray-100 p-4 sm:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header - Server Component (static) */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-indigo-400 mb-2">
            Windows Performance Monitor
          </h1>
          <p className="text-gray-400">
            Real-Time Metrics Visualization
          </p>
        </header>

        {/* Device count info */}
        {devices.length > 0 && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-green-500/30">
            <p className="text-green-400">
              📡 {devices.length} device{devices.length !== 1 ? 's' : ''} paired
              {devices.filter(d => d.isOnline).length > 0 && (
                <span className="ml-2 text-green-300">
                  ({devices.filter(d => d.isOnline).length} online)
                </span>
              )}
            </p>
          </div>
        )}

        {devices.length === 0 && (
          <div className="mb-6 p-6 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
            <h3 className="text-xl font-bold text-yellow-400 mb-2">
              No Devices Paired
            </h3>
            <p className="text-gray-300 mb-4">
              To start monitoring your Windows PC, pair the WinDash agent:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-300 ml-4">
              <li>Run the WinDash agent on your Windows PC</li>
              <li>The agent will display a pairing code</li>
              <li>Visit the pairing URL shown by the agent to approve</li>
              <li>Once paired, metrics will appear here automatically</li>
            </ol>
          </div>
        )}

        {/* Status Bar - Server Component (static structure) */}
        <StatusBar systemInfo={systemInfo} />

        {/* Live Metrics - Client Component (handles real-time updates) */}
        <LiveMetrics systemInfo={systemInfo} devices={devices} />

        {/* Metric Cards Grid - Server Components (static structure) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <CpuCard cpuCores={systemInfo.cpuCores} cpuSpeed={systemInfo.cpuSpeed} />
          <MemoryCard ramTotal={systemInfo.ramTotal} />
          <DiskCard />
        </div>

        {/* Real-Time Charts - Client Component (D3 visualization) */}
        <RealTimeCharts systemInfo={systemInfo} />
      </div>
    </div>
  );
}
