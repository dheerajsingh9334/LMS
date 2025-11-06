import { Category, Chapter, Course } from "@prisma/client";

import { db } from "@/lib/db";
import { getProgress } from "@/actions/Courses/get-progress";

type CourseWithProgressWithCategory = Course & {
  category: Category;
  chapters: Chapter[];
  progress: number | null;
};

type DashboardCourses = {
  completedCourses: CourseWithProgressWithCategory[];
  coursesInProgress: CourseWithProgressWithCategory[];
}

export const getDashboardCourses = async (userId: string): Promise<DashboardCourses> => {
  try {
    // Optimized: Only select necessary fields
    const purchasedCourses = await db.purchase.findMany({
      where: {
        userId: userId,
      },
      select: {
        course: {
          select: {
            id: true,
            userId: true,
            title: true,
            description: true,
            imageUrl: true,
            price: true,
            isPublished: true,
            isFree: true,
            learningOutcomes: true,
            categoryId: true,
            createdAt: true,
            updatedAt: true,
            category: {
              select: {
                id: true,
                name: true,
              }
            },
            chapters: {
              where: {
                isPublished: true,
              },
              select: {
                id: true,
              }
            }
          }
        }
      }
    });

    const courses = purchasedCourses.map((purchase) => purchase.course) as CourseWithProgressWithCategory[];

    // Parallel processing for better performance
    await Promise.all(
      courses.map(async (course) => {
        const {progressPercentage} = await getProgress(userId, course.id);
        course["progress"] = progressPercentage;
      })
    );

    const completedCourses = courses.filter((course) => course.progress === 100);
    const coursesInProgress = courses.filter((course) => (course.progress ?? 0) < 100);

    return {
      completedCourses,
      coursesInProgress,
    }
  } catch (error) {
    console.log("[GET_DASHBOARD_COURSES]", error);
    return {
      completedCourses: [],
      coursesInProgress: [],
    }
  }
}