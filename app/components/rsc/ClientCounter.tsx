"use client";

import { useState } from "react";

export function ClientCounter() {
  const [count, setCount] = useState(0);
  return (
    <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
      <p className="text-sm text-gray-400 mb-2">Client Component Counter</p>
      <p className="text-2xl font-semibold mb-4">{count}</p>
      <button
        onClick={() => setCount((c) => c + 1)}
        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
      >
        Increment
      </button>
    </div>
  );
}
