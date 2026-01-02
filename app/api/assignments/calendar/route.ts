import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get enrolled courses
    const purchases = await db.purchase.findMany({
      where: { userId },
      select: { courseId: true },
    });

    const enrolledCourseIds = purchases.map((p) => p.courseId);

    // Get free courses with progress
    const freeCoursesWithProgress = await db.userProgress.findMany({
      where: { userId },
      select: {
        chapter: {
          select: { courseId: true },
        },
      },
    });

    const freeEnrolledCourseIds = freeCoursesWithProgress.map(
      (p) => p.chapter.courseId
    );
    const allCourseIds = Array.from(
      new Set([...enrolledCourseIds, ...freeEnrolledCourseIds])
    );

    if (allCourseIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get all assignments for enrolled courses
    const assignments = await db.assignment.findMany({
      where: {
        courseId: { in: allCourseIds },
        isPublished: true,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
        chapter: {
          select: {
            id: true,
            title: true,
          },
        },
        submissions: {
          where: { studentId: userId },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.log("[ASSIGNMENTS_CALENDAR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
