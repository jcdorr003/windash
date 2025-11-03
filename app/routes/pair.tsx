import type { Route } from "./+types/pair";
import { Form } from "react-router";
import { approveDeviceCode } from "~/server/services/device-service";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return { error: "No device code provided" };
  }

  return { code };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const code = formData.get("code") as string;
  const deviceName = formData.get("deviceName") as string;

  if (!code || !deviceName) {
    return { error: "Missing required fields" };
  }

  try {
    // TODO: Get userId from session when auth is implemented
    // For now, use a temporary user ID
    const tempUserId = "temp-user-1";

    // Generate a temporary hostId (will be replaced by agent's actual hostId)
    const hostId = `host-${Date.now()}`;

    await approveDeviceCode(code, tempUserId, hostId, deviceName);

    return { success: true };
  } catch (error) {
    console.error("Error approving device:", error);
    return { error: "Failed to approve device" };
  }
}

export function ServerComponent({ loaderData, actionData }: Route.ComponentProps) {
  const { code, error: loaderError } = loaderData || {};
  const { success, error: actionError } = actionData || {};

  if (loaderError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-300">{loaderError}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <div className="mb-6">
            <svg
              className="w-16 h-16 text-green-400 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
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
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Pair Your Device
        </h1>

        <div className="mb-8">
          <label className="block text-gray-400 text-sm font-medium mb-2">
            Device Code
          </label>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <p className="text-4xl font-mono font-bold text-blue-400 tracking-widest">
              {code}
            </p>
          </div>
        </div>

        <Form method="post" className="space-y-6">
          <input type="hidden" name="code" value={code} />

          <div>
            <label
              htmlFor="deviceName"
              className="block text-gray-400 text-sm font-medium mb-2"
            >
              Device Name
            </label>
            <input
              type="text"
              id="deviceName"
              name="deviceName"
              placeholder="My PC"
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {actionError && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              {actionError}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition"
          >
            Approve Device
          </button>
        </Form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Make sure this code matches the one shown in your WinDash Agent
        </p>
      </div>
    </div>
  );
}
