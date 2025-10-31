// Shared types for the monitoring dashboard

export interface SystemMetrics {
  cpuUsage: number;
  ramUsed: number;
  ramPercent: number;
  diskRead: number;
  diskWrite: number;
  ramTotal: number;
  cpuCores: number;
  cpuSpeed: number;
  timestamp: number;
}

export interface SystemInfo {
  ramTotal: number;
  cpuCores: number;
  cpuSpeed: number;
}
