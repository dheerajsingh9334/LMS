import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; liveSessionId: string } }
) {
  try {
    const user = await currentUser();

    if (!user?.id || user.role !== "TEACHER") {
      return new NextResponse("Unauthorized - Teacher access required", { status: 401 });
    }

    const { courseId, liveSessionId } = params;

    // Get all students enrolled in this course
    const enrolledStudents = await db.purchase.findMany({
      where: {
        courseId,
      },
      select: {
        userId: true,
      }
    });

    // Get live session details
    const liveSession = await db.liveSession.findUnique({
      where: {
        id: liveSessionId,
      },
      include: {
        course: {
          select: {
            title: true,
          }
        }
      }
    });

    if (!liveSession) {
      return new NextResponse("Live session not found", { status: 404 });
    }

    // Create notifications for all enrolled students
    const notifications = enrolledStudents.map((student) => ({
      userId: student.userId,
      courseId,
      announcementId: liveSessionId, // Using liveSessionId as reference
      isRead: false,
      createdAt: new Date(),
    }));

    await db.notification.createMany({
      data: notifications,
    });

    return NextResponse.json({
      message: "Notifications sent to all enrolled students",
      notificationCount: notifications.length,
    });
  } catch (error) {
    console.log("[LIVE_SESSION_NOTIFY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
