"use client";

import { useState, useEffect } from "react";
import type { SystemMetrics, SystemInfo } from "~/types/metrics";

interface LiveMetricsProps {
  systemInfo: SystemInfo;
}

/**
 * Client Component: Polls for live metrics and updates the DOM
 * This handles all the real-time updates and interactivity
 */
export function LiveMetrics({ systemInfo }: LiveMetricsProps) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    // Simulate fetching metrics every second
    const fetchMetrics = async () => {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/metrics');
      // const data = await response.json();

      const cpuBase = 10 + Math.random() * 20;
      const ramBaseGB = 6 + Math.random() * 4;

      const newMetrics: SystemMetrics = {
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

      setMetrics(newMetrics);
    };

    // Initial fetch
    fetchMetrics();

    // Poll every second
    const interval = setInterval(fetchMetrics, 1000);

    return () => clearInterval(interval);
  }, [systemInfo]);

  // Update DOM elements directly (imperative updates for performance)
  useEffect(() => {
    if (!metrics) return;

    // Update CPU gauge
    const cpuGauge = document.getElementById('cpu-gauge');
    const cpuPercent = document.getElementById('cpu-percent');
    if (cpuGauge && cpuPercent) {
      const offset = 100 - metrics.cpuUsage;
      cpuGauge.style.strokeDashoffset = offset.toString();
      cpuPercent.textContent = `${Math.round(metrics.cpuUsage)}%`;
    }

    // Update RAM bar
    const ramBar = document.getElementById('ram-bar');
    const ramUsed = document.getElementById('ram-used');
    const ramFree = document.getElementById('ram-free');
    if (ramBar && ramUsed && ramFree) {
      ramBar.style.width = `${metrics.ramPercent}%`;
      ramUsed.textContent = `${metrics.ramUsed.toFixed(2)} GB`;
      ramFree.textContent = `${(metrics.ramTotal - metrics.ramUsed).toFixed(2)} GB`;
    }

    // Update Disk I/O
    const diskRead = document.getElementById('disk-read');
    const diskWrite = document.getElementById('disk-write');
    if (diskRead && diskWrite) {
      diskRead.textContent = `${metrics.diskRead.toFixed(1)} MB/s`;
      diskWrite.textContent = `${metrics.diskWrite.toFixed(1)} MB/s`;
    }

    // Update status
    const statusDot = document.getElementById('connection-status-dot');
    const statusText = document.getElementById('connection-status-text');
    if (statusDot && statusText) {
      statusDot.className = 'h-3 w-3 rounded-full mr-2 bg-green-500';
      statusText.className = 'font-medium text-green-300';
      statusText.textContent = 'Live (Simulated)';
    }
  }, [metrics]);

  return (
    <>
      {/* This component doesn't render anything visible,
          it just manages the live updates */}
    </>
  );
}
