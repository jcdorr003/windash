// Server Component: CPU Metric Card (Static Structure)
interface CpuCardProps {
  cpuCores: number;
  cpuSpeed: number;
}

export function CpuCard({ cpuCores, cpuSpeed }: CpuCardProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl hover:shadow-indigo-400/50 transition duration-300">
      <h2 className="text-2xl font-bold mb-4 text-indigo-400">CPU Utilization</h2>
      <div className="flex items-center space-x-4">
        {/* Gauge will be updated by client component */}
        <div className="relative w-24 h-24">
          <svg className="w-full h-full" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            <circle className="text-gray-700" stroke="currentColor" strokeWidth="3" fill="none" cx="18" cy="18" r="16"></circle>
            <circle
              id="cpu-gauge"
              className="gauge-ring text-teal-400"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              cx="18"
              cy="18"
              r="16"
              strokeDasharray="100"
              style={{
                strokeDashoffset: 100,
                transition: 'stroke-dashoffset 0.5s ease-out',
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
              }}
            ></circle>
          </svg>
          <span id="cpu-percent" className="absolute inset-0 flex items-center justify-center text-xl font-extrabold">
            0%
          </span>
        </div>
        <div className="text-left">
          <p className="text-lg">Cores: <span className="font-semibold text-gray-300">{cpuCores}</span></p>
          <p className="text-lg">Speed: <span className="font-semibold text-gray-300">{cpuSpeed.toFixed(1)} GHz</span></p>
        </div>
      </div>
    </div>
  );
}
