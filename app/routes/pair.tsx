import type { Route } from "./+types/pair";
import { PairApprovalForm } from "~/components/pair/PairApprovalForm";
import { approveDeviceCode, ensureTempUser } from "~/server/services/device-service";
import { logDebug } from "~/server/utils/log";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const paired = url.searchParams.get("paired") === "1";

  logDebug("pair.loader", "loader start", { code, paired });

  if (!code) {
    return { error: "No device code provided" };
  }

  const data = { code, paired };
  logDebug("pair.loader", "loader return", data);
  return data;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const code = formData.get("code") as string;
  const deviceName = formData.get("deviceName") as string;

  logDebug("pair.action", "action received", { code, deviceName });

  if (!code || !deviceName) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const tempUserId = "temp-user-1"; // TODO replace with real session user
    await ensureTempUser(tempUserId);
    logDebug("pair.action", "temp user ensured", { tempUserId });
    const hostId = `host-${Date.now()}`;

    await approveDeviceCode(code, tempUserId, hostId, deviceName);
    logDebug("pair.action", "approved", { code, hostId });
    // Return JSON success; client fetcher or actionData will pick this up
    const response = { success: true };
    logDebug("pair.action", "return success", response);
    return Response.json(response);
  } catch (error) {
    logDebug("pair.action", "error", { message: (error as Error)?.message });
    return Response.json({ error: "Failed to approve device" }, { status: 500 });
  }
}

export function ServerComponent({ loaderData, actionData }: Route.ComponentProps) {
  const loaderError = (loaderData as any)?.error as string | undefined;
  const code = (loaderData as any)?.code as string | undefined;
  const paired = (loaderData as any)?.paired as boolean | undefined;
  const success = (actionData as any)?.success as boolean | undefined; // client fetcher manages independently

  const showSuccess = paired || success;
  logDebug("pair.render", "render state", { paired, success, showSuccess });

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

  if (showSuccess) {
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

        <PairApprovalForm code={code!} />

        <p className="mt-6 text-center text-gray-500 text-sm">
          Make sure this code matches the one shown in your WinDash Agent
        </p>
      </div>
    </div>
  );
}
