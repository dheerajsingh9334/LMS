import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { eventBus, EventName } from "@/lib/events";
import "@/lib/events/init";

export async function PATCH(
  req: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { isLive } = await req.json();

    const liveSession = await db.liveSession.findUnique({
      where: {
        id: params.sessionId,
      },
    });

    if (!liveSession) {
      return new NextResponse("Live session not found", { status: 404 });
    }

    if (liveSession.teacherId !== user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const updatedSession = await db.liveSession.update({
      where: {
        id: params.sessionId,
      },
      data: {
        isLive,
        endedAt: !isLive ? new Date() : null,
      },
    });

    // Emit session ended event when going offline
    if (!isLive && liveSession.startedAt) {
      const duration = Math.round(
        (Date.now() - new Date(liveSession.startedAt).getTime()) / 60000,
      );
      eventBus.emit(EventName.LIVE_SESSION_ENDED, {
        sessionId: params.sessionId,
        sessionTitle: liveSession.title,
        courseId: liveSession.courseId,
        duration,
        viewCount: liveSession.viewCount,
        timestamp: new Date(),
        triggeredBy: user.id!,
      });
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.log("[LIVE_SESSION_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const user = await currentUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const liveSession = await db.liveSession.findUnique({
      where: {
        id: params.sessionId,
      },
    });

    if (!liveSession) {
      return new NextResponse("Live session not found", { status: 404 });
    }

    if (liveSession.teacherId !== user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    await db.liveSession.delete({
      where: {
        id: params.sessionId,
      },
    });

    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    console.log("[LIVE_SESSION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
