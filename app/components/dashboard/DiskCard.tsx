// Server Component: Disk I/O Card (Static Structure)
export function DiskCard() {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl hover:shadow-orange-400/50 transition duration-300">
      <h2 className="text-2xl font-bold mb-4 text-orange-400">Disk I/O</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-lg">Read Speed:</span>
          <span id="disk-read" className="font-extrabold text-xl text-gray-300">0.0 MB/s</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-lg">Write Speed:</span>
          <span id="disk-write" className="font-extrabold text-xl text-gray-300">0.0 MB/s</span>
        </div>
        <p className="text-sm text-gray-400 mt-2">Drive C: Activity</p>
      </div>
    </div>
  );
}
