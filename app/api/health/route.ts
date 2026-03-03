/**
 * Health & Monitoring API
 *
 * GET /api/health - System health check with event-driven architecture status
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sseManager } from "@/lib/events/sse-manager";
import { eventBus } from "@/lib/events/event-bus";
import { emailQueue } from "@/lib/events/email-service";
import { cache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "ok";

  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  const hasAuthUrl = Boolean(process.env.NEXTAUTH_URL);
  const hasAuthSecret = Boolean(process.env.NEXTAUTH_SECRET);
  const hasResendKey = Boolean(process.env.RESEND_API_KEY);

  try {
    // Quick DB connectivity check
    await db.$runCommandRaw({ ping: 1 });
  } catch {
    dbStatus = "error";
  }

  const memUsage = process.memoryUsage();

  return NextResponse.json({
    ok: dbStatus === "ok",
    status: dbStatus === "ok" ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTimeMs: Date.now() - startTime,

    env: {
      DATABASE_URL: hasDbUrl,
      NEXTAUTH_URL: hasAuthUrl,
      NEXTAUTH_SECRET: hasAuthSecret,
      RESEND_API_KEY: hasResendKey,
    },

    services: {
      database: { status: dbStatus },
      sse: {
        status: "ok",
        connectedUsers: sseManager.getConnectedUserCount(),
        totalConnections: sseManager.getTotalConnectionCount(),
      },
      eventBus: {
        status: "ok",
        registeredEvents: eventBus.getRegisteredEvents().length,
        recentEvents: eventBus.getHistory(5).map((e) => ({
          event: e.eventName,
          time: e.timestamp,
          handlers: e.handlerCount,
        })),
      },
      emailQueue: {
        status: "ok",
        pending: emailQueue.pending,
      },
      cache: {
        status: "ok",
        ...cache.stats(),
      },
    },

    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      },
    },
  });
}
