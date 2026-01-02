import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Increment view count when student joins - Only purchased students can join
export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = params;

    // Check if user has purchased the course
    const purchase = await db.purchase.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!purchase) {
      return new NextResponse("You must purchase this course to join live sessions", { status: 403 });
    }

    // Find active live session with optimized query
    const liveSession = await db.liveSession.findFirst({
      where: {
        courseId,
        isLive: true,
      },
      select: {
        id: true,
        title: true,
        streamUrl: true,
        viewCount: true,
      },
    });

    if (!liveSession) {
      return new NextResponse("No active live session", { status: 404 });
    }

    // Increment view count
    const updatedSession = await db.liveSession.update({
      where: {
        id: liveSession.id,
      },
      data: {
        viewCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        title: true,
        streamUrl: true,
        viewCount: true,
        isLive: true,
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.log("[LIVE_SESSION_JOIN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
