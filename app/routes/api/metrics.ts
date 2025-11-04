import { getLatestMetrics } from "~/server/services/metrics-service";

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const deviceId = url.searchParams.get("deviceId");
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 1; // Default to just latest

  if (!deviceId) {
    return Response.json({ error: "deviceId parameter required" }, { status: 400 });
  }

  try {
    const metrics = await getLatestMetrics(deviceId, limit);
    
    if (metrics.length === 0) {
      return Response.json({ 
        error: "No metrics found for this device",
        metrics: []
      }, { status: 404 });
    }

    // Transform DB format to API format
    const transformedMetrics = metrics.map(m => ({
      timestamp: m.timestamp.toISOString(),
      cpu: {
        total: m.cpuTotal,
        perCore: m.cpuPerCore as number[]
      },
      mem: {
        used: m.memUsed,
        total: m.memTotal,
        percent: (m.memUsed / m.memTotal) * 100
      },
      disk: m.disk as Array<{ name: string; used: number; total: number }>,
      net: {
        txBps: m.netTxBps,
        rxBps: m.netRxBps
      },
      uptimeSec: m.uptimeSec,
      procCount: m.procCount
    }));
    
    return Response.json({ 
      metrics: transformedMetrics,
      count: transformedMetrics.length 
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return Response.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
