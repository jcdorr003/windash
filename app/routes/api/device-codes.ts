import type { Route } from "./+types/device-codes";
import { createDeviceCode } from "~/server/services/device-service";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // TODO: Get userId from session when auth is implemented
    // For now, create code without userId (will be set during approval)
    const result = await createDeviceCode();

    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating device code:", error);
    return Response.json(
      { error: "Failed to create device code" },
      { status: 500 }
    );
  }
}
