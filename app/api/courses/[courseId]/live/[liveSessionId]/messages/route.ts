import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { courseId: string; liveSessionId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const messages = await db.liveChatMessage.findMany({
      where: {
        liveSessionId: params.liveSessionId,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      },
      take: 100,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.log("[LIVE_MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; liveSessionId: string } }
) {
  try {
    const user = await currentUser();
    const { message, isFromTeacher } = await req.json();

    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!message) {
      return new NextResponse("Message is required", { status: 400 });
    }

    // Verify live session exists and is active
    const liveSession = await db.liveSession.findUnique({
      where: {
        id: params.liveSessionId,
        courseId: params.courseId,
        isLive: true,
      }
    });

    if (!liveSession) {
      return new NextResponse("Live session not found or inactive", { status: 404 });
    }

    // Check if user is teacher for this course
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
      }
    });

    const isTeacher = course?.userId === user.id;

    // Create chat message
    const chatMessage = await db.liveChatMessage.create({
      data: {
        liveSessionId: params.liveSessionId,
        userId: user.id,
        message,
        isFromTeacher: isFromTeacher || isTeacher,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          }
        }
      }
    });

    return NextResponse.json(chatMessage);
  } catch (error) {
    console.log("[LIVE_MESSAGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
