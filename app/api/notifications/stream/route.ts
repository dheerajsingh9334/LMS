/**
 * SSE (Server-Sent Events) Endpoint for Real-Time Notifications
 *
 * GET /api/notifications/stream
 *
 * Clients connect to this endpoint and receive real-time notifications
 * pushed by the SSE manager. This replaces polling for notification updates.
 */

import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { sseManager } from "@/lib/events";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await currentUser();

  if (!user || !user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clientId = uuidv4();

  const stream = new ReadableStream({
    start(controller) {
      // Register this client with the SSE manager
      sseManager.addClient({
        id: clientId,
        userId: user.id!,
        controller,
        lastHeartbeat: Date.now(),
      });

      // Send initial connection confirmation
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "connected", clientId })}\n\n`,
        ),
      );
    },
    cancel() {
      // Clean up when client disconnects
      sseManager.removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
