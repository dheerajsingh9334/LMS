import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    
    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is a teacher
    if (user.role !== "TEACHER") {
      return new NextResponse("Only teachers can create live sessions", { status: 403 });
    }

    const { title, description, courseId, chapterId } = await req.json();

    if (!title || !courseId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Generate unique stream key
    const streamKey = `live_${user.id}_${Date.now()}`;

    const liveSession = await db.liveSession.create({
      data: {
        title,
        description,
        courseId,
        chapterId,
        teacherId: user.id,
        streamKey,
        isLive: true,
        startedAt: new Date(),
      },
    });

    return NextResponse.json(liveSession);
  } catch (error) {
    console.log("[LIVE_SESSION_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const isLive = searchParams.get("isLive");

    const where: any = {};
    
    if (courseId) {
      where.courseId = courseId;
    }
    
    if (isLive === "true") {
      where.isLive = true;
    }

    const liveSessions = await db.liveSession.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(liveSessions);
  } catch (error) {
    console.log("[LIVE_SESSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
