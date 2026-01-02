import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; liveSessionId: string } }
) {
  try {
    const user = await currentUser();
    const { isLive } = await req.json();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the course belongs to the teacher
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Update the live session
    const liveSession = await db.liveSession.update({
      where: {
        id: params.liveSessionId,
        courseId: params.courseId,
        teacherId: user.id,
      },
      data: {
        isLive,
        endedAt: isLive ? null : new Date(),
      }
    });

    return NextResponse.json(liveSession);
  } catch (error) {
    console.log("[LIVE_SESSION_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; liveSessionId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the course belongs to the teacher
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Delete the live session
    await db.liveSession.delete({
      where: {
        id: params.liveSessionId,
        courseId: params.courseId,
        teacherId: user.id,
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.log("[LIVE_SESSION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
