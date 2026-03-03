import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { eventBus, EventName } from "@/lib/events";
import "@/lib/events/init";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } },
) {
  try {
    const user = await currentUser();
    let userId = user?.id ?? "";
    const { content } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Create the announcement
    const newAnnouncement = await db.announcement.create({
      data: {
        content,
        courseId: params.courseId,
      },
    });

    // Fetch users enrolled in the course
    const enrolledUsers = await db.purchase.findMany({
      where: {
        courseId: params.courseId,
      },
      select: {
        userId: true,
      },
    });
    // Create notifications for each enrolled user
    const notifications = enrolledUsers.map((enrollment) => ({
      userId: enrollment.userId,
      courseId: params.courseId,
      announcementId: newAnnouncement.id,
      isRead: false,
    }));

    console.log(notifications);
    await db.notification.createMany({ data: notifications });

    // Emit event for the new announcement (triggers v2 notifications + emails)
    const course = await db.course.findUnique({
      where: { id: params.courseId },
      select: { title: true, userId: true },
    });
    const announcer = await db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    eventBus.emit(EventName.ANNOUNCEMENT_CREATED, {
      announcementId: newAnnouncement.id,
      courseId: params.courseId,
      courseTitle: course?.title || "Course",
      content,
      teacherName: announcer?.name || "Teacher",
      timestamp: new Date(),
      triggeredBy: userId,
    });

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.log("[ANNOUNCEMENTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
