import { ensureTempUser, getUserDevices } from "~/server/services/device-service";

export async function loader() {
  try {
    const tempUserId = "temp-user-1"; // TODO: Replace with real authenticated user id
    await ensureTempUser(tempUserId);
    const devices = await getUserDevices(tempUserId);

    return Response.json({ devices });
  } catch (error) {
    console.error("Error listing devices:", error);
    return Response.json({ error: "Failed to list devices" }, { status: 500 });
  }
}
