/**
 * Enhanced Notifications API (v2)
 *
 * GET  /api/notifications/v2 - Fetch notifications with filtering, pagination
 * POST /api/notifications/v2 - Mark notifications as read (batch)
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const category = searchParams.get("category");
    const unreadOnly = searchParams.get("unread") === "true";

    const where: any = {
      userId: user.id,
      isArchived: false,
    };

    if (category) {
      where.category = category;
    }

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.notificationV2.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notificationV2.count({ where }),
      db.notificationV2.count({
        where: { userId: user.id, isRead: false, isArchived: false },
      }),
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_V2_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, notificationIds } = body as {
      action: "mark_read" | "mark_all_read" | "archive" | "archive_all_read";
      notificationIds?: string[];
    };

    switch (action) {
      case "mark_read":
        if (notificationIds && notificationIds.length > 0) {
          await db.notificationV2.updateMany({
            where: {
              id: { in: notificationIds },
              userId: user.id,
            },
            data: { isRead: true, readAt: new Date() },
          });
        }
        break;

      case "mark_all_read":
        await db.notificationV2.updateMany({
          where: { userId: user.id, isRead: false },
          data: { isRead: true, readAt: new Date() },
        });
        break;

      case "archive":
        if (notificationIds && notificationIds.length > 0) {
          await db.notificationV2.updateMany({
            where: {
              id: { in: notificationIds },
              userId: user.id,
            },
            data: { isArchived: true },
          });
        }
        break;

      case "archive_all_read":
        await db.notificationV2.updateMany({
          where: { userId: user.id, isRead: true },
          data: { isArchived: true },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[NOTIFICATIONS_V2_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
