import { db } from '../db';
import { metrics } from '../db/schema';
import { eq, desc, lt } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// Metric sample from agent
export interface MetricSample {
  v: number;
  ts: string;
  hostId: string;
  cpu: {
    total: number;
    perCore: number[];
  };
  mem: {
    used: number;
    total: number;
  };
  disk: Array<{
    name: string;
    used: number;
    total: number;
  }>;
  net: {
    txBps: number;
    rxBps: number;
  };
  uptimeSec: number;
  procCount: number;
}

// Store metric samples in batch
export async function storeMetricsBatch(deviceId: string, samples: MetricSample[]) {
  const records = samples.map((sample) => ({
    id: randomBytes(16).toString('hex'),
    deviceId,
    timestamp: new Date(sample.ts),
    cpuTotal: sample.cpu.total,
    cpuPerCore: sample.cpu.perCore,
    memUsed: sample.mem.used,
    memTotal: sample.mem.total,
    disk: sample.disk,
    netTxBps: sample.net.txBps,
    netRxBps: sample.net.rxBps,
    uptimeSec: sample.uptimeSec,
    procCount: sample.procCount,
  }));

  await db.insert(metrics).values(records);
}

// Get latest metrics for a device
export async function getLatestMetrics(deviceId: string, limit: number = 100) {
  return db
    .select()
    .from(metrics)
    .where(eq(metrics.deviceId, deviceId))
    .orderBy(desc(metrics.timestamp))
    .limit(limit);
}

// Clean up old metrics (older than retention period)
export async function cleanOldMetrics(retentionDays: number = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  await db
    .delete(metrics)
    .where(lt(metrics.timestamp, cutoffDate));
}
