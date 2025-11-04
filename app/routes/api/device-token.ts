import type { Route } from "./+types/device-token";
import { checkDeviceCode } from "~/server/services/device-service";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return Response.json({ error: "Code parameter required" }, { status: 400 });
  }

  try {
    const result = await checkDeviceCode(code);

    switch (result.status) {
      case "not_found":
        return Response.json({ error: "Invalid code" }, { status: 404 });
      case "expired":
        return Response.json({ error: "Code expired" }, { status: 410 });
      case "pending":
        return Response.json({ status: "pending" }, { status: 404 }); // 404 for pending (agent polls)
      case "approved":
        return Response.json({
          token: result.token,
          hostId: result.hostId,
          deviceId: result.deviceId
        }, { status: 200 });
      default:
        return Response.json({ error: "Unknown status" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error checking device code:", error);
    return Response.json(
      { error: "Failed to check device code" },
      { status: 500 }
    );
  }
}
