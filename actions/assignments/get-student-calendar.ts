"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export async function getStudentAssignmentCalendar() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get all courses the student is enrolled in
    const purchases = await db.purchase.findMany({
      where: { userId },
      select: { courseId: true },
    });

    const enrolledCourseIds = purchases.map((p) => p.courseId);

    // Also get free courses with progress
    const freeCoursesWithProgress = await db.userProgress.findMany({
      where: { userId },
      select: { 
        chapter: {
          select: { courseId: true }
        }
      },
    });

    const freeEnrolledCourseIds = freeCoursesWithProgress.map((p) => p.chapter.courseId);
    const allCourseIds = Array.from(new Set([...enrolledCourseIds, ...freeEnrolledCourseIds]));

    if (allCourseIds.length === 0) {
      return { success: true, assignments: [], submissions: [] };
    }

    // Get all published assignments for enrolled courses
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

    // Get all submissions by the student
    const submissions = await db.assignmentSubmission.findMany({
      where: {
        studentId: userId,
        assignment: {
          courseId: { in: allCourseIds },
        },
      },
      include: {
        assignment: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return { success: true, assignments, submissions };
  } catch (error) {
    console.error("[GET_STUDENT_CALENDAR]", error);
    return { error: "Failed to fetch assignment calendar" };
  }
}

export async function getUpcomingAssignments(daysAhead: number = 7) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: "Unauthorized" };
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
          select: { courseId: true }
        }
      },
    });

    const freeEnrolledCourseIds = freeCoursesWithProgress.map((p) => p.chapter.courseId);
    const allCourseIds = Array.from(new Set([...enrolledCourseIds, ...freeEnrolledCourseIds]));

    if (allCourseIds.length === 0) {
      return { success: true, assignments: [] };
    }

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const assignments = await db.assignment.findMany({
      where: {
        courseId: { in: allCourseIds },
        isPublished: true,
        dueDate: {
          gte: now,
          lte: futureDate,
        },
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

    return { success: true, assignments };
  } catch (error) {
    console.error("[GET_UPCOMING_ASSIGNMENTS]", error);
    return { error: "Failed to fetch upcoming assignments" };
  }
}
