/**
 * Notification Preferences API
 *
 * GET  /api/notifications/preferences - Get user preferences
 * PUT  /api/notifications/preferences - Update preferences
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotificationCategory } from "@/lib/events/types";

const DEFAULT_CATEGORY_PREFERENCES: Record<string, boolean> = {
  [NotificationCategory.COURSE]: true,
  [NotificationCategory.LIVE_SESSION]: true,
  [NotificationCategory.ASSIGNMENT]: true,
  [NotificationCategory.QUIZ]: true,
  [NotificationCategory.ANNOUNCEMENT]: true,
  [NotificationCategory.CERTIFICATE]: true,
  [NotificationCategory.PAYMENT]: true,
  [NotificationCategory.SYSTEM]: true,
  [NotificationCategory.DISCUSSION]: true,
  [NotificationCategory.GRADE]: true,
};

export async function GET() {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let prefs = await db.notificationPreference.findUnique({
      where: { userId: user.id },
    });

    if (!prefs) {
      // Return defaults
      return NextResponse.json({
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        categoryPreferences: DEFAULT_CATEGORY_PREFERENCES,
        quietHoursStart: null,
        quietHoursEnd: null,
        digestFrequency: "INSTANT",
      });
    }

    return NextResponse.json({
      ...prefs,
      categoryPreferences: prefs.categoryPreferences
        ? JSON.parse(prefs.categoryPreferences as string)
        : DEFAULT_CATEGORY_PREFERENCES,
    });
  } catch (error) {
    console.error("[NOTIFICATION_PREFS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      emailEnabled,
      pushEnabled,
      inAppEnabled,
      categoryPreferences,
      quietHoursStart,
      quietHoursEnd,
      digestFrequency,
    } = body;

    const data: any = {};

    if (emailEnabled !== undefined) data.emailEnabled = emailEnabled;
    if (pushEnabled !== undefined) data.pushEnabled = pushEnabled;
    if (inAppEnabled !== undefined) data.inAppEnabled = inAppEnabled;
    if (categoryPreferences !== undefined) {
      data.categoryPreferences = JSON.stringify(categoryPreferences);
    }
    if (quietHoursStart !== undefined) data.quietHoursStart = quietHoursStart;
    if (quietHoursEnd !== undefined) data.quietHoursEnd = quietHoursEnd;
    if (digestFrequency !== undefined) data.digestFrequency = digestFrequency;

    const prefs = await db.notificationPreference.upsert({
      where: { userId: user.id },
      update: data,
      create: {
        userId: user.id,
        ...data,
      },
    });

    return NextResponse.json({
      ...prefs,
      categoryPreferences: prefs.categoryPreferences
        ? JSON.parse(prefs.categoryPreferences as string)
        : DEFAULT_CATEGORY_PREFERENCES,
    });
  } catch (error) {
    console.error("[NOTIFICATION_PREFS_PUT]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
