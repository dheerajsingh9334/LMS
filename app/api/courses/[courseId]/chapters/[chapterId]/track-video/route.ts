import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const user = await currentUser();
    const userId = user?.id;
    const { watchTime, completed, dropOffPoint } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify user has purchased the course
    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: params.courseId,
        },
      },
    });

    if (!purchase) {
      return new NextResponse("Not enrolled", { status: 403 });
    }

    // Get chapter to find video URL
    const chapter = await db.chapter.findUnique({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      },
      select: {
        videoUrl: true,
      },
    });

    if (!chapter || !chapter.videoUrl) {
      return new NextResponse("Chapter not found", { status: 404 });
    }

    // Update or create video analytics
    const analytics = await db.videoAnalytics.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId: params.chapterId,
        },
      },
      update: {
        watchTime: {
          increment: watchTime,
        },
        completedVideo: completed ? true : undefined,
        lastWatchedAt: new Date(),
        dropOffAt: dropOffPoint || undefined,
        sessionDuration: {
          increment: watchTime,
        },
      },
      create: {
        userId,
        courseId: params.courseId,
        chapterId: params.chapterId,
        watchTime,
        completedVideo: completed,
        lastWatchedAt: new Date(),
        dropOffAt: dropOffPoint,
      },
    });

    // Update course analytics
    await db.courseAnalytics.upsert({
      where: {
        courseId: params.courseId,
      },
      update: {
        totalWatchTime: {
          increment: watchTime,
        },
      },
      create: {
        courseId: params.courseId,
        totalWatchTime: watchTime,
      },
    });

    // Update daily analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.dailyAnalytics.upsert({
      where: {
        courseId_date: {
          date: today,
          courseId: params.courseId,
        },
      },
      update: {
        watchTime: {
          increment: watchTime,
        },
        videosWatched: {
          increment: completed ? 1 : 0,
        },
      },
      create: {
        date: today,
        courseId: params.courseId,
        watchTime,
        videosWatched: completed ? 1 : 0,
      },
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("[VIDEO_TRACKING_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
