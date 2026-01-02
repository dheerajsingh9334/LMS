import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id ?? "";

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = await req.json();

    // Upsert video analytics
    const analytics = await db.videoAnalytics.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId: params.chapterId,
        },
      },
      update: {
        watchTime: values.watchTime || 0,
        totalTime: values.totalTime || 0,
        progress: values.progress || 0,
        completedVideo: values.completedVideo || false,
        replays: values.replays || 0,
        dropOffAt: values.dropOffAt || null,
        device: values.device || null,
        browser: values.browser || null,
        sessionDuration: values.sessionDuration || 0,
      },
      create: {
        userId,
        courseId: params.courseId,
        chapterId: params.chapterId,
        watchTime: values.watchTime || 0,
        totalTime: values.totalTime || 0,
        progress: values.progress || 0,
        completedVideo: values.completedVideo || false,
        replays: values.replays || 0,
        dropOffAt: values.dropOffAt || null,
        device: values.device || null,
        browser: values.browser || null,
        sessionDuration: values.sessionDuration || 0,
      },
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.log("[VIDEO_ANALYTICS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
