// Server Component: Memory Card (Static Structure)
interface MemoryCardProps {
  ramTotal: number;
}

export function MemoryCard({ ramTotal }: MemoryCardProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl hover:shadow-green-400/50 transition duration-300">
      <h2 className="text-2xl font-bold mb-4 text-green-400">Memory (RAM) Usage</h2>
      <div className="space-y-3">
        <p className="text-lg">Total RAM: <span className="font-semibold text-gray-300">{ramTotal} GB</span></p>
        <div className="bg-gray-700 rounded-full h-4">
          <div
            id="ram-bar"
            className="h-full bg-green-400 rounded-full transition-all duration-500"
            style={{ width: '0%' }}
          ></div>
        </div>
        <p className="text-right text-sm text-gray-400">
          Used: <span id="ram-used" className="font-semibold">0.00 GB</span> / Free: <span id="ram-free" className="font-semibold">{ramTotal.toFixed(2)} GB</span>
        </p>
      </div>
    </div>
  );
}
