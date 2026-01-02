import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Get live session for a specific course
export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { courseId } = params;

    // Find active live session for this course
    const liveSession = await db.liveSession.findFirst({
      where: {
        courseId,
        isLive: true,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        chatMessages: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        },
      },
    });

    return NextResponse.json(liveSession);
  } catch (error) {
    console.log("[LIVE_SESSION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Start live session for a course (Teacher only)
export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id || user.role !== "TEACHER") {
      return new NextResponse("Unauthorized - Teacher access required", { status: 401 });
    }

    const { courseId } = params;
    const { title, description } = await req.json();

    // Check if course exists and belongs to teacher
    const course = await db.course.findUnique({
      where: {
        id: courseId,
        userId: user.id,
      },
    });

    if (!course) {
      return new NextResponse("Course not found or unauthorized", { status: 404 });
    }

    // Check if there's already an active live session for this course
    const existingSession = await db.liveSession.findFirst({
      where: {
        courseId,
        isLive: true,
      },
    });

    if (existingSession) {
      return new NextResponse("A live session is already active for this course", {
        status: 400,
      });
    }

    // Generate unique stream key
    const streamKey = `live_${courseId}_${Date.now()}`;

    // Create live session
    const liveSession = await db.liveSession.create({
      data: {
        title: title || `Live Session - ${course.title}`,
        description: description || `Live session for ${course.title}`,
        courseId,
        teacherId: user.id,
        streamKey,
        isLive: true,
        startedAt: new Date(),
        viewCount: 0,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(liveSession);
  } catch (error) {
    console.log("[LIVE_SESSION_START]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// End live session (Teacher only)
export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id || user.role !== "TEACHER") {
      return new NextResponse("Unauthorized - Teacher access required", { status: 401 });
    }

    const { courseId } = params;

    // Find active session for this course by this teacher
    const liveSession = await db.liveSession.findFirst({
      where: {
        courseId,
        teacherId: user.id,
        isLive: true,
      },
    });

    if (!liveSession) {
      return new NextResponse("No active live session found", { status: 404 });
    }

    // End the session
    const updatedSession = await db.liveSession.update({
      where: {
        id: liveSession.id,
      },
      data: {
        isLive: false,
        endedAt: new Date(),
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.log("[LIVE_SESSION_END]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
