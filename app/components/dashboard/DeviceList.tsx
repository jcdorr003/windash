"use client";

import { useState } from "react";

interface Device {
  id: string;
  hostId: string;
  name: string;
  isOnline: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
}

interface DeviceListProps {
  devices: Device[];
}

export function DeviceList({ devices: initialDevices }: DeviceListProps) {
  const [devices, setDevices] = useState(initialDevices);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(deviceId: string) {
    if (!window.confirm("Are you sure you want to unpair this device?")) return;
    setDeletingId(deviceId);
    setError(null);
    try {
      const res = await fetch(`/api/devices/${deviceId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete device");

      // Remove device from local state immediately for instant UI update
      setDevices(prev => prev.filter(d => d.id !== deviceId));

      // Reload the page after a short delay to refresh all server components
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  if (devices.length === 0) return null;

  return (
    <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-red-500/30">
      <h2 className="text-xl font-bold text-red-400 mb-4">Device Management</h2>
      {error && <div className="mb-2 text-red-400">{error}</div>}
      <ul className="divide-y divide-gray-700">
        {devices.map(device => (
          <li key={device.id} className="py-3 flex items-center justify-between">
            <div>
              <span className={`font-semibold ${device.isOnline ? 'text-green-400' : 'text-gray-400'}`}>{device.name}</span>
              <span className="ml-2 text-xs text-gray-500">({device.hostId})</span>
              {device.isOnline ? (
                <span className="ml-2 px-2 py-0.5 rounded bg-green-700 text-green-200 text-xs">Online</span>
              ) : (
                <span className="ml-2 px-2 py-0.5 rounded bg-gray-700 text-gray-300 text-xs">Offline</span>
              )}
            </div>
            <button
              className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-50"
              disabled={deletingId === device.id}
              onClick={() => handleDelete(device.id)}
            >
              {deletingId === device.id ? "Deleting..." : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
