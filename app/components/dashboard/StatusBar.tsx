// Server Component: Status Bar
import type { SystemInfo } from "~/types/metrics";

interface StatusBarProps {
  systemInfo: SystemInfo;
}

export function StatusBar({ }: StatusBarProps) {
  return (
    <div className="mb-8 p-4 bg-gray-800 rounded-xl shadow-lg flex items-center justify-between transition duration-300">
      <span className="font-medium text-lg">Agent Status:</span>
      <div className="flex items-center">
        <span className="h-3 w-3 rounded-full mr-2 bg-yellow-500 animate-pulse"></span>
        <span className="font-medium text-yellow-300">Initializing...</span>
      </div>
    </div>
  );
}
