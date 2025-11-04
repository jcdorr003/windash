import { db } from "~/server/db";
import { devices } from "~/server/db/schema";
import { eq } from "drizzle-orm";

// DELETE /api/devices/:deviceId - Unpair a device
export async function action({ request, params }: { request: Request; params: { deviceId: string } }) {
  if (request.method !== "DELETE") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { deviceId } = params;

  if (!deviceId) {
    return Response.json({ error: "Device ID required" }, { status: 400 });
  }

  try {
    // Delete device (cascades to metrics)
    const result = await db.delete(devices).where(eq(devices.id, deviceId)).returning();

    if (result.length === 0) {
      return Response.json({ error: "Device not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: `Device ${result[0].name} unpaired successfully`
    });
  } catch (error) {
    console.error("Error unpairing device:", error);
    return Response.json({ error: "Failed to unpair device" }, { status: 500 });
  }
}
