// API layer for fetching metrics

import type { SystemMetrics, SystemInfo } from "~/types/metrics";

// Base URL for API calls (configurable via environment)
const API_BASE = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'http://localhost:3000';

/**
 * Fetches system information (static data).
 * In the future, this could come from device metadata.
 */
export async function getSystemInfo(): Promise<SystemInfo> {
  // TODO: Fetch from device metadata when available
  // For now, return defaults (will be overridden by real metrics)
  return {
    ramTotal: 16,
    cpuCores: 8,
    cpuSpeed: 4.2,
  };
}

/**
 * Fetches current system metrics from backend API.
 * @param deviceId - The ID of the device to fetch metrics for
 */
export async function getCurrentMetrics(systemInfo: SystemInfo, deviceId?: string): Promise<SystemMetrics> {
  if (!deviceId) {
    // Return simulated data if no device selected
    return getSimulatedMetrics(systemInfo);
  }

  try {
    const response = await fetch(`${API_BASE}/api/metrics?deviceId=${deviceId}&limit=1`);
    
    if (!response.ok) {
      console.warn('Failed to fetch real metrics, falling back to simulated');
      return getSimulatedMetrics(systemInfo);
    }

    const data = await response.json();
    
    if (!data.metrics || data.metrics.length === 0) {
      console.warn('No metrics available, falling back to simulated');
      return getSimulatedMetrics(systemInfo);
    }

    const latest = data.metrics[0];
    
    // Transform API response to SystemMetrics format
    return {
      cpuUsage: latest.cpu.total,
      ramUsed: latest.mem.used / (1024 * 1024 * 1024), // Convert bytes to GB
      ramPercent: latest.mem.percent,
      ramTotal: latest.mem.total / (1024 * 1024 * 1024), // Convert bytes to GB
      diskRead: latest.net.rxBps / (1024 * 1024), // Convert to MB/s
      diskWrite: latest.net.txBps / (1024 * 1024), // Convert to MB/s
      cpuCores: latest.cpu.perCore.length,
      cpuSpeed: systemInfo.cpuSpeed, // Not available in metrics, use default
      timestamp: new Date(latest.timestamp).getTime(),
    };
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return getSimulatedMetrics(systemInfo);
  }
}

/**
 * Generates simulated metrics for testing/fallback
 */
function getSimulatedMetrics(systemInfo: SystemInfo): SystemMetrics {
  const cpuBase = 10 + Math.random() * 20;
  const ramBaseGB = 6 + Math.random() * 4;

  return {
    cpuUsage: Math.min(100, cpuBase + Math.random() * 15),
    ramUsed: ramBaseGB,
    ramPercent: (ramBaseGB / systemInfo.ramTotal) * 100,
    diskRead: Math.random() * 10 + Math.random() * 50 * (Math.random() > 0.9 ? 1 : 0),
    diskWrite: Math.random() * 5 + Math.random() * 30 * (Math.random() > 0.95 ? 1 : 0),
    ramTotal: systemInfo.ramTotal,
    cpuCores: systemInfo.cpuCores,
    cpuSpeed: systemInfo.cpuSpeed,
    timestamp: Date.now(),
  };
}
