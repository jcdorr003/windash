"use client";

import { useState, useEffect } from "react";
import type { SystemMetrics, SystemInfo } from "~/types/metrics";
import { getCurrentMetrics } from "~/lib/metrics-api";

interface Device {
  id: string;
  hostId: string;
  name: string;
  isOnline: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
}

interface LiveMetricsProps {
  systemInfo: SystemInfo;
  devices: Device[];
}

/**
 * Client Component: Polls for live metrics and updates the DOM
 * This handles all the real-time updates and interactivity
 */
export function LiveMetrics({ systemInfo, devices }: LiveMetricsProps) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  // Auto-select first online device
  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      const onlineDevice = devices.find(d => d.isOnline);
      if (onlineDevice) {
        setSelectedDeviceId(onlineDevice.id);
      } else {
        // If no online devices, select first one
        setSelectedDeviceId(devices[0].id);
      }
    }
  }, [devices, selectedDeviceId]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const newMetrics = await getCurrentMetrics(systemInfo, selectedDeviceId || undefined);
        setMetrics(newMetrics);

        // Check if we're getting real data (timestamp should be recent)
        const isRecent = Date.now() - newMetrics.timestamp < 10000; // Within 10 seconds
        setIsLive(isRecent && selectedDeviceId !== null);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Poll every 2 seconds (agent sends every 2s)
    const interval = setInterval(fetchMetrics, 2000);

    return () => clearInterval(interval);
  }, [systemInfo, selectedDeviceId]);

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
      if (isLive) {
        statusDot.className = 'h-3 w-3 rounded-full mr-2 bg-green-500 animate-pulse';
        statusText.className = 'font-medium text-green-300';
        statusText.textContent = 'Live';
      } else {
        statusDot.className = 'h-3 w-3 rounded-full mr-2 bg-yellow-500';
        statusText.className = 'font-medium text-yellow-300';
        statusText.textContent = 'Simulated';
      }
    }
  }, [metrics, isLive]);

  // Render device selector if multiple devices
  if (devices.length > 1) {
    return (
      <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-indigo-500/30">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Device:
        </label>
        <select
          value={selectedDeviceId || ''}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none"
        >
          {devices.map(device => (
            <option key={device.id} value={device.id}>
              {device.name} {device.isOnline ? '🟢' : '⚫'}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return null;
}
