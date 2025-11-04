import { ClientCounter } from "~/components/rsc/ClientCounter";

export async function ServerComponent() {
  // Server-only data (will change on full navigation, not client interaction)
  const serverTimestamp = new Date().toISOString();
  const pid = process.pid;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">RSC Health Check</h1>
        <p className="text-gray-400 text-sm">Validate React Server Components wiring & boundaries.</p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
            <h2 className="text-lg font-semibold mb-2">Server Component Block</h2>
            <ul className="space-y-1 text-sm text-gray-300">
              <li><span className="font-mono text-blue-400">serverTimestamp:</span> {serverTimestamp}</li>
              <li><span className="font-mono text-blue-400">process.pid:</span> {pid}</li>
              <li><span className="font-mono text-blue-400">env.NODE_ENV:</span> {process.env.NODE_ENV}</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">This section should NOT re-render when clicking the counter. It only changes on full page reload / navigation.</p>
          </div>
          <ClientCounter />
        </div>

        <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 space-y-2">
          <h3 className="text-gray-200 font-semibold">Manual Verification Steps</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open DevTools Network tab. Reload this page. You should see RSC/flight requests initiated by React Router.</li>
            <li>Click the counter. Only the counter updates; serverTimestamp stays fixed. Confirms boundary.</li>
            <li>View page source (Ctrl+U). Server-only values are in initial HTML; client code for counter loaded separately.</li>
            <li>Run <code className="bg-gray-700 px-1 py-0.5 rounded">pnpm build</code> and inspect <code className="bg-gray-700 px-1 py-0.5 rounded">build/client/assets</code> for a small JS chunk related to this route.</li>
            <li>In production, serverTimestamp changes between full navigations indicating server execution.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
