"use client";

import { useFetcher } from "react-router";
import { useEffect } from "react";

interface PairApprovalFormProps {
  code: string;
}

export function PairApprovalForm({ code }: PairApprovalFormProps) {
  const fetcher = useFetcher();
  const submitting = fetcher.state === "submitting" || fetcher.state === "loading";
  const success = (fetcher.data as any)?.success;
  const error = (fetcher.data as any)?.error;

  useEffect(() => {
    if (success) {
      // Optional focus management or analytics
      try { console.debug("[pair.client] success received", { code }); } catch { }
    }
  }, [success, code]);

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 text-green-400 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Device Paired!</h1>
        <p className="text-gray-300 mb-6">
          Your device has been successfully paired. You can now close this window and
          start monitoring your system metrics.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Go to Dashboard
        </a>
      </div>
    );
  }

  return (
    <fetcher.Form method="post" className="space-y-6">
      <input type="hidden" name="code" value={code} />
      <div>
        <label htmlFor="deviceName" className="block text-gray-400 text-sm font-medium mb-2">
          Device Name
        </label>
        <input
          type="text"
          id="deviceName"
          name="deviceName"
          placeholder="My PC"
          required
          disabled={submitting}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
      </div>
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition disabled:opacity-50"
      >
        {submitting ? "Approving..." : "Approve Device"}
      </button>
    </fetcher.Form>
  );
}
