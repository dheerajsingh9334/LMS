import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { sessionId: string } }
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

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.log("[LIVE_SESSION_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { sessionId: string } }
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
