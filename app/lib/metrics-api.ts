// API layer for fetching metrics
// In production, this would call your Windows PC backend API

import type { SystemMetrics, SystemInfo } from "~/types/metrics";

/**
 * Simulates fetching system information (static data).
 * In production: Call your backend API endpoint
 */
export async function getSystemInfo(): Promise<SystemInfo> {
  // TODO: Replace with actual API call
  // const response = await fetch('http://your-windows-pc:3000/api/system-info');
  // return response.json();

  return {
    ramTotal: 16,
    cpuCores: 8,
    cpuSpeed: 4.2,
  };
}

/**
 * Simulates fetching current system metrics.
 * In production: Call your backend API endpoint
 */
export async function getCurrentMetrics(systemInfo: SystemInfo): Promise<SystemMetrics> {
  // TODO: Replace with actual API call
  // const response = await fetch('http://your-windows-pc:3000/api/metrics');
  // return response.json();

  // Simulated data
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
